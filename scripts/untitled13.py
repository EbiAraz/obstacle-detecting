# railway_gis_system.py
import cv2
import numpy as np
import time
import json
import threading
import queue
import os
import sys

# ML / Torch
import torch

# MQTT
import paho.mqtt.client as mqtt
!pip install flask
# Flask (dashboard)
from flask import Flask, render_template_string, Response, jsonify
from flask_cors import CORS

# Optional geolocation fallback
try:
    import geocoder
except Exception:
    geocoder = None

# Optional LiDAR (Open3D)
import importlib
_o3d_err_main = None
_o3d_err_cpu = None
o3d = None
try:
    import open3d as _o3d
    o3d = _o3d
except Exception as _e1:
    _o3d_err_main = _e1
    try:
        o3d = importlib.import_module("open3d.cpu.pybind")
        print("Open3D core imported via open3d.cpu.pybind; visualization disabled.")
    except Exception as _e2:
        _o3d_err_cpu = _e2
        o3d = None
        print("WARNING: Open3D import failed. LiDAR features disabled.")
        print("Details (open3d):", _o3d_err_main)
        print("Details (cpu.pybind):", _o3d_err_cpu)
        print("On Windows, installing VC++ x64 redistributable may be required.")

# -------------------------
# Configuration
# -------------------------
MQTT_BROKER = "broker.example.com"   # <-- آدرس بروکر خودت
MQTT_PORT = 1883
MQTT_TOPIC = "railway/obstacle_alerts"

YOLO_WEIGHTS = "yolov4.weights"      # مسیر فایل وزن
YOLO_CFG = "yolov4.cfg"              # مسیر cfg
COCO_NAMES = "coco.names"            # مسیر نام کلاس‌ها

CAMERA_INDEX = 0                     # اگر وب‌کم یا دوربین متفاوت داری مقدارش را عوض کن

# Fallback GPS coordinate (در صورت عدم دسترسی به GPS واقعی)
FALLBACK_LATLNG = [35.6892, 51.3890]  # تهران نمونه

# -------------------------
# MQTT helper (and a queue for Flask SSE)
# -------------------------
mqtt_publish_lock = threading.Lock()
sse_queue = queue.Queue()  # برای ارسال رویدادها به صفحه وب (SSE)

def send_alert(payload: dict):
    """ارسال هشدار به MQTT و ارسال به queue برای داشبورد"""
    try:
        msg = json.dumps(payload)
    except Exception:
        msg = str(payload)

    # Publish to MQTT
    try:
        client = mqtt.Client()
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.publish(MQTT_TOPIC, msg)
        client.disconnect()
    except Exception as e:
        print("MQTT publish failed:", e)

    # Put into SSE queue for dashboard
    try:
        sse_queue.put(msg)
    except Exception as e:
        print("SSE queue put failed:", e)


# -------------------------
# GPS helper
# -------------------------
def get_train_location():
    """
    تلاش می‌کنیم مختصات را از geocoder (IP-based) بگیریم،
    اگر نباشد از FALLBACK استفاده می‌کنیم.
    برای اتصال GPS واقعی این تابع را تغییر بده.
    """
    try:
        if geocoder:
            g = geocoder.ip("me")
            if g.ok and g.latlng:
                return g.latlng
    except Exception:
        pass
    return FALLBACK_LATLNG


# -------------------------
# LiDAR helper (Open3D)
# -------------------------
def lidar(file_lidar: str):
    """
    بارگذاری و نمونه‌گیری و اکسل کردن یک point cloud از فایل.
    فایل می‌تواند .ply یا .pcd باشد.
    """
    if o3d is None:
        raise ImportError(
            "Open3D is not installed or failed to import. "
            "LiDAR features are disabled. To enable, install 'open3d' and the "
            "Microsoft Visual C++ 2015-2022 Redistributable (x64) on Windows."
        )
    if not os.path.exists(file_lidar):
        raise FileNotFoundError(f"LiDAR file not found: {file_lidar}")
    pcd = o3d.io.read_point_cloud(file_lidar)
    down = pcd.voxel_down_sample(voxel_size=0.5)
    return down


# -------------------------
# ساده‌ترین مدل Torch (مثال)
# -------------------------
class RailwayObstacleModel(torch.nn.Module):
    def __init__(self, in_features=1024):
        super(RailwayObstacleModel, self).__init__()
        self.fc1 = torch.nn.Linear(in_features, 512)
        self.fc2 = torch.nn.Linear(512, 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x =torch.sigmoid(self.fc2(x))


        return x

# model = RailwayObstacleModel()  # اگر خواستی ازش استفاده کن


# -------------------------
# بارگذاری YOLO
# -------------------------
if not os.path.exists(YOLO_WEIGHTS) or not os.path.exists(YOLO_CFG) or not os.path.exists(COCO_NAMES):
    print("WARNING: YOLO files not found. Make sure yolov4.weights, yolov4.cfg and coco.names exist.")
    # ادامه می‌دهیم اما detection کار نخواهد کرد بدون فایل‌ها

# Load classes
classes = []
try:
    with open(COCO_NAMES, "r") as f:
        classes = [line.strip() for line in f.readlines()]
except Exception:
    classes = []

# Load network
net = None
out_layers = []
layer_names = []
try:
    net = cv2.dnn.readNet(YOLO_WEIGHTS, YOLO_CFG)
    layer_names = net.getLayerNames()
    # getUnconnectedOutLayers ممکن است آرایه‌ای از آرایه‌ها برگرداند، پس ایمن‌سازی:
    unconnected = net.getUnconnectedOutLayers()
    out_layers = [layer_names[i - 1] for i in unconnected.flatten()]
except Exception as e:
    print("YOLO load failed:", e)
    net = None


# -------------------------
# Flask app (Dashboard + SSE)
# -------------------------
app = Flask(__name__)
CORS(app)

HTML_TEMPLATE = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Railway Obstacle Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map { height: 88vh; width: 100%; }
    body { margin:0; padding:0; font-family: Arial; }
    #header { padding:8px; background:#222; color:white; }
  </style>
</head>
<body>
  <div id="header">
    <strong>Railway Obstacle Dashboard</strong>
    <span id="status" style="margin-left:20px">Connecting...</span>
  </div>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([{{lat}}, {{lng}}], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // SSE connect
    var evtSource = new EventSource('/stream');
    evtSource.onopen = function() {
      document.getElementById('status').innerText = "Connected";
    };
    evtSource.onerror = function() {
      document.getElementById('status').innerText = "Connection error";
    };
    evtSource.onmessage = function(e) {
      try {
        var data = JSON.parse(e.data);
      } catch(err){
        console.error("invalid data", e.data);
        return;
      }
      var lat = data.latitude || {{lat}};
      var lng = data.longitude || {{lng}};
      var popup = "<b>Alert:</b> " + (data.alert || "Unknown") + "<br><b>time:</b> " + new Date((data.timestamp||Date.now())*1000).toLocaleString();
      L.marker([lat, lng]).addTo(map).bindPopup(popup).openPopup();
    };
  </script>
</body>
</html>
"""

@app.route("/")
def index():
    lat, lng = get_train_location()
    return render_template_string(HTML_TEMPLATE, lat=lat, lng=lng)

@app.route("/stream")
def stream():
    def event_stream():
        while True:
            try:
                msg = sse_queue.get()  # blocking
                yield f"data: {msg}\n\n"
            except GeneratorExit:
                break
            except Exception as e:
                print("SSE error:", e)
                time.sleep(0.1)
    return Response(event_stream(), mimetype="text/event-stream")


def start_flask_thread(host="0.0.0.0", port=5000):
    t = threading.Thread(target=lambda: app.run(host=host, port=port, debug=False, use_reloader=False), daemon=True)
    t.start()
    print(f"Flask dashboard started at http://{host}:{port}")


# -------------------------
def detection_loop():
    camera = cv2.VideoCapture(CAMERA_INDEX)
    if not camera.isOpened():
        print("Camera not opened. Exiting detection loop.")
        return

    # parameters
    conf_threshold = 0.5
    nms_threshold = 0.4
    danger_objects = set(["person", "dog", "cat", "car", "truck", "bus", "motorbike", "bicycle"])

    while True:
        ret, frame = camera.read()
        if not ret:
            print("Camera read failed, stopping.")
            break

        height, width = frame.shape[:2]

        if net is None:
            # اگر YOLO لود نشده فقط فریم را نمایش می‌کنیم
            cv2.imshow("Railway Camera", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            continue

        blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416,416), swapRB=True, crop=False)
        net.setInput(blob)
        outs = net.forward(out_layers)

        class_ids = []
        confidences = []
        boxes = []

        for out in outs:
            for detection in out:
                scores = detection[5:]
                if len(scores) == 0:
                    continue
                classid = int(np.argmax(scores))
                confidence = float(scores[classid])
                if confidence > conf_threshold:
                    center_x = int(detection[0] * width)
                    center_y = int(detection[1] * height)
                    w = int(detection[2] * width)
                    h = int(detection[3] * height)
                    x = int(center_x - w / 2)
                    y = int(center_y - h / 2)
                    boxes.append([x, y, w, h])
                    confidences.append(confidence)
                    class_ids.append(classid)

        # NMS
        indexes = []
        if len(boxes) > 0:
            idxs = cv2.dnn.NMSBoxes(boxes, confidences, conf_threshold, nms_threshold)
            # idxs can be a list of lists or an empty tuple
            if isinstance(idxs, (list, tuple, np.ndarray)):
                indexes = [int(i) for sub in idxs for i in (sub if isinstance(sub, (list,tuple,np.ndarray)) else [sub])]
            else:
                try:
                    indexes = idxs.flatten().tolist()
                except Exception:
                    indexes = []

        # draw and possibly alert
        alerted = False
        for i in range(len(boxes)):
            if i in indexes:
                x, y, w, h = boxes[i]
                class_name = classes[class_ids[i]] if classes and class_ids[i] < len(classes) else str(class_ids[i])
                confidence = confidences[i]
                label_text = f"{class_name} {confidence:.2f}"
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                cv2.putText(frame, label_text, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 1)

                # اگر شی خطرناک بود، هشدار بفرست
                if class_name.lower() in danger_objects and not alerted:
                    alerted = True
                    lat, lng = get_train_location()
                    payload = {
                        "alert": f"{class_name} detected",
                        "class": class_name,
                        "confidence": float(confidence),
                        "latitude": lat,
                        "longitude": lng,
                        "timestamp": time.time()
                    }
                    print("ALERT:", payload)
                    send_alert(payload)
                    # اگر خواستی برای کاهش ارسال مکرر این خط را کامنت کن یا زمان تاخیر را تغییر بده
                    time.sleep(1.0)

        cv2.imshow("Railway Camera", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    camera.release()
    cv2.destroyAllWindows()
    camera.release()
    cv2.destroyAllWindows()


# -------------------------
# Start everything
# -------------------------
if __name__ == "__main__":
    # 1) Start Flask dashboard on separate thread
    start_flask_thread(host="0.0.0.0", port=5000)

    # 2) Start detection loop (main thread)
    try:
        detection_loop()
    except KeyboardInterrupt:
        print("Interrupted by user, exiting.")
    except Exception as e:
        print("Error in detection loop:", e)
    finally:
        print("Shutting down.")