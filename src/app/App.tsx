import { useState, useEffect, useRef } from "react";
import {
  Train, Shield, Brain, Bell, Activity, AlertTriangle, CheckCircle,
  Thermometer, Wind, Cloud, Camera, Wrench, Network, Award, ArrowRight,
  Wifi, Lock, Monitor, Zap, BarChart2, TrendingUp, TrendingDown,
  MapPin, Clock, Settings, FileText, Database, ChevronRight,
  DollarSign, Leaf, Download, Calendar, Filter, Cpu,
  AlertCircle, Eye, RefreshCw, Radio, Gauge, Server, Users,
  List, Heart, ClipboardList, Stethoscope, LayoutDashboard,
  ChevronDown, Play, RotateCcw, Info
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import aimlImg      from "@/imports/AI_ML_pipeline_3.png";
import certImg      from "@/imports/Certification_Roadmap.png";
import predictImg   from "@/imports/image_4_-_Predictive_Maintenance_Dashboard.png";
import archFeatImg  from "@/imports/System_Architecture_-_features_deck-1.png";
import archInvImg      from "@/imports/System_Architecture_-_investor_deck.png";
import trainHeaderImg  from "@/imports/image_5_-_Control_centre_Dashboard_-_FRANCE_1-1.png";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Tab = "france"|"hmi"|"executive"|"maintenance"|"arch-feat"|"arch-inv"|"pipeline"|"certification";

// â”€â”€â”€ Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  bg0:"#040c18", bg1:"#071220", bg2:"#0a1628",
  border:"rgba(0,180,216,0.18)",
  blue:"#00b4d8", cyan:"#00e5ff", green:"#00e676",
  amber:"#ff9800", red:"#ff1744", purple:"#7c4dff",
  txt:"#ddeeff", txt2:"#7a9db5", txt3:"#3a5a7a",
};
const hue = (v:number) => v>=90?C.green:v>=75?C.blue:v>=60?C.amber:C.red;

// â”€â”€â”€ Control Centre Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STOPS = [
  {n:"Mauguio",        km:0,   spd:null as number|null, tmp:null as number|null},
  {n:"Dijon",          km:288, spd:284, tmp:18.7},
  {n:"Lyon",           km:485, spd:267, tmp:20.2},
  {n:"Valence",        km:550, spd:298, tmp:17.0},
  {n:"Aix-en-Provence",km:710, spd:283, tmp:18.0},
  {n:"Marseille",      km:775, spd:121, tmp:22.1},
  {n:"Toulon",         km:813, spd:134, tmp:20.5},
  {n:"Cannes",         km:893, spd:96,  tmp:22.0},
  {n:"Nice",           km:956, spd:105, tmp:23.0},
  {n:"Monaco",         km:960, spd:51,  tmp:21.7},
];
const SENSORS = [
  {name:"LIDAR",            conf:99,  st:"ACTIVE"},
  {name:"Radar",            conf:97,  st:"ACTIVE"},
  {name:"RGB Camera",       conf:96,  st:"ACTIVE"},
  {name:"Thermal Camera",   conf:95,  st:"ACTIVE"},
  {name:"GPS / GNSS",       conf:99,  st:"ACTIVE"},
  {name:"IMU / Gyro",       conf:98,  st:"ACTIVE"},
  {name:"Track Sensors",    conf:97,  st:"ACTIVE"},
  {name:"AI Fusion Engine", conf:100, st:"SYNCED"},
];

// Real GPS coordinates: Paris â†’ Monaco route
const GPS_ROUTE:[number,number][] = [
  [48.8566, 2.3522],  // Paris
  [47.3220, 5.0415],  // Dijon
  [45.7640, 4.8357],  // Lyon
  [44.9273, 4.8886],  // Valence
  [43.9493, 4.8059],  // Avignon (train position)
  [43.2965, 5.3698],  // Marseille
  [43.1242, 5.9280],  // Toulon
  [43.5528, 7.0174],  // Cannes
  [43.7102, 7.2620],  // Nice
  [43.7396, 7.4269],  // Monaco
];
const TRAIN_POS:[number,number] = [43.9493, 4.8059]; // Avignon
const MAINT_SYS = [
  {name:"Braking System",  pct:87, lbl:"Good"},
  {name:"Battery System",  pct:72, lbl:"Monitor"},
  {name:"Suspension",      pct:92, lbl:"Excellent"},
  {name:"Traction Motor",  pct:81, lbl:"Good"},
  {name:"HVAC System",     pct:85, lbl:"Good"},
  {name:"Power Converter", pct:95, lbl:"Excellent"},
  {name:"Pantograph",      pct:90, lbl:"Good"},
  {name:"Wheel Sets",      pct:78, lbl:"Monitor"},
];
const OBSTACLES = [
  {time:"12:03:12",type:"Animal on Track",     loc:"Cannes 44.0302, 7.7718",      sev:"HIGH",conf:86},
  {time:"12:04:45",type:"Track Debris",        loc:"Avignon 43.9493, 4.8059",     sev:"MED", conf:74},
  {time:"11:07:42",type:"Track Debris",        loc:"Toulouse 43.6047, 1.4442",    sev:"HIGH",conf:94},
  {time:"12:12:52",type:"Road Vehicle",        loc:"Region VII 41.1812, 6.485",   sev:"LOW", conf:91},
];
const EVENTS = [
  {time:"12:03:31",desc:"Train Selected (Real-Time)",                 t:"info"    },
  {time:"12:08:31",desc:"Track Debris Detected (Camera)",             t:"warn"    },
  {time:"12:14:30",desc:"Excessive Rain Warning (Weather)",           t:"warn"    },
  {time:"12:18:00",desc:"Construction Equipment Detected (Arcs)",     t:"critical"},
  {time:"12:22:00",desc:"Speed Reduction Confirmed (Deceleration)",   t:"info"    },
  {time:"12:25:00",desc:"AI Systems Technical Removal",               t:"info"    },
] as const;
const ROUTE_SVG = [
  {label:"Paris",     x:28,  y:16},
  {label:"Dijon",     x:72,  y:40},
  {label:"Lyon",      x:90,  y:68},
  {label:"Avignon",   x:118, y:95},  // train
  {label:"Marseille", x:158, y:118},
  {label:"Cannes",    x:212, y:105},
  {label:"Monaco",    x:250, y:98},
];

// â”€â”€â”€ Executive Analytics Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SAFETY_TREND    = [{m:"Aug",v:32},{m:"Sep",v:38},{m:"Oct",v:42},{m:"Nov",v:39},{m:"Dec",v:44},{m:"Jan",v:47}];
const FLEET_AVAIL     = [{r:"Paris-Monaco",v:96},{r:"Lyon-Marseille",v:92},{r:"Nice-Lyon",v:94},{r:"Bordeaux-Paris",v:88},{r:"Toulouse-Paris",v:91}];
const INC_TYPES       = [{name:"Animal on Track",value:40,color:"#ff9800"},{name:"Track Debris",value:30,color:"#ff1744"},{name:"Weather",value:15,color:"#00b4d8"},{name:"Vehicle",value:10,color:"#7c4dff"},{name:"Other",value:5,color:"#5a8aaa"}];
const OTP_TREND       = [{m:"Aug",v:88.2},{m:"Sep",v:89.5},{m:"Oct",v:89.1},{m:"Nov",v:90.8},{m:"Dec",v:91.5},{m:"Jan",v:92.1}];
const MAINT_COST_TREND= [{m:"Aug",v:3.2},{m:"Sep",v:2.9},{m:"Oct",v:2.7},{m:"Nov",v:2.6},{m:"Dec",v:2.5},{m:"Jan",v:2.4}];
const AI_DET_TREND    = [{m:"Aug",v:8200},{m:"Sep",v:9800},{m:"Oct",v:11200},{m:"Nov",v:12100},{m:"Dec",v:13500},{m:"Jan",v:14291}];
const FLEET_COMP      = [{name:"High Speed",value:62,color:"#00b4d8"},{name:"Regional",value:58,color:"#00e676"},{name:"Maintenance",value:36,color:"#ff9800"}];
const FLEET_UTIL      = [{r:"Paris-Monaco",active:85,idle:10,maint:5},{r:"Lyon-Marseille",active:78,idle:15,maint:7},{r:"Nice-Lyon",active:90,idle:8,maint:2},{r:"Bordeaux",active:72,idle:20,maint:8}];
const TOP_RISKS       = [{loc:"Avignon Sector",risk:"HIGH",cnt:12},{loc:"Lyon Station",risk:"MED",cnt:8},{loc:"Marseille Junction",risk:"MED",cnt:6},{loc:"Cannes Approach",risk:"LOW",cnt:4},{loc:"Nice Terminal",risk:"LOW",cnt:3}];
const EXEC_ALERTS     = [{type:"Global",cnt:0,c:"#5a8aaa"},{type:"Warning",cnt:3,c:"#ff9800"},{type:"Critical",cnt:1,c:"#ff1744"},{type:"Info",cnt:12,c:"#00b4d8"},{type:"Re-Monitored",cnt:2,c:"#7c4dff"}];
const PERF_BY_ROUTE   = [{route:"Paris-Monaco",otp:92.1,inc:8,avail:96},{route:"Lyon-Marseille",otp:89.5,inc:12,avail:92},{route:"Nice-Lyon",otp:94.0,inc:5,avail:94},{route:"Bordeaux-Paris",otp:87.2,inc:15,avail:88},{route:"Toulouse-Paris",otp:91.0,inc:7,avail:91}];

// â”€â”€â”€ Shared Atoms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Row({children,className=""}:{children:React.ReactNode;className?:string}){
  return <div className={`flex items-center gap-1 ${className}`}>{children}</div>;
}
function Dot({c}:{c:string}){
  return <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{background:c}}/>;
}
function PBar({v,c,h=3}:{v:number;c:string;h?:number}){
  return(
    <div className="w-full rounded-full overflow-hidden" style={{height:h,background:C.bg0}}>
      <div className="h-full rounded-full" style={{width:`${Math.min(v,100)}%`,background:c}}/>
    </div>
  );
}
function Pill({label,c}:{label:string;c:string}){
  return(
    <span className="text-[6.5px] font-bold px-1 py-0.5 rounded"
      style={{color:c,background:c+"22",border:`1px solid ${c}44`}}>
      {label}
    </span>
  );
}
function Panel({title,right,children,className=""}:{title?:string;right?:React.ReactNode;children:React.ReactNode;className?:string}){
  return(
    <div className={`flex flex-col rounded overflow-hidden ${className}`}
      style={{background:C.bg2,border:`1px solid ${C.border}`}}>
      {title&&(
        <div className="shrink-0 flex items-center justify-between px-2 py-[3px]"
          style={{background:C.bg1,borderBottom:`1px solid ${C.border}`}}>
          <span className="text-[8.5px] font-bold tracking-widest uppercase" style={{color:C.blue}}>{title}</span>
          {right&&<span className="text-[7px]" style={{color:C.txt2}}>{right}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
function SevPill({sev}:{sev:string}){
  const sc:Record<string,string>={HIGH:C.red,MED:C.amber,LOW:C.green};
  return <Pill label={sev} c={sc[sev]??C.txt2}/>;
}

// â”€â”€â”€ CONTROL CENTRE COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// HUD corner bracket helper
function Bracket({w,h,c,t=2}:{w:number;h:number;c:string;t?:number}){
  const s=Math.min(w,h)*0.28;
  return(
    <svg width={w} height={h} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      {/* TL */}<polyline points={`0,${s} 0,0 ${s},0`} fill="none" stroke={c} strokeWidth={t}/>
      {/* TR */}<polyline points={`${w-s},0 ${w},0 ${w},${s}`} fill="none" stroke={c} strokeWidth={t}/>
      {/* BR */}<polyline points={`${w},${h-s} ${w},${h} ${w-s},${h}`} fill="none" stroke={c} strokeWidth={t}/>
      {/* BL */}<polyline points={`${s},${h} 0,${h} 0,${h-s}`} fill="none" stroke={c} strokeWidth={t}/>
    </svg>
  );
}

function CCHeader(){
  const [activeKpi,setActiveKpi]=useState<string|null>(null);
  const kpis=[
    {ic:<Shield size={11}/>,       l:"Safety Score",  v:"96",     sub:"OK Excellent",         c:C.green,  detail:"SIL-4 certified | All safety barriers active | 0 critical failures"},
    {ic:<AlertTriangle size={11}/>, l:"Threat Level",  v:"Low",    sub:"No Immediate Risk",   c:C.green,  detail:"No obstacles within 200m | Track clear | Weather nominal"},
    {ic:<Brain size={11}/>,         l:"AI Confidence", v:"98.2%",  sub:"Model v3.1.0",        c:C.blue,   detail:"8 sensors fused | Prediction horizon 30s | Latency 12ms"},
    {ic:<Bell size={11}/>,          l:"Active Alerts", v:"10",     sub:"4 High | 6 Low",      c:C.amber,  detail:"4 obstacle alerts | 3 maintenance | 3 weather advisories"},
    {ic:<Activity size={11}/>,      l:"System Uptime", v:"99.98%", sub:"All Systems Nominal", c:C.green,  detail:"Last restart: 12 Jan 2026 | 16 days continuous | No faults"},
  ];
  return(
    <div className="shrink-0 flex flex-col" style={{background:C.bg0,borderBottom:`1px solid ${C.border}`}}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        {/* Brand - actual uploaded TGV image (FRANCE_1-1.png) */}
        <div className="shrink-0 pr-3" style={{borderRight:`1px solid ${C.border}`}}>
          <ImageWithFallback
            src={trainHeaderImg}
            alt="TGV Paris to Monaco"
            style={{height:72,width:"auto",objectFit:"contain",objectPosition:"left center",
              display:"block",borderRadius:6}}
          />
        </div>
        {/* KPI chips - all clickable */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {kpis.map(({ic,l,v,sub,c})=>(
            <button key={l}
              onClick={()=>setActiveKpi(activeKpi===l?null:l)}
              className="flex items-center gap-1.5 px-2 py-1 rounded shrink-0 transition-all"
              style={{background:activeKpi===l?c+"22":c+"0f",
                border:`1px solid ${activeKpi===l?c:c+"30"}`,
                cursor:"pointer",outline:"none"}}>
              <span style={{color:c}}>{ic}</span>
              <div>
                <div style={{fontSize:7,color:C.txt2,lineHeight:1,marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:800,lineHeight:1,color:c,fontFamily:"monospace"}}>{v}</div>
                {sub&&<div style={{fontSize:6.5,color:C.txt2,marginTop:2}}>{sub}</div>}
              </div>
            </button>
          ))}
        </div>
        {/* Clock */}
        <div className="shrink-0 text-right pl-2" style={{borderLeft:`1px solid ${C.border}`}}>
          <div style={{fontSize:7.5,color:C.txt2}}>28 Jan 2026</div>
          <div style={{fontSize:15,fontWeight:800,color:C.txt,fontFamily:"monospace"}}>12:25:31</div>
          <div style={{fontSize:7,color:C.txt2}}>(UTC +01:00)</div>
        </div>
      </div>
      {/* KPI detail drawer */}
      {activeKpi&&(()=>{const kpi=kpis.find(k=>k.l===activeKpi)!;return(
        <div className="px-3 py-1.5 flex items-center gap-2"
          style={{background:kpi.c+"0a",borderTop:`1px solid ${kpi.c}20`}}>
          <span style={{color:kpi.c}}>{kpi.ic}</span>
          <span style={{fontSize:7.5,fontWeight:700,color:kpi.c}}>{kpi.l}:</span>
          <span style={{fontSize:7.5,color:C.txt2}}>{kpi.detail}</span>
          <button onClick={()=>setActiveKpi(null)}
            style={{marginLeft:"auto",fontSize:7,color:C.txt3,background:"none",border:"none",cursor:"pointer"}}>x Close</button>
        </div>
      );})()}
    </div>
  );
}

function JourneyOverview(){
  return(
    <Panel title="Journey Overview" className="h-full">
      <div className="p-1.5 flex flex-col gap-1 flex-1 overflow-hidden">
        {/* Top 3 stats */}
        <div className="grid grid-cols-3 gap-0.5 shrink-0">
          {[["Total Dist.","960 km",C.blue],["1-way Speed","289 km/h",C.blue],["Granule","10",C.green]].map(([l,v,c])=>(
            <div key={l as string} className="rounded p-1 text-center" style={{background:C.bg0}}>
              <div style={{fontSize:6.5,color:C.txt2}}>{l}</div>
              <div style={{fontSize:9,fontWeight:700,fontFamily:"monospace",color:c as string}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Column headers */}
        <div className="grid shrink-0 px-0.5" style={{gridTemplateColumns:"1fr 28px 28px 28px"}}>
          {["Stop","km","km/h","degC"].map(h=>(
            <div key={h} style={{fontSize:6,color:C.txt3,textAlign:h==="Stop"?"left":"right"}}>{h}</div>
          ))}
        </div>
        {/* Stops */}
        <div className="flex-1 overflow-hidden">
          {STOPS.map((s,i)=>(
            <div key={i} className="grid items-center px-0.5 rounded"
              style={{gridTemplateColumns:"1fr 28px 28px 28px",paddingTop:2,paddingBottom:2,
                background:i%2===0?"transparent":"rgba(13,31,53,0.7)"}}>
              <div className="flex items-center gap-1">
                <span className="shrink-0" style={{
                  display:"inline-block",width:6,height:6,borderRadius:"50%",
                  background:i===0?C.green:i===STOPS.length-1?C.amber:"transparent",
                  border:i>0&&i<STOPS.length-1?`1px solid ${C.blue}55`:"none",
                }}/>
                <span style={{fontSize:7.5,color:C.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {i+1}. {s.n}
                </span>
              </div>
              <div style={{fontSize:7,color:C.txt2,textAlign:"right",fontFamily:"monospace"}}>{s.km}</div>
              <div style={{fontSize:7,textAlign:"right",fontFamily:"monospace",color:s.spd?C.blue:C.txt3}}>{s.spd??"-"}</div>
              <div style={{fontSize:7,textAlign:"right",fontFamily:"monospace",color:s.tmp!=null?C.amber:C.txt3}}>{s.tmp!=null?s.tmp:"-"}</div>
            </div>
          ))}
        </div>
        {/* Complete badge */}
        <div className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{background:C.green+"10",border:`1px solid ${C.green}25`}}>
          <CheckCircle size={8} style={{color:C.green}}/>
          <span style={{fontSize:7,fontWeight:700,color:C.green}}>Journey Completed Successfully</span>
        </div>
      </div>
    </Panel>
  );
}

function AIVisionPanel(){
  return(
    <Panel className="h-full">
      {/* Panel header */}
      <div className="shrink-0 flex items-center justify-between px-2 py-[3px]"
        style={{background:C.bg1,borderBottom:`1px solid ${C.border}`}}>
        <div className="flex items-center gap-2">
          <span style={{fontSize:8,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:C.blue}}>
            AI Vision &amp; Obstacle Detection
          </span>
          <span className="flex items-center gap-1 px-1.5 rounded"
            style={{fontSize:7,fontWeight:700,background:"#ff174420",border:"1px solid #ff174455",color:C.red,paddingTop:2,paddingBottom:2}}>
            <span className="animate-pulse" style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:C.red}}/>
            LIVE
          </span>
        </div>
        <span className="flex items-center gap-1" style={{fontSize:7,color:C.txt2}}>
          <Camera size={8}/> Camera/Drone Feed â–¾
        </span>
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden" style={{background:"#041209",minHeight:80}}>
        {/* Scene background â€” SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 310" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="camSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#071e2d"/>
              <stop offset="35%" stopColor="#082310"/>
              <stop offset="100%" stopColor="#020b04"/>
            </linearGradient>
            <radialGradient id="horizonGlow" cx="50%" cy="42%" r="28%">
              <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.08"/>
              <stop offset="100%" stopColor="#00b4d8" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="trackGlow" cx="50%" cy="100%" r="50%">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Sky */}
          <rect width="600" height="310" fill="url(#camSky)"/>

          {/* Distant mountain ridge â€“ layered */}
          <path d="M0,175 L40,130 L80,155 L120,110 L165,140 L200,105 L240,128 L280,95 L320,118 L360,90 L400,115 L440,100 L480,125 L520,95 L560,118 L600,105 L600,310 L0,310Z"
            fill="#061a0a" opacity="0.95"/>
          <path d="M0,200 L50,168 L100,188 L150,165 L200,180 L250,162 L300,178 L350,160 L400,175 L450,162 L500,177 L550,165 L600,175 L600,310 L0,310Z"
            fill="#051408" opacity="0.9"/>
          {/* Foreground treeline */}
          <path d="M0,222 L30,205 L55,215 L80,200 L108,210 L135,198 L160,208 L185,196 L210,206 L235,197 L260,205 L285,198 L310,206 L335,197 L360,207 L385,197 L410,205 L435,198 L460,207 L490,196 L520,208 L550,197 L575,207 L600,200 L600,310 L0,310Z"
            fill="#041009" opacity="0.85"/>

          {/* Horizon glow */}
          <rect width="600" height="310" fill="url(#horizonGlow)"/>

          {/* --- Track bed --- */}
          {/* Ballast gravel area */}
          <path d="M300,310 L240,188 L360,188 Z" fill="#0d1e0b" opacity="0.5"/>

          {/* Left rail outer */}
          <line x1="300" y1="310" x2="236" y2="188" stroke="#1e4a1c" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Left rail inner */}
          <line x1="300" y1="310" x2="252" y2="188" stroke="#1e4a1c" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Right rail inner */}
          <line x1="300" y1="310" x2="348" y2="188" stroke="#1e4a1c" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Right rail outer */}
          <line x1="300" y1="310" x2="364" y2="188" stroke="#1e4a1c" strokeWidth="2.5" strokeLinecap="round"/>

          {/* Sleepers / ties */}
          {[192,202,214,228,244,264,286,312].map((y,i)=>{
            const p=(y-188)/122; const hw=6+p*54;
            const thick=1+p*2.5;
            return(
              <g key={i}>
                <line x1={300-hw} y1={y} x2={300+hw} y2={y} stroke="#1a3a18" strokeWidth={thick} opacity="0.75"/>
              </g>
            );
          })}

          {/* Overhead catenary mast left */}
          <line x1="240" y1="188" x2="210" y2="100" stroke="#1a3a5c" strokeWidth="0.8" opacity="0.5"/>
          <line x1="210" y1="100" x2="300" y2="92" stroke="#1a3a5c" strokeWidth="0.6" opacity="0.4"/>
          {/* Overhead catenary mast right */}
          <line x1="360" y1="188" x2="390" y2="100" stroke="#1a3a5c" strokeWidth="0.8" opacity="0.5"/>
          <line x1="390" y1="100" x2="300" y2="92" stroke="#1a3a5c" strokeWidth="0.6" opacity="0.4"/>
          {/* Drop wires */}
          {[246,263,278,291,309,322,337,354].map((x,i)=>(
            <line key={i} x1={x} y1="92" x2={x+(300-x)*0.1} y2="188" stroke="#1a3a5c" strokeWidth="0.4" opacity="0.3"/>
          ))}

          {/* Track glow */}
          <rect width="600" height="310" fill="url(#trackGlow)"/>

          {/* AI scan lines */}
          {[0,52,104,156,208,260,310].map(y=>(
            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke={C.blue} strokeWidth="0.25" opacity="0.06"/>
          ))}
        </svg>

        {/* Detection box â€” Construction Equipment (amber, HUD brackets) */}
        <div className="absolute" style={{top:"8%",left:"5%",width:130,height:58,position:"absolute"}}>
          <Bracket w={130} h={58} c={C.amber} t={1.5}/>
          <div style={{background:"rgba(255,152,0,0.06)",position:"absolute",inset:0}}/>
          <div style={{position:"absolute",top:4,left:6}}>
            <div style={{fontSize:7,fontWeight:700,color:C.amber}}>Construction Equipment</div>
            <div style={{fontSize:6,color:C.amber+"bb"}}>Conf: 94.2% Â |  âš  Obstacle</div>
          </div>
        </div>

        {/* Detection box â€” Routine Inspection (blue, HUD brackets) */}
        <div className="absolute" style={{top:"12%",right:"6%",width:118,height:54,position:"absolute"}}>
          <Bracket w={118} h={54} c={C.blue} t={1.5}/>
          <div style={{background:"rgba(0,180,216,0.05)",position:"absolute",inset:0}}/>
          <div style={{position:"absolute",top:4,left:6}}>
            <div style={{fontSize:7,fontWeight:700,color:C.blue}}>Routine Inspection</div>
            <div style={{fontSize:6,color:C.blue+"bb"}}>Conf: 88.1% Â |  Safe</div>
          </div>
        </div>

        {/* AI targeting reticle â€” center */}
        <div className="absolute" style={{top:"42%",left:"50%",transform:"translate(-50%,-50%)"}}>
          <svg width="50" height="50" viewBox="0 0 50 50" opacity="0.55">
            <line x1="25" y1="0"  x2="25" y2="16" stroke={C.cyan} strokeWidth="1"/>
            <line x1="25" y1="34" x2="25" y2="50" stroke={C.cyan} strokeWidth="1"/>
            <line x1="0"  y1="25" x2="16" y2="25" stroke={C.cyan} strokeWidth="1"/>
            <line x1="34" y1="25" x2="50" y2="25" stroke={C.cyan} strokeWidth="1"/>
            <circle cx="25" cy="25" r="10" stroke={C.cyan} strokeWidth="1" fill="none"/>
            <circle cx="25" cy="25" r="2.5" fill={C.cyan}/>
          </svg>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-1.5">
          {/* Metrics */}
          <div className="flex items-center gap-1">
            {[
              {l:"Speed",    v:"12.4 km/s", c:C.blue},
              {l:"Train Dist.",v:"173 km",  c:C.green},
              {l:"Obstacle", v:"43.2 m",    c:C.amber},
            ].map(({l,v,c})=>(
              <div key={l} className="px-1.5 py-0.5 rounded"
                style={{background:"rgba(4,8,18,0.88)",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:6.5,color:C.txt2}}>{l}</div>
                <div style={{fontSize:9,fontWeight:700,fontFamily:"monospace",color:c}}>{v}</div>
              </div>
            ))}
          </div>
          {/* Reduce speed warning */}
          <div className="flex items-center gap-1 px-2 py-1 rounded"
            style={{background:"rgba(255,23,68,0.18)",border:`1px solid ${C.red}66`}}>
            <AlertTriangle size={9} style={{color:C.red}}/>
            <span style={{fontSize:8,fontWeight:700,color:C.red}}>âš  Reduce Speed</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// â”€â”€â”€ Blue TGV Train SVG â€” pixel-matched to FRANCE-4 radar centre train â”€â”€â”€â”€â”€â”€â”€â”€
function BlueTGVInRadar(){
  return(
    <svg viewBox="0 0 110 52" width="110" height="52" style={{overflow:"visible"}}>
      <defs>
        <linearGradient id="bBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5a9de0"/>
          <stop offset="40%"  stopColor="#3a7acc"/>
          <stop offset="100%" stopColor="#1f5aaa"/>
        </linearGradient>
        <linearGradient id="bNose" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#4488cc"/>
          <stop offset="100%" stopColor="#2266aa"/>
        </linearGradient>
        <linearGradient id="bUnder" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a2a40"/>
          <stop offset="100%" stopColor="#0a1628"/>
        </linearGradient>
        <linearGradient id="bCab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#0a1e36"/>
          <stop offset="100%" stopColor="#162840"/>
        </linearGradient>
        <linearGradient id="bReflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3a7acc" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#3a7acc" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="bStripe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#88ccff"/>
          <stop offset="100%" stopColor="#66aaee"/>
        </linearGradient>
        <filter id="bGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* â”€â”€ TRAIN â”€â”€ */}
      {/* Undercarriage */}
      <path d="M6,30 L90,30 Q97,30 100,33 L102,36 L4,36 Q5,33 6,30 Z"
        fill="url(#bUnder)"/>
      {/* Bogies */}
      {[18,54,82].map(cx=>(
        <g key={cx}>
          <rect x={cx-10} y="34" width="20" height="6" rx="1.5" fill="#0a1628"/>
          {[-6,6].map(dx=>(
            <circle key={dx} cx={cx+dx} cy="39" r="4" fill="#08121e" stroke="#1a2a3a" strokeWidth="0.8"/>
          ))}
        </g>
      ))}
      {/* Main body */}
      <path d="M6,8 L82,8 Q90,8 96,14 Q100,19 99,25 Q97,30 90,30 L6,30 Q3,30 2,26 L2,12 Q3,8 6,8 Z"
        fill="url(#bBody)" filter="url(#bGlow)"/>
      {/* Roof highlight */}
      <path d="M6,8 Q40,5 82,8 L82,11 Q40,8 6,11 Z"
        fill="#7ab8f0" opacity="0.4"/>
      {/* Light blue accent stripe â€” runs full length */}
      <rect x="2" y="22" width="99" height="5" fill="url(#bStripe)" opacity="0.6"/>
      {/* Darker lower body band */}
      <rect x="2" y="27" width="97" height="3" fill="#1a4a88" opacity="0.7"/>
      {/* Passenger windows â€” upper */}
      {[8,20,32,44,56,68].map(x=>(
        <rect key={x} x={x} y="10" width="10" height="9" rx="1.5"
          fill="#c8dff8" opacity="0.85"/>
      ))}
      {/* Window frames */}
      {[8,20,32,44,56,68].map(x=>(
        <rect key={x} x={x} y="10" width="10" height="9" rx="1.5"
          fill="none" stroke="#88b8e8" strokeWidth="0.5" opacity="0.5"/>
      ))}
      {/* Nose section */}
      <path d="M82,8 Q90,8 96,14 Q100,19 99,25 Q97,30 90,30 L82,30 L82,8 Z"
        fill="url(#bNose)"/>
      {/* Cab windshield */}
      <path d="M84,9 Q92,9 97,15 Q100,19 99,23 Q97,28 90,29 L84,29 L84,9 Z"
        fill="url(#bCab)" opacity="0.92"/>
      {/* Windshield glare */}
      <path d="M86,10 Q92,10 96,15 Q94,12 89,10 Z"
        fill="white" opacity="0.15"/>
      {/* Headlights */}
      <ellipse cx="98" cy="16" rx="2" ry="1.5" fill="#ddeeff" opacity="0.9"/>
      <ellipse cx="98" cy="26" rx="1.8" ry="1.2" fill="#ddeeff" opacity="0.7"/>
      {/* Front coupling */}
      <rect x="98" y="20" width="3" height="3" rx="0.5" fill="#4a6a88"/>
      {/* Tail end */}
      <path d="M2,12 Q0,14 0,19 Q0,24 2,26 L2,12 Z"
        fill="#1a4a88" opacity="0.8"/>
      {/* Inter-car gaps */}
      {[40,72].map(x=>(
        <rect key={x} x={x} y="9" width="1.5" height="20" fill="#1a3a70" opacity="0.6"/>
      ))}
      {/* Pantograph */}
      <rect x="28" y="8" width="2.5" height="2" fill="#6a9acc" opacity="0.8"/>
      <line x1="29" y1="8" x2="26" y2="2" stroke="#5a8abc" strokeWidth="0.8" opacity="0.8"/>
      <line x1="26" y1="2" x2="38" y2="2" stroke="#5a8abc" strokeWidth="0.7" opacity="0.8"/>
      <line x1="38" y1="2" x2="35" y2="8" stroke="#5a8abc" strokeWidth="0.8" opacity="0.8"/>
      <rect x="22" y="1.5" width="20" height="1.2" rx="0.5" fill="#4a7aac" opacity="0.7"/>

      {/* â”€â”€ REFLECTION (mirror, below) â”€â”€ */}
      <g transform="translate(0,36) scale(1,-0.42)" style={{opacity:0.3}}>
        <path d="M6,8 L82,8 Q90,8 96,14 Q100,19 99,25 Q97,30 90,30 L6,30 Q3,30 2,26 L2,12 Q3,8 6,8 Z"
          fill="url(#bBody)"/>
        <rect x="2" y="22" width="99" height="5" fill="url(#bStripe)" opacity="0.5"/>
        {[8,20,32,44,56,68].map(x=>(
          <rect key={x} x={x} y="10" width="10" height="9" rx="1.5" fill="#c8dff8" opacity="0.6"/>
        ))}
      </g>
      {/* Reflection fade overlay */}
      <rect x="0" y="36" width="110" height="16" fill="url(#bReflect)" opacity="0.8"/>
    </svg>
  );
}

// â”€â”€â”€ Radar Scope â€” pixel-matched to FRANCE-4 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RadarScope(){
  const [angle,setAngle]=useState(0);
  useEffect(()=>{
    const id=setInterval(()=>setAngle(a=>(a+1.8)%360),28);
    return()=>clearInterval(id);
  },[]);

  const R=58; const cx=64; const cy=66;
  const toX=(deg:number,r:number)=>cx+r*Math.cos((deg-90)*Math.PI/180);
  const toY=(deg:number,r:number)=>cy+r*Math.sin((deg-90)*Math.PI/180);

  return(
    <svg viewBox="0 0 128 132" className="w-full h-full" style={{display:"block"}}>
      <defs>
        <radialGradient id="rBg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0d2218"/>
          <stop offset="70%"  stopColor="#061410"/>
          <stop offset="100%" stopColor="#030c08"/>
        </radialGradient>
        <radialGradient id="rGlow" cx="50%" cy="50%" r="50%">
          <stop offset="60%"  stopColor="transparent"/>
          <stop offset="100%" stopColor="#00aa55" stopOpacity="0.18"/>
        </radialGradient>
        <clipPath id="rc2">
          <circle cx={cx} cy={cy} r={R}/>
        </clipPath>
      </defs>

      {/* Outer dark halo */}
      <circle cx={cx} cy={cy} r={R+5} fill="#020808"/>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={R+2} fill="none" stroke="#00aa55" strokeWidth="1.5" opacity="0.35"/>
      {/* Radar background */}
      <circle cx={cx} cy={cy} r={R} fill="url(#rBg2)"/>
      <circle cx={cx} cy={cy} r={R} fill="url(#rGlow)"/>

      {/* â”€â”€ Concentric rings â€” 4 rings matching reference â”€â”€ */}
      {[R*0.22, R*0.44, R*0.67, R*0.89].map((r,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#00aa55"
          strokeWidth={i===3?0.9:0.6}
          opacity={i===3?0.55:0.35}
          strokeDasharray={i<2?"3,4":undefined}/>
      ))}

      {/* â”€â”€ Radial grid lines â€” 8 directions â”€â”€ */}
      {[0,22.5,45,67.5,90,112.5,135,157.5].map(deg=>(
        <line key={deg}
          x1={toX(deg,R)} y1={toY(deg,R)}
          x2={toX(deg+180,R)} y2={toY(deg+180,R)}
          stroke="#00aa55" strokeWidth="0.5" opacity="0.3"/>
      ))}

      {/* â”€â”€ Rotating sweep (clipped to circle) â”€â”€ */}
      <g clipPath="url(#rc2)">
        {/* Trailing glow segments */}
        {[40,28,16].map((span,i)=>(
          <path key={i}
            d={`M${cx},${cy} L${toX(angle,R)},${toY(angle,R)} A${R},${R},0,0,0,${toX(angle-span,R)},${toY(angle-span,R)} Z`}
            fill={`rgba(0,200,100,${0.22-i*0.06})`}/>
        ))}
        {/* Bright sweep arm */}
        <line x1={cx} y1={cy} x2={toX(angle,R)} y2={toY(angle,R)}
          stroke="#00ee77" strokeWidth="1.8" opacity="0.95"
          strokeLinecap="round"/>
        {/* Sweep glow */}
        <line x1={cx} y1={cy} x2={toX(angle,R)} y2={toY(angle,R)}
          stroke="#00ff88" strokeWidth="4" opacity="0.12"
          strokeLinecap="round"/>
      </g>

      {/* â”€â”€ Radar blips â”€â”€ */}
      {[[angle-42,R*0.52],[angle+70,R*0.36],[angle+128,R*0.68]].map(([a,r],i)=>(
        <g key={i}>
          <circle cx={toX(a,r)} cy={toY(a,r)} r="3.5" fill="#00ff88" opacity="0.15"/>
          <circle cx={toX(a,r)} cy={toY(a,r)} r="2" fill="#00ee77" opacity="0.9"/>
        </g>
      ))}

      {/* â”€â”€ Blue TGV train â€” centred in radar â”€â”€ */}
      <g transform={`translate(${cx-55},${cy-20})`}>
        <BlueTGVInRadar/>
      </g>

      {/* â”€â”€ Centre crosshair dot â”€â”€ */}
      <circle cx={cx} cy={cy} r="5" fill="#00aa55" opacity="0.12"/>
      <circle cx={cx} cy={cy} r="2.5" fill="#00cc66" opacity="0.8"/>
      <circle cx={cx} cy={cy} r="1"   fill="#ffffff" opacity="0.9"/>

      {/* â”€â”€ Outer border â”€â”€ */}
      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke="#00cc66" strokeWidth="1" opacity="0.6"/>
    </svg>
  );
}

// â”€â”€â”€ Sensor Fusion Status â€” full pixel-perfect build from FRANCE-4 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SensorFusion(){
  const [selected,setSelected]=useState<string|null>(null);
  return(
    <div className="h-full flex flex-col rounded overflow-hidden"
      style={{background:C.bg2,border:`1px solid ${C.border}`}}>

      {/* Panel header */}
      <div className="shrink-0 flex items-center justify-between px-2 py-[3px]"
        style={{background:C.bg1,borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:8.5,fontWeight:700,letterSpacing:"0.12em",
          textTransform:"uppercase",color:C.blue}}>Sensor Fusion Status</span>
        <span style={{fontSize:7,color:C.txt2}}>8 sensors Â |  all active</span>
      </div>

      {/* Main content row */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT â€” radar scope with blue TGV train */}
        <div style={{width:132,flexShrink:0,background:"#020808",
          display:"flex",alignItems:"center",justifyContent:"center",padding:"2px"}}>
          <RadarScope/>
        </div>

        {/* RIGHT â€” sensor list */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{background:"#070f14"}}>

          {/* Sensor rows */}
          <div className="flex-1 flex flex-col justify-around px-2 py-1.5 overflow-hidden">
            {SENSORS.map((s,i)=>{
              const isSynced=s.st==="SYNCED";
              const bc=isSynced?"#00ddcc":C.green;
              const active=selected===s.name;
              return(
                <button key={i}
                  onClick={()=>setSelected(active?null:s.name)}
                  style={{
                    display:"flex",alignItems:"center",gap:7,
                    padding:"2px 6px 2px 4px",borderRadius:4,
                    background:active?bc+"15":"transparent",
                    border:`1px solid ${active?bc+"44":"transparent"}`,
                    cursor:"pointer",outline:"none",width:"100%",textAlign:"left",
                  }}>
                  {/* Green circle with checkmark â€” matching reference exactly */}
                  <span style={{
                    width:15,height:15,borderRadius:"50%",
                    background:bc,
                    display:"inline-flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,
                  }}>
                    <span style={{fontSize:8.5,color:"#020808",fontWeight:900,lineHeight:1}}>âœ“</span>
                  </span>
                  {/* Sensor name */}
                  <span style={{
                    fontSize:8,fontWeight:500,color:"#ddeeff",
                    flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                  }}>{s.name}</span>
                  {/* Status badge */}
                  <span style={{
                    fontSize:7.5,fontWeight:700,
                    color:isSynced?"#00ddcc":C.green,
                    letterSpacing:"0.04em",whiteSpace:"nowrap",
                  }}>{isSynced?"SYNCHRONIZED":"ACTIVE"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom â€” Fusion Confidence (full width) */}
      <div className="shrink-0 px-3 py-1.5"
        style={{background:"#060e12",borderTop:`1px solid rgba(0,180,120,0.15)`}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:8,color:"#7aaa9a"}}>Fusion Confidence:</span>
          <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:"#00ddcc"}}>98.1%</span>
        </div>
        {/* Teal progress bar matching reference */}
        <div style={{height:5,borderRadius:3,background:"rgba(0,100,80,0.3)",overflow:"hidden"}}>
          <div style={{height:"100%",width:"98.1%",borderRadius:3,
            background:"linear-gradient(90deg,#00aa88,#00ddcc)"}}/>
        </div>
      </div>
    </div>
  );
}

function PredMaintCC(){
  const [selected,setSelected]=useState<string|null>(null);
  return(
    <Panel title="Predictive Maintenance" className="h-full">
      <div className="p-1.5 flex flex-col gap-[4px] flex-1 overflow-hidden">
        {MAINT_SYS.map((m,i)=>{
          const c=hue(m.pct);
          const isSelected=selected===m.name;
          return(
            <div key={i}>
              <button onClick={()=>setSelected(isSelected?null:m.name)}
                className="w-full text-left"
                style={{background:"none",border:"none",cursor:"pointer",outline:"none",padding:0}}>
                <div className="flex items-center justify-between rounded px-1 py-0.5"
                  style={{background:isSelected?c+"14":"transparent"}}>
                  <span style={{fontSize:7.5,color:isSelected?C.txt:C.txt}}>{m.name}</span>
                  <div className="flex items-center gap-1">
                    <span style={{fontSize:7.5,fontFamily:"monospace",fontWeight:700,color:c}}>{m.pct}%</span>
                    <Pill label={m.lbl} c={c}/>
                  </div>
                </div>
              </button>
              <PBar v={m.pct} c={c} h={3}/>
              {isSelected&&(
                <div style={{padding:"4px 6px",marginTop:2,borderRadius:3,
                  background:c+"0d",border:`1px solid ${c}28`,fontSize:6.5,color:C.txt2}}>
                  Last inspected: Jan 15, 2026 Â |  Next: Feb 11, 2026 Â |  Cycles: {Math.round(m.pct*12)}h remaining
                </div>
              )}
            </div>
          );
        })}
        <div className="mt-auto p-1.5 rounded" style={{background:C.bg1,border:`1px solid rgba(255,152,0,0.22)`}}>
          <div style={{fontSize:7,color:C.txt2}}>Next Maintenance Window</div>
          <div style={{fontSize:9,fontWeight:700,color:C.amber,marginTop:2}}>In 14 days â€” Feb 11, 2026</div>
          <button style={{marginTop:4,width:"100%",padding:"3px 0",borderRadius:3,cursor:"pointer",
            background:C.blue+"18",border:`1px solid ${C.blue}44`,color:C.blue,
            fontSize:7,fontWeight:700,outline:"none"}}>
            Schedule Inspection â†’
          </button>
        </div>
      </div>
    </Panel>
  );
}

function ObstaclesPanel(){
  const [acked,setAcked]=useState<Set<number>>(new Set());
  return(
    <Panel title="Obstacles Detected (10)" right="Most Recent First" className="h-full">
      <div className="p-1.5 flex flex-col gap-1 overflow-auto">
        {OBSTACLES.map((o,i)=>{
          const isAcked=acked.has(i);
          return(
            <div key={i} className="p-1.5 rounded" style={{
              background:isAcked?"rgba(0,230,118,0.05)":C.bg1,
              border:`1px solid ${isAcked?C.green+"33":C.border}`,
              opacity:isAcked?0.65:1,transition:"all 0.3s"}}>
              <div className="flex items-center justify-between" style={{marginBottom:2}}>
                <span style={{fontSize:8,fontWeight:700,color:C.txt,textDecoration:isAcked?"line-through":"none"}}>{o.type}</span>
                <div className="flex items-center gap-1">
                  <SevPill sev={o.sev}/>
                  {isAcked&&<span style={{fontSize:6.5,color:C.green}}>âœ“ Acked</span>}
                </div>
              </div>
              <div style={{fontSize:6.5,color:C.txt2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.loc}</div>
              <div className="flex items-center justify-between" style={{marginTop:3}}>
                <span style={{fontSize:6.5,fontFamily:"monospace",color:C.txt3}}>{o.time}</span>
                <button onClick={()=>setAcked(prev=>{const n=new Set(prev);isAcked?n.delete(i):n.add(i);return n;})}
                  style={{fontSize:6.5,fontWeight:700,padding:"1px 5px",borderRadius:3,cursor:"pointer",
                    background:isAcked?C.green+"18":C.amber+"18",
                    border:`1px solid ${isAcked?C.green+"44":C.amber+"44"}`,
                    color:isAcked?C.green:C.amber,outline:"none"}}>
                  {isAcked?"Restore":"Acknowledge"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// â”€â”€â”€ Interactive SVG GPS Map (replaces Leaflet â€” sandbox compatible) â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€ Interactive SVG GPS Map (Zoomable + Pannable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Real GPS coordinates projected onto SVG canvas
// Bounding box: lat 42.7â€“49.1 (Nâ†’S), lon 1.8â€“8.0 (Wâ†’E)
const MAP_STOPS = [
  {name:"Paris",     lat:48.8566, lon:2.3522,  isStart:true},
  {name:"Dijon",     lat:47.3220, lon:5.0415},
  {name:"Lyon",      lat:45.7640, lon:4.8357},
  {name:"Avignon",   lat:43.9493, lon:4.8059,  isTrain:true},
  {name:"Marseille", lat:43.2965, lon:5.3698},
  {name:"Toulon",    lat:43.1242, lon:5.9280},
  {name:"Cannes",    lat:43.5528, lon:7.0174},
  {name:"Nice",      lat:43.7102, lon:7.2620},
  {name:"Monaco",    lat:43.7396, lon:7.4269,  isEnd:true},
];

// Project lat/lon to SVG coordinates at given zoom/pan
function geoToSVG(lat:number,lon:number,zoom:number,panX:number,panY:number,W:number,H:number){
  const latMin=42.0,latMax=49.5,lonMin=1.2,lonMax=8.5;
  const x=((lon-lonMin)/(lonMax-lonMin))*W*zoom+panX;
  const y=((latMax-lat)/(latMax-latMin))*H*zoom+panY;
  return {x,y};
}

function RouteMap(){
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [tooltip,setTooltip]=useState<{name:string;lat:number;lon:number}|null>(null);
  const svgRef=useRef<SVGSVGElement>(null);
  const dragging=useRef(false);
  const lastPos=useRef({x:0,y:0});
  const W=300,H=136;

  const pts=MAP_STOPS.map(s=>geoToSVG(s.lat,s.lon,zoom,pan.x,pan.y,W,H));

  const onWheel=(e:React.WheelEvent)=>{
    e.preventDefault();
    const delta=e.deltaY<0?0.2:-0.2;
    setZoom(z=>Math.min(8,Math.max(0.6,z+delta)));
  };
  const onMouseDown=(e:React.MouseEvent)=>{dragging.current=true;lastPos.current={x:e.clientX,y:e.clientY};};
  const onMouseMove=(e:React.MouseEvent)=>{
    if(!dragging.current) return;
    setPan(p=>({x:p.x+(e.clientX-lastPos.current.x),y:p.y+(e.clientY-lastPos.current.y)}));
    lastPos.current={x:e.clientX,y:e.clientY};
  };
  const onMouseUp=()=>{dragging.current=false;};

  return(
    <Panel title="Route Map & Train Position â€” Satellite View (Zoomable)" className="h-full">
      <div className="flex-1 overflow-hidden relative" style={{minHeight:0,cursor:"grab"}}>
        {/* Zoom controls */}
        <div style={{position:"absolute",top:4,right:4,zIndex:10,display:"flex",flexDirection:"column",gap:2}}>
          {[{l:"+",d:0.3},{l:"âˆ’",d:-0.3}].map(({l,d})=>(
            <button key={l} onClick={()=>setZoom(z=>Math.min(8,Math.max(0.6,z+d)))}
              style={{width:20,height:20,background:C.bg2,border:`1px solid ${C.border}`,
                color:C.blue,fontSize:12,fontWeight:700,borderRadius:3,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",outline:"none"}}>
              {l}
            </button>
          ))}
          <button onClick={()=>{setZoom(1);setPan({x:0,y:0});}}
            style={{width:20,height:20,background:C.bg2,border:`1px solid ${C.border}`,
              color:C.txt2,fontSize:8,borderRadius:3,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",outline:"none"}}>âŒ‚</button>
        </div>
        {/* Badges */}
        <div style={{position:"absolute",bottom:4,right:4,zIndex:10,display:"flex",gap:3}}>
          <div style={{fontSize:6,fontWeight:700,color:"#8adc8a",
            background:"rgba(5,15,5,0.85)",padding:"2px 5px",borderRadius:3,
            border:"1px solid rgba(0,200,100,0.3)"}}>SAT</div>
          <div style={{fontSize:6.5,color:C.txt3,
            background:"rgba(5,12,8,0.85)",padding:"2px 5px",borderRadius:3,
            border:"1px solid rgba(0,229,255,0.15)"}}>
            {zoom.toFixed(1)}Ã-
          </div>
        </div>
        {/* SVG map */}
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
          style={{display:"block",userSelect:"none"}}
          onWheel={onWheel} onMouseDown={onMouseDown}
          onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          {/* â”€â”€ SATELLITE BASE â”€â”€ */}
          <rect width={W} height={H} fill="#1a2e1a"/>
          {/* Mediterranean Sea â€” south of France */}
          <path d={`M 0 ${geoToSVG(43.0,1.2,zoom,pan.x,pan.y,W,H).y}
            L ${W} ${geoToSVG(43.0,8.5,zoom,pan.x,pan.y,W,H).y}
            L ${W} ${H} L 0 ${H} Z`}
            fill="#0d2a4a" opacity="0.92"/>
          {/* Atlantic coast */}
          <path d={`M 0 0 L ${geoToSVG(51,1.7,zoom,pan.x,pan.y,W,H).x} 0
            L ${geoToSVG(47.0,2.0,zoom,pan.x,pan.y,W,H).x} ${geoToSVG(47.0,2.0,zoom,pan.x,pan.y,W,H).y}
            L ${geoToSVG(43.4,1.5,zoom,pan.x,pan.y,W,H).x} ${geoToSVG(43.4,1.5,zoom,pan.x,pan.y,W,H).y}
            L 0 ${H} Z`}
            fill="#132210" opacity="0.5"/>
          {/* France land mass (satellite green tones) */}
          <path d={[
            [51.0,2.5],[50.5,1.7],[49.5,1.8],[48.0,2.0],[47.0,2.0],
            [46.0,1.8],[45.0,1.5],[44.0,1.7],[43.5,1.5],[42.5,2.0],
            [42.3,2.8],[42.5,3.5],[43.0,4.0],[43.2,5.5],[43.0,6.0],
            [43.5,7.0],[43.8,7.5],[44.5,7.0],[45.5,6.8],[46.5,6.5],
            [47.5,7.6],[48.5,7.8],[49.5,8.2],[50.5,6.8],[51.0,5.0],
          ].map(([lat,lon],i)=>{const p=geoToSVG(lat,lon,zoom,pan.x,pan.y,W,H);return`${i===0?"M":"L"} ${p.x} ${p.y}`;}).join(" ")+" Z"}
            fill="#1e3a18" stroke="#2a4a22" strokeWidth="0.5" opacity="0.9"/>
          {/* Forest zones â€” dark green patches */}
          {[[48.5,2.4,18],[47.0,6.5,14],[44.5,2.5,12],[43.5,5.5,10],[46.0,4.0,15]].map(([lat,lon,r],i)=>{
            const p=geoToSVG(lat,lon,zoom,pan.x,pan.y,W,H);
            return <ellipse key={i} cx={p.x} cy={p.y} rx={r*zoom} ry={r*0.7*zoom} fill="#153010" opacity="0.7"/>;
          })}
          {/* Alpine terrain â€” dark brown/green (SE France) */}
          {[[45.8,6.5,16],[44.5,6.8,18],[44.0,7.2,14]].map(([lat,lon,r],i)=>{
            const p=geoToSVG(lat,lon,zoom,pan.x,pan.y,W,H);
            return <ellipse key={i} cx={p.x} cy={p.y} rx={r*zoom} ry={r*0.6*zoom} fill="#2a3818" opacity="0.75"/>;
          })}
          {/* Pyrenees â€” darker */}
          {[[42.7,1.5,12],[42.8,0.5,10],[42.9,2.2,8]].map(([lat,lon,r],i)=>{
            const p=geoToSVG(lat,lon,zoom,pan.x,pan.y,W,H);
            return <ellipse key={i} cx={p.x} cy={p.y} rx={r*zoom} ry={r*0.4*zoom} fill="#1a2a10" opacity="0.8"/>;
          })}
          {/* Farmland â€” lighter patches (Normandy, Loire Valley, Provence) */}
          {[[48.0,1.0,20],[47.5,0.5,16],[43.8,4.8,14],[44.5,3.0,12]].map(([lat,lon,r],i)=>{
            const p=geoToSVG(lat,lon,zoom,pan.x,pan.y,W,H);
            return <ellipse key={i} cx={p.x} cy={p.y} rx={r*zoom} ry={r*0.7*zoom} fill="#2a4218" opacity="0.5"/>;
          })}
          {/* Urban areas â€” grey patches */}
          {[[48.86,2.35,8],[45.76,4.84,6],[43.30,5.37,5],[43.95,4.81,4],[48.58,7.75,4]].map(([lat,lon,r],i)=>{
            const p=geoToSVG(lat,lon,zoom,pan.x,pan.y,W,H);
            return <ellipse key={i} cx={p.x} cy={p.y} rx={r*zoom} ry={r*0.8*zoom} fill="#3a4040" opacity="0.6"/>;
          })}
          {/* River RhÃ´ne â€” blue line */}
          <polyline points={[
            [46.5,4.8],[45.8,4.8],[45.0,4.7],[44.0,4.7],[43.7,4.8],[43.3,5.3]
          ].map(([lat,lon])=>{const p=geoToSVG(lat,lon,zoom,pan.x,pan.y,W,H);return`${p.x},${p.y}`}).join(" ")}
            fill="none" stroke="#1a4a6a" strokeWidth={1.5*Math.min(zoom,2)} opacity="0.7"/>
          {/* Satellite grid overlay (subtle) */}
          {[0,34,68,102,136].map(y=><line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>)}
          {[0,60,120,180,240,300].map(x=><line key={x} x1={x} y1="0" x2={x} y2={H} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>)}
          {/* Route glow */}
          <polyline points={pts.map(p=>`${p.x},${p.y}`).join(" ")}
            fill="none" stroke="#00ffff" strokeWidth={6*Math.min(zoom,2)} opacity="0.12"/>
          {/* Route line â€” bright cyan on satellite */}
          <polyline points={pts.map(p=>`${p.x},${p.y}`).join(" ")}
            fill="none" stroke="#00e5ff" strokeWidth="2" opacity="0.95"/>
          {/* Risk zone halos */}
          {[3,4].map(i=><circle key={i} cx={pts[i].x} cy={pts[i].y} r={16*zoom} fill={C.red} opacity="0.07"/>)}
          {/* Stop markers */}
          {MAP_STOPS.map((s,i)=>{
            const p=pts[i];
            const c=s.isStart?C.green:s.isEnd?C.amber:s.isTrain?C.blue:C.blue;
            return(
              <g key={i} style={{cursor:"pointer"}}
                onMouseEnter={()=>setTooltip({name:s.name,lat:s.lat,lon:s.lon})}
                onMouseLeave={()=>setTooltip(null)}>
                {s.isTrain&&<circle cx={p.x} cy={p.y} r={9*Math.min(zoom,2)} fill={C.blue} opacity="0.15"/>}
                <circle cx={p.x} cy={p.y} r={s.isTrain?5:3.5}
                  fill={s.isTrain?C.bg0:c} stroke={c} strokeWidth={s.isTrain?2:1}/>
                {s.isTrain&&(
                  <text x={p.x} y={p.y-8} fill={C.blue} fontSize={Math.max(4,6*zoom)} textAnchor="middle" fontWeight="bold">â–² TGV</text>
                )}
                {zoom>1.4&&(
                  <text x={p.x+4} y={p.y+3} fill={C.txt2} fontSize={Math.max(4,5*zoom)} textAnchor="start">{s.name}</text>
                )}
                {zoom<=1.4&&(
                  <text x={p.x+4} y={p.y+3} fill={C.txt2} fontSize="5">{s.name}</text>
                )}
              </g>
            );
          })}
          {/* Satellite legend */}
          <g>
            <rect x="3" y="3" width="78" height="52" rx="2" fill="rgba(5,12,8,0.88)" stroke="rgba(0,229,255,0.25)" strokeWidth="0.7"/>
            <rect x="8" y="9" width="8" height="5" rx="1" fill="#1e3a18" opacity="0.9"/><text x="20" y="14" fill="#8aac8a" fontSize="5.5">Terrain / Forest</text>
            <rect x="8" y="17" width="8" height="5" rx="1" fill="#0d2a4a" opacity="0.9"/><text x="20" y="22" fill="#8ab0cc" fontSize="5.5">Mediterranean Sea</text>
            <rect x="8" y="25" width="8" height="5" rx="1" fill="#3a4040" opacity="0.9"/><text x="20" y="30" fill="#aaa" fontSize="5.5">Urban Area</text>
            <circle cx="12" cy="38" r="3" fill="#00e676"/><text x="20" y="41" fill="#8adc9a" fontSize="5.5">Origin (Paris)</text>
            <circle cx="12" cy="47" r="3" fill="#ff9800"/><text x="20" y="50" fill="#ccaa60" fontSize="5.5">Destination (Monaco)</text>
          </g>
          {/* Tooltip */}
          {tooltip&&(()=>{
            const stop=MAP_STOPS.find(s=>s.name===tooltip.name)!;
            const p=geoToSVG(stop.lat,stop.lon,zoom,pan.x,pan.y,W,H);
            const tx=Math.min(p.x+6,W-75); const ty=Math.max(p.y-28,2);
            return(
              <g>
                <rect x={tx} y={ty} width="72" height="24" rx="3" fill={C.bg1} stroke={C.blue} strokeWidth="0.8"/>
                <text x={tx+4} y={ty+10} fill={C.blue} fontSize="6.5" fontWeight="bold">{tooltip.name}</text>
                <text x={tx+4} y={ty+19} fill={C.txt2} fontSize="5.5">{tooltip.lat.toFixed(4)}Â°N {tooltip.lon.toFixed(4)}Â°E</text>
              </g>
            );
          })()}
        </svg>
      </div>
    </Panel>
  );
}

function EventTimeline(){
  const tc={info:C.blue,warn:C.amber,critical:C.red} as const;
  return(
    <Panel title="Event Timeline (Real-Time)" className="h-full">
      <div className="p-1.5 flex flex-col gap-0.5 overflow-auto">
        {EVENTS.map((ev,i)=>{
          const c=tc[ev.t];
          return(
            <div key={i} className="flex gap-2 px-1 rounded"
              style={{paddingTop:3,paddingBottom:3,background:i%2===0?"transparent":"rgba(7,18,32,0.6)"}}>
              <div className="flex flex-col items-center shrink-0" style={{paddingTop:3}}>
                <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:c,flexShrink:0}}/>
                {i<EVENTS.length-1&&(
                  <div style={{width:1,flex:1,marginTop:2,background:C.border}}/>
                )}
              </div>
              <div>
                <div style={{fontSize:7,fontFamily:"monospace",color:C.txt3}}>{ev.time}</div>
                <div style={{fontSize:8.5,color:c}}>{ev.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function CCBottomRow(){
  return(
    <div className="grid grid-cols-4 gap-1 h-full">
      {/* Performance Summary */}
      <Panel title="Performance Summary" className="h-full">
        <div className="p-1.5 flex flex-col gap-1">
          {[
            ["Train ID","TGV-PARIS-MONACO-001"],
            ["Route Status","On Time"],
            ["Total Distance","960 km"],
            ["Stops","10"],
          ].map(([k,v])=>(
            <div key={k} className="flex items-center justify-between">
              <span style={{fontSize:7.5,color:C.txt2}}>{k}</span>
              <span style={{fontSize:8,fontWeight:700,fontFamily:"monospace",color:C.txt}}>{v}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{marginTop:2,background:C.green+"0e",border:`1px solid ${C.green}22`}}>
            <CheckCircle size={8} style={{color:C.green}}/>
            <span style={{fontSize:7,fontWeight:700,color:C.green}}>Journey Completed Successfully</span>
          </div>
          <div style={{fontSize:6.5,color:C.txt3}}>Status: Active Â |  Safety: Nominal</div>
        </div>
      </Panel>

      {/* Fleet & Operational Impact */}
      <Panel title="Fleet & Operational Impact" className="h-full">
        <div className="p-1.5 flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-1">
            {[
              {l:"Incidents Prevented",v:"37",   c:C.green},
              {l:"Downtime Reduced",   v:"18%",  c:C.blue},
              {l:"Cost Savings",       v:"â‚¬2.4M",c:C.green},
              {l:"Fleet Availability", v:"+11%", c:C.blue},
            ].map(({l,v,c})=>(
              <div key={l} className="rounded text-center p-1" style={{background:C.bg0}}>
                <div style={{fontSize:6.5,color:C.txt2}}>{l}</div>
                <div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded px-1.5 py-1" style={{background:C.bg0}}>
            <span style={{fontSize:7.5,color:C.txt2}}>AI Detections This Month</span>
            <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:C.amber}}>14,291</span>
          </div>
        </div>
      </Panel>

      {/* Environment & Conditions */}
      <Panel title="Environment & Conditions" className="h-full">
        <div className="p-1.5 flex flex-col gap-1.5">
          {[
            {ic:<Thermometer size={9} style={{color:C.amber}}/>, l:"Temperature",v:"18.7Â°C â€“ 24.9Â°C"},
            {ic:<Cloud size={9} style={{color:C.blue}}/>,        l:"Weather",    v:"Partly Cloudy"},
            {ic:<Wind size={9} style={{color:C.blue}}/>,         l:"Wind",       v:"18 km/h"},
          ].map(({ic,l,v})=>(
            <div key={l} className="flex items-center justify-between">
              <div className="flex items-center gap-1">{ic}<span style={{fontSize:7.5,color:C.txt2}}>{l}</span></div>
              <span style={{fontSize:8,fontWeight:700,color:C.txt}}>{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-center rounded py-0.5 mt-auto"
            style={{background:C.green+"08",border:`1px solid ${C.green}18`}}>
            <span style={{fontSize:7.5,fontWeight:700,color:C.green}}>Operational Conditions: Nominal</span>
          </div>
        </div>
      </Panel>

      {/* System Integrity & Compliance */}
      <Panel title="System Integrity & Compliance" className="h-full">
        <div className="p-1.5 flex flex-col gap-1">
          {[
            ["EN50128","Compliant"],
            ["EN50129","Compliant"],
            ["IEC62443","Compliant"],
            ["Cybersecurity","Secure"],
          ].map(([k,v])=>(
            <div key={k} className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Dot c={C.green}/>
                <span style={{fontSize:8,color:C.txt}}>{k}</span>
              </div>
              <Pill label={v} c={C.green}/>
            </div>
          ))}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded mt-0.5"
            style={{background:C.blue+"0c",border:`1px solid ${C.blue}22`}}>
            <Lock size={8} style={{color:C.blue}}/>
            <span style={{fontSize:7.5,fontWeight:700,color:C.blue}}>Safety Barrier: Secure</span>
          </div>
          <div className="flex items-center gap-1 px-1 py-0.5 rounded"
            style={{background:C.green+"07",border:`1px solid ${C.green}14`}}>
            <Shield size={7} style={{color:C.green}}/>
            <span style={{fontSize:6.5,color:C.green}}>All Compliance Checks Passed</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ControlCentre(){
  return(
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <CCHeader/>
      <div className="flex-1 min-h-0 flex flex-col gap-1 p-1 overflow-hidden">
        {/* Row 1 â€” Journey Overview | AI Vision | Sensor Fusion | Predictive Maintenance */}
        <div className="flex gap-1 min-h-0" style={{flex:"0 0 44%"}}>
          <div style={{width:188,flexShrink:0,minWidth:0}}><JourneyOverview/></div>
          <div className="flex-1 min-w-0"><AIVisionPanel/></div>
          <div style={{width:185,flexShrink:0,minWidth:0}}><SensorFusion/></div>
          <div style={{width:185,flexShrink:0,minWidth:0}}><PredMaintCC/></div>
        </div>
        {/* Row 2 â€” Obstacles | Route Map | Event Timeline */}
        <div className="flex gap-1 min-h-0" style={{flex:"0 0 28%"}}>
          <div style={{width:188,flexShrink:0,minWidth:0}}><ObstaclesPanel/></div>
          <div className="flex-1 min-w-0"><RouteMap/></div>
          <div style={{width:371,flexShrink:0,minWidth:0}}><EventTimeline/></div>
        </div>
        {/* Row 3 â€” 4 equal stat panels */}
        <div className="min-h-0" style={{flex:"0 0 28%"}}><CCBottomRow/></div>
      </div>
    </div>
  );
}

// â”€â”€â”€ DRIVER HMI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Speedometer({value=173,max=400}:{value?:number;max?:number}){
  const r=68; const circ=2*Math.PI*r; const arcLen=(270/360)*circ;
  const startRot=135; const frac=Math.min(value/max,1); const valLen=frac*arcLen;
  const vc=value>280?C.red:value>200?C.amber:C.green;
  // Tick positions
  const ticks=[0,100,200,300,400].map(v=>{
    const a=(startRot+(v/max)*270)*Math.PI/180;
    return {v,x1:(r-16)*Math.cos(a),y1:(r-16)*Math.sin(a),x2:(r-8)*Math.cos(a),y2:(r-8)*Math.sin(a)};
  });
  const needleA=(startRot+frac*270)*Math.PI/180;
  return(
    <svg viewBox="0 0 180 170" className="w-full h-full">
      <g transform="translate(90,96)">
        {/* BG arc */}
        <circle r={r} fill="none" stroke="#0d2240" strokeWidth="10"
          strokeDasharray={`${arcLen} ${circ}`} transform={`rotate(${startRot})`} strokeLinecap="round"/>
        {/* Green zone 0-200 */}
        <circle r={r} fill="none" stroke="#00e67644" strokeWidth="10"
          strokeDasharray={`${(200/max)*arcLen} ${circ}`} transform={`rotate(${startRot})`} strokeLinecap="round"/>
        {/* Amber zone */}
        <circle r={r} fill="none" stroke="#ff980044" strokeWidth="10"
          strokeDasharray={`${(80/max)*arcLen} ${circ}`}
          strokeDashoffset={-((200/max)*arcLen)}
          transform={`rotate(${startRot})`} strokeLinecap="round"/>
        {/* Red zone */}
        <circle r={r} fill="none" stroke="#ff174444" strokeWidth="10"
          strokeDasharray={`${(120/max)*arcLen} ${circ}`}
          strokeDashoffset={-((280/max)*arcLen)}
          transform={`rotate(${startRot})`} strokeLinecap="round"/>
        {/* Value arc */}
        <circle r={r} fill="none" stroke={vc} strokeWidth="10"
          strokeDasharray={`${valLen} ${circ}`} transform={`rotate(${startRot})`} strokeLinecap="round"/>
        {/* Glow */}
        <circle r={r} fill="none" stroke={vc} strokeWidth="14"
          strokeDasharray={`${valLen} ${circ}`} transform={`rotate(${startRot})`} strokeLinecap="round" opacity="0.15"/>
        {/* Ticks */}
        {ticks.map(t=>(
          <g key={t.v}>
            <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#3a5a7a" strokeWidth="2"/>
            <text x={(r-26)*Math.cos((startRot+(t.v/max)*270)*Math.PI/180)}
              y={(r-26)*Math.sin((startRot+(t.v/max)*270)*Math.PI/180)+3}
              fill="#3a5a7a" fontSize="7" textAnchor="middle">{t.v}</text>
          </g>
        ))}
        {/* Needle */}
        <line x1="0" y1="0" x2={(r-14)*Math.cos(needleA)} y2={(r-14)*Math.sin(needleA)}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle r="6" fill="#0d2240" stroke="white" strokeWidth="2"/>
        {/* Value */}
        <text fill={vc} textAnchor="middle" y="16" fontSize="32" fontWeight="800">{value}</text>
        <text fill={C.txt2} textAnchor="middle" y="30" fontSize="10">km/h</text>
      </g>
    </svg>
  );
}

type CameraState = "requesting" | "connected" | "denied" | "no-device" | "unavailable";

type HmiSensorTelemetry = {
  cameraState: CameraState;
  statusText: string;
  aiConfidence: number;
  obstacleConfidence: number;
  obstacleDistance: number;
  threatLevel: "LOW" | "MEDIUM" | "HIGH";
};

function LiveCameraSensor({
  telemetry,
  onTelemetry,
}:{
  telemetry: HmiSensorTelemetry;
  onTelemetry: (next: HmiSensorTelemetry) => void;
}){
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const prevLumaRef = useRef<number | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>(telemetry.cameraState);
  const [statusText, setStatusText] = useState(telemetry.statusText);
  const [aiConfidence, setAiConfidence] = useState(telemetry.aiConfidence);
  const [obstacleConfidence, setObstacleConfidence] = useState(telemetry.obstacleConfidence);
  const [obstacleDistance, setObstacleDistance] = useState(telemetry.obstacleDistance);
  const [threatLevel, setThreatLevel] = useState<"LOW" | "MEDIUM" | "HIGH">(telemetry.threatLevel);
  const [detectedBox, setDetectedBox] = useState<{x:number;y:number;w:number;h:number}|null>(null);
  const [detectedLabel, setDetectedLabel] = useState("Potential Obstacle");
  const defaultCalibration = { sensitivity: 24, centerWidth: 40, minBlob: 70 };
  const [showCalib, setShowCalib] = useState(false);
  const [calibration, setCalibration] = useState(defaultCalibration);
  const calibrationRef = useRef(calibration);

  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

  useEffect(() => {
    onTelemetry({
      cameraState,
      statusText,
      aiConfidence,
      obstacleConfidence,
      obstacleDistance,
      threatLevel,
    });
  }, [cameraState, statusText, aiConfidence, obstacleConfidence, obstacleDistance, threatLevel, onTelemetry]);

  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;
    let lastFrameTs = 0;

    const stopFeed = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    };

    const analyzeFrame = (ts: number) => {
      if (!mounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      if (ts - lastFrameTs < 140) {
        rafRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }
      lastFrameTs = ts;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
        rafRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      canvas.width = 96;
      canvas.height = 54;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const pxCount = canvas.width * canvas.height;

      let lumaSum = 0;
      const gray = new Uint8ClampedArray(pxCount);
      for (let i = 0; i < frame.length; i += 4) {
        const y = 0.2126 * frame[i] + 0.7152 * frame[i + 1] + 0.0722 * frame[i + 2];
        lumaSum += y;
        gray[i / 4] = y;
      }
      const avgLuma = lumaSum / pxCount;
      const darkness = Math.max(0, Math.min(1, (95 - avgLuma) / 95));

      let motion = 0;
      if (prevLumaRef.current !== null) {
        motion = Math.max(0, Math.min(1, Math.abs(avgLuma - prevLumaRef.current) / 18));
      }
      prevLumaRef.current = avgLuma;

      let movingPixels = 0;
      let movingPixelsFocus = 0;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      const prevGray = prevFrameRef.current;
      const cfg = calibrationRef.current;
      const diffThreshold = cfg.sensitivity;
      const focusMinY = Math.floor(canvas.height * 0.33);
      const centerRatio = Math.max(0.2, Math.min(0.9, cfg.centerWidth / 100));
      const focusMinX = Math.floor(canvas.width * (0.5 - centerRatio * 0.5));
      const focusMaxX = Math.ceil(canvas.width * (0.5 + centerRatio * 0.5));

      if (prevGray) {
        for (let i = 0; i < gray.length; i++) {
          const diff = Math.abs(gray[i] - prevGray[i]);
          if (diff > diffThreshold) {
            const x = i % canvas.width;
            const y = (i / canvas.width) | 0;
            if (y > 8 && x > 6 && x < canvas.width - 6) {
              movingPixels += 1;
              if (y >= focusMinY && x >= focusMinX && x <= focusMaxX) {
                movingPixelsFocus += 1;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
              }
            }
          }
        }
      }
      prevFrameRef.current = gray;

      const focusDensity = movingPixelsFocus / pxCount;
      const hasFocusBlob = movingPixelsFocus > cfg.minBlob && maxX > minX && maxY > minY;
      let boxAreaNorm = 0;
      let proximity = 0;
      let centerScore = 0;
      let hasObstacle = false;

      if (hasFocusBlob) {
        const boxW = maxX - minX + 1;
        const boxH = maxY - minY + 1;
        const boxCenterX = minX + boxW * 0.5;
        const centerOffset = Math.abs((boxCenterX / canvas.width) - 0.5);
        centerScore = Math.max(0, 1 - centerOffset / 0.22);
        boxAreaNorm = (boxW * boxH) / pxCount;
        proximity = Math.max(0, Math.min(1, (maxY / canvas.height) * 0.65 + boxAreaNorm * 1.15));
        hasObstacle = boxW >= 7 && boxH >= 6 && centerScore > 0.15;

        if (hasObstacle) {
          setDetectedBox({
            x: (minX / canvas.width) * 100,
            y: (minY / canvas.height) * 100,
            w: (boxW / canvas.width) * 100,
            h: (boxH / canvas.height) * 100,
          });
          setDetectedLabel(boxH > boxW * 1.2 ? "Person-like Obstacle" : "Trackside Obstacle");
        } else {
          setDetectedBox(null);
        }
      } else {
        setDetectedBox(null);
      }

      const motionDensity = movingPixels / pxCount;
      const riskScore = Math.max(0, Math.min(1,
        motion * 0.22 + motionDensity * 0.45 + focusDensity * 2.3 + centerScore * 0.7 + proximity * 0.75 + darkness * 0.16
      ));
      const nextConfidence = hasObstacle ? 66 + riskScore * 33 : 42 + riskScore * 18;
      const nextAi = 94 + (1 - riskScore * 0.6) * 5;
      const nextDistance = hasObstacle
        ? Math.max(14, 170 - proximity * 120 - boxAreaNorm * 90)
        : 160;

      setObstacleConfidence((p) => p * 0.65 + nextConfidence * 0.35);
      setAiConfidence((p) => p * 0.7 + nextAi * 0.3);
      setObstacleDistance((p) => p * 0.7 + nextDistance * 0.3);
      if (hasObstacle) {
        setStatusText((prev) => prev === "Live obstacle detected from camera" ? prev : "Live obstacle detected from camera");
      } else if (cameraState === "connected") {
        setStatusText((prev) => prev === "Live laptop camera stream connected" ? prev : "Live laptop camera stream connected");
      }

      if (!hasObstacle) {
        setThreatLevel("LOW");
      } else if (riskScore > 0.62) {
        setThreatLevel("HIGH");
      } else if (riskScore > 0.38) {
        setThreatLevel("MEDIUM");
      } else {
        setThreatLevel("LOW");
      }

      rafRef.current = requestAnimationFrame(analyzeFrame);
    };

    const startFeed = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraState("unavailable");
          setStatusText("Camera API unavailable in this browser context");
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some((d) => d.kind === "videoinput");
        if (!hasVideoInput) {
          setCameraState("no-device");
          setStatusText("No camera device detected");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment",
          },
          audio: false,
        });

        if (!mounted || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState("connected");
        setStatusText("Live laptop camera stream connected");
        rafRef.current = requestAnimationFrame(analyzeFrame);
      } catch (err) {
        const e = err as DOMException;
        if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
          setCameraState("denied");
          setStatusText("Camera permission denied. Enable access and reload.");
        } else if (e?.name === "NotFoundError") {
          setCameraState("no-device");
          setStatusText("No camera device available");
        } else {
          setCameraState("unavailable");
          setStatusText("Unable to start camera stream");
        }
      }
    };

    startFeed();

    return () => {
      mounted = false;
      stopFeed();
    };
  }, []);

  const statusTone =
    cameraState === "connected" ? C.green :
    cameraState === "requesting" ? C.blue :
    cameraState === "denied" ? C.red : C.amber;

  const threatColor =
    threatLevel === "HIGH" ? C.red :
    threatLevel === "MEDIUM" ? C.amber : C.green;

  return(
    <div className="flex-1 rounded overflow-hidden relative"
      style={{background:"#030d05",border:`1px solid rgba(0,180,216,0.15)`}}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full"
        style={{objectFit:"cover",filter:"saturate(1.05) contrast(1.03) brightness(0.9)"}}
      />
      <canvas ref={canvasRef} style={{display:"none"}} />

      {cameraState !== "connected" && (
        <div className="absolute inset-0" style={{
          background:"radial-gradient(circle at 50% 28%, rgba(0,180,216,0.14), rgba(2,8,20,0.92) 58%)"
        }}>
          <div className="absolute inset-0" style={{
            background:"repeating-linear-gradient(180deg, rgba(0,180,216,0.05) 0px, rgba(0,180,216,0.05) 1px, transparent 1px, transparent 14px)"
          }}/>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Camera size={22} style={{color:statusTone}}/>
            <div style={{fontSize:10,fontWeight:700,color:statusTone}}>Camera Sensor Offline</div>
            <div style={{fontSize:7.5,color:C.txt2,maxWidth:280,textAlign:"center"}}>{statusText}</div>
          </div>
        </div>
      )}

      <div style={{position:"absolute",top:7,left:7,padding:"4px 8px",borderRadius:4,
        background:statusTone+"18",border:`1px solid ${statusTone}55`}}>
        <div style={{fontSize:6.5,color:C.txt2}}>Camera Status</div>
        <div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.08em",color:statusTone}}>
          {cameraState.toUpperCase().replace("-", " ")}
        </div>
      </div>

      <div style={{position:"absolute",top:7,right:7,padding:"4px 8px",borderRadius:4,
        background:"rgba(0,180,216,0.14)",border:`1px solid rgba(0,180,216,0.45)`}}>
        <div style={{fontSize:6.5,color:C.txt2}}>AI Confidence</div>
        <div style={{fontSize:16,fontWeight:800,fontFamily:"monospace",color:C.blue,lineHeight:1.1}}>
          {aiConfidence.toFixed(1)}%
        </div>
      </div>

      <button
        onClick={() => setShowCalib((v) => !v)}
        style={{
          position:"absolute",
          right:8,
          bottom:42,
          fontSize:7,
          fontWeight:700,
          color:C.blue,
          background:"rgba(2,10,20,0.85)",
          border:`1px solid ${C.border}`,
          borderRadius:3,
          padding:"3px 6px",
          cursor:"pointer",
        }}
      >
        {showCalib ? "Hide Tuning" : "Show Tuning"}
      </button>

      {showCalib && (
        <div style={{
          position:"absolute",
          right:8,
          bottom:66,
          width:180,
          background:"rgba(2,10,20,0.92)",
          border:`1px solid ${C.border}`,
          borderRadius:4,
          padding:"6px 7px",
          display:"flex",
          flexDirection:"column",
          gap:5,
        }}>
          <div style={{fontSize:7.5,fontWeight:700,color:C.blue,letterSpacing:"0.08em"}}>Detection Tuning</div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button
              onClick={() => setCalibration(defaultCalibration)}
              style={{
                fontSize:6.5,
                fontWeight:700,
                color:C.amber,
                background:"rgba(15,10,2,0.85)",
                border:`1px solid ${C.amber}66`,
                borderRadius:3,
                padding:"2px 6px",
                cursor:"pointer",
              }}
            >
              Reset Tuning
            </button>
          </div>
          <label style={{display:"flex",flexDirection:"column",gap:2}}>
            <div style={{fontSize:6.5,color:C.txt2}}>Sensitivity: {calibration.sensitivity}</div>
            <input
              type="range"
              min={14}
              max={40}
              value={calibration.sensitivity}
              onChange={(e)=>setCalibration((c)=>({...c,sensitivity:Number(e.target.value)}))}
            />
          </label>
          <label style={{display:"flex",flexDirection:"column",gap:2}}>
            <div style={{fontSize:6.5,color:C.txt2}}>Center Width: {calibration.centerWidth}%</div>
            <input
              type="range"
              min={20}
              max={80}
              value={calibration.centerWidth}
              onChange={(e)=>setCalibration((c)=>({...c,centerWidth:Number(e.target.value)}))}
            />
          </label>
          <label style={{display:"flex",flexDirection:"column",gap:2}}>
            <div style={{fontSize:6.5,color:C.txt2}}>Min Blob: {calibration.minBlob}</div>
            <input
              type="range"
              min={30}
              max={180}
              value={calibration.minBlob}
              onChange={(e)=>setCalibration((c)=>({...c,minBlob:Number(e.target.value)}))}
            />
          </label>
        </div>
      )}

      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        {detectedBox ? (
          <div style={{
            position:"absolute",
            left:`${detectedBox.x}%`,
            top:`${detectedBox.y}%`,
            width:`${Math.max(8, detectedBox.w)}%`,
            height:`${Math.max(8, detectedBox.h)}%`,
          }}>
            <Bracket w={140} h={70} c={threatColor} t={1.8}/>
            <div style={{position:"absolute",inset:0,background:threatColor+"12"}}/>
            <div style={{position:"absolute",top:4,left:7}}>
              <div style={{fontSize:7,fontWeight:700,color:threatColor}}>{detectedLabel}</div>
              <div style={{fontSize:6,color:threatColor}}>
                Conf: {obstacleConfidence.toFixed(1)}% Â |  {threatLevel}
              </div>
            </div>
          </div>
        ) : (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:7,color:C.txt2,background:"rgba(2,10,18,0.72)",padding:"3px 7px",borderRadius:3,border:`1px solid ${C.border}`}}>
              Scanning for obstacle motion...
            </div>
          </div>
        )}
      </div>

      <div style={{position:"absolute",bottom:6,left:6,display:"flex",gap:4}}>
        {[{l:"Speed",v:"12.4 km/s",c:C.blue},{l:"Train Dist.",v:"173 km",c:C.green},{l:"Obstacle",v:`${obstacleDistance.toFixed(1)} m`,c:threatColor}].map(({l,v,c})=>(
          <div key={l} style={{padding:"3px 6px",borderRadius:3,
            background:"rgba(4,10,22,0.88)",border:`1px solid rgba(0,180,216,0.18)`}}>
            <div style={{fontSize:6,color:C.txt2}}>{l}</div>
            <div style={{fontSize:8.5,fontWeight:700,fontFamily:"monospace",color:c}}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverHMI(){
  const sp = {fontSize:7,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:C.txt2};
  const [sensorTelemetry, setSensorTelemetry] = useState<HmiSensorTelemetry>({
    cameraState: "requesting",
    statusText: "Requesting laptop camera access...",
    aiConfidence: 96.8,
    obstacleConfidence: 74.2,
    obstacleDistance: 88.5,
    threatLevel: "LOW",
  });

  const severityColor =
    sensorTelemetry.threatLevel === "HIGH" ? C.red :
    sensorTelemetry.threatLevel === "MEDIUM" ? C.amber : C.green;

  const primaryThreatLabel = sensorTelemetry.threatLevel === "LOW" ? "Routine Observation" : "Potential Obstacle";
  const recommendedAction =
    sensorTelemetry.cameraState !== "connected" ? "Restore Camera Feed" :
    sensorTelemetry.threatLevel === "HIGH" ? "Emergency Brake" :
    sensorTelemetry.threatLevel === "MEDIUM" ? "Reduce Speed" : "Maintain Speed";
  const relativeSpeed =
    sensorTelemetry.threatLevel === "HIGH" ? "âˆ’33 km/h" :
    sensorTelemetry.threatLevel === "MEDIUM" ? "âˆ’21 km/h" : "âˆ’9 km/h";
  const timeToImpact = Math.max(2.4, sensorTelemetry.obstacleDistance / (sensorTelemetry.threatLevel === "HIGH" ? 3.2 : sensorTelemetry.threatLevel === "MEDIUM" ? 2.3 : 1.5));
  return(
    <div className="flex flex-col h-full overflow-hidden" style={{background:"#080c14",fontFamily:"'JetBrains Mono','Inter','Segoe UI','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif"}}>

      {/* â•â• HEADER BAR â•â• */}
      <div className="shrink-0 flex items-center justify-between px-2 py-1"
        style={{background:"#030810",borderBottom:`1px solid rgba(0,180,216,0.2)`,minHeight:32}}>
        <div className="flex items-center gap-2">
          <span style={{fontSize:10,fontWeight:700,color:C.txt}}>Driver Assistance HMI</span>
          <span style={{fontSize:9,color:C.txt2,fontWeight:400}}>(in CAB display)</span>
          <span style={{width:1,height:14,background:C.border,display:"inline-block",margin:"0 4px"}}/>
          <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:C.txt}}>12:31</span>
          {[C.green,C.blue,C.green].map((c,i)=>(
            <span key={i} style={{width:6,height:6,borderRadius:"50%",background:c,display:"inline-block"}}/>
          ))}
          <span style={{fontSize:7,fontWeight:700,padding:"1px 7px",borderRadius:3,
            background:C.green+"18",border:`1px solid ${C.green}44`,color:C.green}}>
            All Systems Terminal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{fontSize:8,color:C.txt2}}>Speed Limit</span>
          <span style={{fontSize:14,fontWeight:800,color:C.green,fontFamily:"monospace"}}>320 km/h</span>
          <span style={{width:1,height:14,background:C.border,display:"inline-block",margin:"0 4px"}}/>
          <span style={{fontSize:8,color:C.txt2}}>Driver</span>
          <Pill label="TGV-PARIS-MONACO-001" c={C.blue}/>
        </div>
      </div>

      {/* â•â• MAIN AREA â•â• */}
      <div className="flex-1 min-h-0 flex gap-1 p-1 overflow-hidden">

        {/* â”€â”€ LEFT: 3 speed panels stacked â”€â”€ */}
        <div className="flex flex-col gap-1" style={{width:168,flexShrink:0}}>

          {/* CURRENT SPEED (dominant, ~55% height) */}
          <div className="flex-1 rounded overflow-hidden flex flex-col"
            style={{background:"#0d1520",border:`2px solid rgba(255,100,0,0.55)`}}>
            {/* Header */}
            <div className="flex items-center justify-between px-2 pt-1.5">
              <span style={{...sp}}>Current Speed</span>
              <AlertTriangle size={10} style={{color:C.amber}}/>
            </div>
            {/* THREAT banner */}
            <div style={{margin:"4px 6px 0",padding:"4px 7px",borderRadius:3,
              background:"rgba(230,80,0,0.22)",border:`1px solid rgba(230,80,0,0.55)`}}>
              <div style={{fontSize:7.5,fontWeight:700,color:"#ff6a00",marginBottom:1}}>â–² THREAT DETECTED</div>
              <div style={{fontSize:6.5,color:"rgba(255,140,60,0.85)"}}>Construction Equipment</div>
              <div style={{fontSize:6.5,color:"rgba(255,140,60,0.7)"}}>Distance: 43.2 m</div>
            </div>
            {/* Big speed number */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div style={{fontSize:72,fontWeight:900,lineHeight:0.9,color:"#ff8c00",
                textShadow:"0 0 24px rgba(255,140,0,0.7),0 0 48px rgba(255,140,0,0.35)"}}>173</div>
              <div style={{fontSize:10,color:C.txt2,marginTop:4}}>km/h</div>
            </div>
          </div>

          {/* TARGET SPEED */}
          <div className="rounded px-2 py-1.5" style={{background:"#0d1520",border:`1px solid ${C.border}`}}>
            <div style={{...sp,marginBottom:2}}>Target Speed</div>
            <div style={{fontSize:28,fontWeight:700,lineHeight:1,color:C.amber}}>
              160 <span style={{fontSize:10,fontWeight:400,color:C.txt2}}>km/h</span>
            </div>
          </div>

          {/* NEXT LIMIT */}
          <div className="rounded px-2 py-1.5" style={{background:"#0d1520",border:`1px solid ${C.border}`}}>
            <div style={{...sp,marginBottom:2}}>Next Limit</div>
            <div className="flex items-baseline justify-between">
              <div style={{fontSize:26,fontWeight:700,lineHeight:1,color:C.green}}>
                320 <span style={{fontSize:9,fontWeight:400,color:C.txt2}}>km/h</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:6.5,color:C.txt2}}>at</div>
                <div style={{fontSize:11,fontWeight:700,color:C.blue}}>134 km</div>
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ CENTER: Camera + 4-box info strip â”€â”€ */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">

          <LiveCameraSensor telemetry={sensorTelemetry} onTelemetry={setSensorTelemetry}/>

          {/* â”€â”€ Info strip â€” 4 boxes â”€â”€ */}
          <div className="grid grid-cols-4 gap-1 shrink-0">
            {[
              {l:"TIME TO IMPACT",            v:`${timeToImpact.toFixed(1)} sec`, c:severityColor, bg:severityColor+"14"},
              {l:"THREAT LEVEL",              v:sensorTelemetry.threatLevel,       c:severityColor, bg:severityColor+"20"},
              {l:"RECOMMENDED ACTION",        v:recommendedAction,                  c:C.amber,       bg:"rgba(255,152,0,0.08)"},
              {l:"DISTANCE TO NEXT STATION",  v:`${sensorTelemetry.obstacleDistance.toFixed(1)} m`, c:C.blue, bg:"rgba(0,180,216,0.06)"},
            ].map(({l,v,c,bg})=>(
              <div key={l} className="rounded p-1.5" style={{background:bg,border:`1px solid ${c}30`}}>
                <div style={{fontSize:6,color:C.txt2,letterSpacing:"0.05em",textTransform:"uppercase"}}>{l}</div>
                <div style={{fontSize:13,fontWeight:800,color:c,marginTop:2,lineHeight:1}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* â”€â”€ RIGHT: Threat & Obstacle panel â”€â”€ */}
        <div className="flex flex-col overflow-hidden rounded"
          style={{width:255,flexShrink:0,background:"#0d1520",border:`1px solid ${C.border}`}}>

          {/* Panel title bar */}
          <div style={{padding:"5px 8px",background:C.bg1,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <span style={{fontSize:7.5,fontWeight:700,letterSpacing:"0.13em",
              textTransform:"uppercase",color:C.blue}}>
              Threat &amp; Obstacle Information
            </span>
          </div>

          <div className="flex-1 overflow-auto" style={{padding:"8px 8px 6px"}}>

            {/* PRIMARY THREAT box */}
            <div style={{borderRadius:4,padding:"8px 9px",marginBottom:8,
              background:severityColor+"1f",border:`1px solid ${severityColor}52`}}>
              <div className="flex items-center justify-between" style={{marginBottom:5}}>
                <span style={{fontSize:7.5,fontWeight:700,color:severityColor}}>Primary Threat</span>
                <span style={{fontSize:6.5,fontWeight:700,padding:"1px 5px",borderRadius:2,
                  color:severityColor,background:severityColor+"22",border:`1px solid ${severityColor}44`}}>{sensorTelemetry.threatLevel}</span>
              </div>
              <div style={{fontSize:10.5,fontWeight:700,color:C.txt,marginBottom:6}}>{primaryThreatLabel}</div>
              {[
                ["Distance to Obstacle",`${sensorTelemetry.obstacleDistance.toFixed(1)} m`, C.txt],
                ["Time to Impact",       `${timeToImpact.toFixed(1)} sec`, C.txt],
                ["Relative Speed",       relativeSpeed, C.txt],
                ["AI Confidence",        `${sensorTelemetry.aiConfidence.toFixed(1)}%`, C.blue],
                ["Recommended Action",   recommendedAction, C.amber],
                ["Camera Status",        sensorTelemetry.cameraState.toUpperCase().replace("-", " "), severityColor],
              ].map(([k,v,c])=>(
                <div key={k} className="flex justify-between items-center" style={{marginBottom:3}}>
                  <span style={{fontSize:7,color:C.txt2}}>{k}</span>
                  <span style={{fontSize:7.5,fontWeight:700,color:c as string}}>{v}</span>
                </div>
              ))}
            </div>

            {/* Track Condition */}
            <div className="flex items-center justify-between" style={{marginBottom:6}}>
              <span style={{fontSize:7.5,fontWeight:600,color:C.txt2,textTransform:"uppercase",letterSpacing:"0.08em"}}>Track Condition</span>
              <span style={{fontSize:7,fontWeight:700,padding:"2px 6px",borderRadius:3,
                color:C.amber,background:C.amber+"18",border:`1px solid ${C.amber}44`}}>Moderate</span>
            </div>

            {/* Weather */}
            <div className="flex items-center justify-between" style={{marginBottom:8}}>
              <div className="flex items-center gap-1">
                <Cloud size={9} style={{color:C.blue}}/>
                <span style={{fontSize:7.5,fontWeight:600,color:C.txt2,textTransform:"uppercase",letterSpacing:"0.08em"}}>Weather</span>
              </div>
              <span style={{fontSize:7.5,fontWeight:700,color:C.txt}}>Partly Cloudy</span>
            </div>

            {/* Divider */}
            <div style={{height:1,background:C.border,marginBottom:7}}/>

            {/* Detected Objects */}
            <div>
              <div style={{fontSize:7.5,fontWeight:700,color:C.txt2,marginBottom:5}}>
                Detected Objects (2 of 10)
              </div>
              {[
                {name:primaryThreatLabel, dist:`${sensorTelemetry.obstacleDistance.toFixed(1)} m`, risk:sensorTelemetry.threatLevel, c:severityColor},
                {name:"Signal Maintenance Vehicle",dist:"128.7 m", risk:"LOW",  c:C.green},
              ].map((o,i)=>(
                <div key={i} className="flex items-center gap-1.5"
                  style={{paddingTop:4,paddingBottom:4,borderBottom:i===0?`1px solid ${C.border}`:"none"}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:o.c,flexShrink:0,display:"inline-block"}}/>
                  <span style={{fontSize:7,flex:1,overflow:"hidden",textOverflow:"ellipsis",
                    whiteSpace:"nowrap",color:C.txt}}>{o.name}</span>
                  <span style={{fontSize:6.5,fontFamily:"monospace",color:C.txt2,marginRight:4}}>{o.dist}</span>
                  <span style={{fontSize:6.5,fontWeight:700,padding:"1px 4px",borderRadius:2,
                    color:o.c,background:o.c+"20",border:`1px solid ${o.c}44`}}>{o.risk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* â•â• BOTTOM BAR â€” 4 equal columns â•â• */}
      <div className="shrink-0 grid grid-cols-4 gap-1 p-1"
        style={{background:"#060c14",borderTop:`1px solid rgba(0,180,216,0.2)`}}>

        {/* 1 â€” TRAIN STATUS */}
        <div className="rounded p-1.5" style={{background:"#0a1020"}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
            color:C.blue,marginBottom:5}}>Train Status</div>
          {[
            ["System Health","Good",       C.green],
            ["Power System", "Normal",     C.green],
            ["Communication","Connected",  C.blue],
            ["Data Link",    "Stable",     C.green],
          ].map(([k,v,c])=>(
            <div key={k} className="flex items-center justify-between" style={{marginBottom:3}}>
              <span style={{fontSize:7,color:C.txt2}}>{k}</span>
              <div className="flex items-center gap-1">
                <span style={{width:5,height:5,borderRadius:"50%",background:c as string,display:"inline-block"}}/>
                <span style={{fontSize:7,fontWeight:700,color:c as string}}>{v}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2 â€” ROUTE PROGRESS */}
        <div className="rounded p-1.5" style={{background:"#0a1020"}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
            color:C.blue,marginBottom:5}}>Route Progress</div>
          <div className="flex items-center gap-1.5" style={{marginBottom:5}}>
            <span style={{fontSize:8.5,fontWeight:700,color:C.txt}}>Paris</span>
            <div style={{flex:1,height:5,borderRadius:9999,background:C.blue+"28",overflow:"hidden"}}>
              <div style={{height:"100%",width:"58%",background:C.blue,borderRadius:9999}}/>
            </div>
            <span style={{fontSize:8.5,fontWeight:700,color:C.txt}}>Monaco</span>
          </div>
          <div style={{fontSize:7,color:C.txt2,marginBottom:2}}>Between: Avignon &amp; Aix-en-Provence</div>
          <div style={{fontSize:7,color:C.txt2}}>Speed: 147 / 380 (DPU)</div>
        </div>

        {/* 3 â€” SPEED & CONTROL */}
        <div className="rounded p-1.5" style={{background:"#0a1020"}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
            color:C.blue,textAlign:"center",marginBottom:2}}>Speed &amp; Control</div>
          <div style={{height:100}}><Speedometer value={173} max={400}/></div>
          <div className="grid grid-cols-2 gap-1.5" style={{marginTop:4}}>
            {[["Throttle","75%",C.green],["Brake","5%",C.red]].map(([l,v,c])=>(
              <div key={l}>
                <div className="flex justify-between" style={{marginBottom:2}}>
                  <span style={{fontSize:6.5,color:C.txt2}}>{l}</span>
                  <span style={{fontSize:6.5,fontWeight:700,color:c as string}}>{v}</span>
                </div>
                <PBar v={parseInt(v as string)} c={c as string} h={4}/>
              </div>
            ))}
          </div>
        </div>

        {/* 4 â€” SYSTEM STATUS */}
        <div className="rounded p-1.5" style={{background:"#0a1020"}}>
          <div style={{fontSize:7,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
            color:C.blue,marginBottom:5}}>System Status</div>
          {[
            ["Sensors",      "Online",      C.green],
            ["AI System",    "Operational", C.green],
            ["Brake System", "Normal",      C.green],
            ["Train Control","Active",      C.blue],
          ].map(([k,v,c])=>(
            <div key={k} className="flex items-center justify-between" style={{marginBottom:3}}>
              <span style={{fontSize:7,color:C.txt2}}>{k}</span>
              <div className="flex items-center gap-1">
                <span style={{width:5,height:5,borderRadius:"50%",background:c as string,display:"inline-block"}}/>
                <span style={{fontSize:7,fontWeight:700,color:c as string}}>{v}</span>
              </div>
            </div>
          ))}
          <div style={{marginTop:4,padding:"3px 5px",borderRadius:3,
            background:"rgba(0,230,118,0.07)",border:`1px solid rgba(0,230,118,0.18)`,
            display:"flex",alignItems:"center",gap:4}}>
            <CheckCircle size={7} style={{color:C.green,flexShrink:0}}/>
            <span style={{fontSize:6.5,color:C.green}}>Track Wear: Normal Ahead</span>
          </div>
          <div style={{marginTop:3,padding:"3px 5px",borderRadius:3,
            background:"rgba(255,152,0,0.07)",border:`1px solid rgba(255,152,0,0.2)`,
            display:"flex",alignItems:"center",gap:4}}>
            <AlertTriangle size={7} style={{color:C.amber,flexShrink:0}}/>
            <span style={{fontSize:6.5,color:C.amber}}>Weather Advisory: Moderate Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ SHARED PREDICTIVE DATA & GAUGE (used by both EA and PM Console) â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PM_RUL = [
  {sys:"Braking System",  rul:67,mo:8.1},
  {sys:"Pantograph",      rul:43,mo:5.2},
  {sys:"Battery System",  rul:18,mo:2.2},
  {sys:"Wheel Sets",      rul:72,mo:8.6},
  {sys:"Power Converter", rul:88,mo:10.5},
];

function RiskGauge({value=66.52}:{value?:number}){
  const r=52; const circ=2*Math.PI*r; const arc=(240/360)*circ;
  const rot=150; const frac=value/100; const valArc=frac*arc;
  const vc=value>70?C.red:value>40?C.amber:C.green;
  return(
    <svg viewBox="0 0 130 100" className="w-full" style={{maxHeight:110}}>
      <g transform="translate(65,72)">
        <circle r={r} fill="none" stroke="#0d2240" strokeWidth="10"
          strokeDasharray={`${arc} ${circ}`} transform={`rotate(${rot})`} strokeLinecap="round"/>
        <circle r={r} fill="none" stroke={C.green+"55"} strokeWidth="10"
          strokeDasharray={`${arc*0.4} ${circ}`} transform={`rotate(${rot})`} strokeLinecap="round"/>
        <circle r={r} fill="none" stroke={C.amber+"55"} strokeWidth="10"
          strokeDasharray={`${arc*0.3} ${circ}`} strokeDashoffset={-(arc*0.4)}
          transform={`rotate(${rot})`} strokeLinecap="round"/>
        <circle r={r} fill="none" stroke={C.red+"55"} strokeWidth="10"
          strokeDasharray={`${arc*0.3} ${circ}`} strokeDashoffset={-(arc*0.7)}
          transform={`rotate(${rot})`} strokeLinecap="round"/>
        <circle r={r} fill="none" stroke={vc} strokeWidth="10"
          strokeDasharray={`${valArc} ${circ}`} transform={`rotate(${rot})`} strokeLinecap="round"/>
        <circle r={r} fill="none" stroke={vc} strokeWidth="14"
          strokeDasharray={`${valArc} ${circ}`} transform={`rotate(${rot})`} strokeLinecap="round" opacity="0.12"/>
        {(()=>{const a=(rot+frac*240)*Math.PI/180;return(
          <line x1="0" y1="0" x2={(r-16)*Math.cos(a)} y2={(r-16)*Math.sin(a)} stroke="white" strokeWidth="2" strokeLinecap="round"/>
        );})()}
        <circle r="5" fill="#0d2240" stroke="white" strokeWidth="1.5"/>
        <text fill={vc} textAnchor="middle" y="-8" fontSize="18" fontWeight="800">{value}%</text>
        <text fill={C.txt2} textAnchor="middle" y="6" fontSize="7">Risk Level</text>
        <text fill={C.amber} textAnchor="middle" y="18" fontSize="7">MEDIUM-HIGH</text>
      </g>
      <text x="4" y="98" fill={C.green} fontSize="7">Low</text>
      <text x="46" y="98" fill={C.amber} fontSize="7">Medium</text>
      <text x="95" y="98" fill={C.red} fontSize="7">High</text>
    </svg>
  );
}

// â”€â”€â”€ EXECUTIVE ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TT = ({active,payload,label}:any)=>{
  if(!active||!payload?.length) return null;
  return(
    <div className="px-2 py-1 rounded text-[8px]" style={{background:C.bg1,border:`1px solid ${C.border}`,color:C.txt}}>
      <div style={{color:C.txt2}}>{label}</div>
      {payload.map((p:any,i:number)=><div key={i} style={{color:p.color||C.blue}}>{p.name}: {p.value}</div>)}
    </div>
  );
};

// Shared route risk map SVG (reused across views)
function EARouteRisk({size=120}:{size?:number}){
  const pts=[
    {x:28,y:20,r:C.green,l:"Paris"},{x:48,y:38,r:C.green,l:"Dijon"},
    {x:55,y:55,r:C.amber,l:"Lyon"},{x:72,y:75,r:C.red,l:"Avignon"},
    {x:88,y:82,r:C.amber,l:"Marseille"},{x:100,y:78,r:C.green,l:"Cannes"},
    {x:110,y:76,r:C.green,l:"Monaco"},
  ];
  return(
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <rect width="120" height="120" fill={C.bg0} rx="2"/>
      {[0,30,60,90,120].map(v=><line key={`h${v}`} x1="0" y1={v} x2="120" y2={v} stroke="#0d2240" strokeWidth="0.4"/>)}
      {[0,30,60,90,120].map(v=><line key={`w${v}`} x1={v} y1="0" x2={v} y2="120" stroke="#0d2240" strokeWidth="0.4"/>)}
      <polyline points="28,20 48,38 55,55 72,75 88,82 100,78 110,76" fill="none" stroke={C.blue} strokeWidth="1.5" opacity="0.5"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={p.r} opacity="0.18"/>
          <circle cx={p.x} cy={p.y} r="2.5" fill={p.r}/>
          <text x={p.x+4} y={p.y+3} fill={C.txt3} fontSize="5">{p.l}</text>
        </g>
      ))}
      <g transform="translate(2,100)">
        <circle cx="4" cy="4" r="2.5" fill={C.green}/><text x="9" y="7" fill={C.txt3} fontSize="5">Low</text>
        <circle cx="4" cy="12" r="2.5" fill={C.amber}/><text x="9" y="15" fill={C.txt3} fontSize="5">Med</text>
        <circle cx="4" cy="20" r="2.5" fill={C.red}/><text x="9" y="23" fill={C.txt3} fontSize="5">High</text>
      </g>
    </svg>
  );
}

// Shared KPI strip
function EAKpis(){
  return(
    <div className="grid grid-cols-8 gap-1 shrink-0">
      {[
        {l:"Safety Incidents Avoided",v:"47",    c:C.green,sub:"+12 vs prev"},
        {l:"Fleet",                  v:"12",    c:C.blue, sub:"Routes Active"},
        {l:"Total Distance",         v:"36,850",c:C.blue, sub:"km this month"},
        {l:"On-Time Performance",    v:"92.1%", c:C.green,sub:"+3.1% vs avg"},
        {l:"Fleet Availability",     v:"94.6%", c:C.green,sub:"âˆ’0.4% target"},
        {l:"Maintenance Cost Saved", v:"â‚¬2.4M", c:C.green,sub:"vs last month"},
        {l:"AI Detections / Month",  v:"14,291",c:C.amber,sub:"â†‘ 7.3%"},
        {l:"Operational Safety Index",v:"96",   c:C.green,sub:"Excellent"},
      ].map(({l,v,c,sub})=>(
        <div key={l} className="rounded p-1.5" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
          <div className="text-[6.5px] leading-tight" style={{color:C.txt2}}>{l}</div>
          <div className="text-[14px] font-bold leading-none mt-0.5" style={{color:c}}>{v}</div>
          <div className="text-[6px] mt-0.5" style={{color:C.txt3}}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// â”€â”€ View 1: Performance (full overview) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EAPerformanceView(){
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      <EAKpis/>
      {/* Row 2 */}
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2fr 1.4fr 0.9fr 0.9fr 1.4fr",height:160}}>
        <Panel title="Safety Trend â€” Incidents Avoided" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SAFETY_TREND} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs><linearGradient id="g-perf-safety" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.green} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={C.green} stopOpacity="0"/>
              </linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="v" name="Avoided" stroke={C.green} strokeWidth={1.5} fill="url(#g-perf-safety)"/>
            </AreaChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Fleet Availability (%)" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={FLEET_AVAIL} margin={{top:4,right:4,bottom:0,left:-20}} layout="vertical">
              <XAxis type="number" domain={[80,100]} tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="r" type="category" tick={{fill:C.txt3,fontSize:6}} axisLine={false} tickLine={false} width={80}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="v" name="Availability" fill={C.blue} radius={2} barSize={8}/>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Incidents by Type" className="h-full">
          <div className="flex-1 p-1 flex flex-col">
            <div style={{flex:1}}><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={INC_TYPES} dataKey="value" cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" strokeWidth={0}>
                {INC_TYPES.map((e,i)=><Cell key={`inc-${e.name}`} fill={e.color}/>)}
              </Pie><Tooltip content={<TT/>}/></PieChart>
            </ResponsiveContainer></div>
            <div className="px-1 space-y-0.5">{INC_TYPES.slice(0,3).map(t=>(
              <Row key={t.name}><Dot c={t.color}/><span className="text-[6.5px] flex-1" style={{color:C.txt2}}>{t.name}</span><span className="text-[6.5px] font-bold" style={{color:t.color}}>{t.value}%</span></Row>
            ))}</div>
          </div>
        </Panel>
        <Panel title="Route Risk Map" className="h-full">
          <div className="flex-1 p-1"><EARouteRisk/></div>
        </Panel>
        <Panel title="Fleet Utilization" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={FLEET_UTIL} margin={{top:4,right:4,bottom:0,left:-20}} layout="vertical">
              <XAxis type="number" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="r" type="category" tick={{fill:C.txt3,fontSize:6}} axisLine={false} tickLine={false} width={60}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="active" name="Active" stackId="a" fill={C.blue} radius={0} barSize={8}/>
              <Bar dataKey="idle" name="Idle" stackId="a" fill={C.amber} radius={0} barSize={8}/>
              <Bar dataKey="maint" name="Maint" stackId="a" fill={C.red} radius={[0,2,2,0]} barSize={8}/>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
      </div>
      {/* Financial */}
      <div className="grid grid-cols-4 gap-1 shrink-0">
        {[{l:"Total Annual Savings",v:"â‚¬5.6M",c:C.green,sub:"Full ROI"},{l:"Maintenance Reduction",v:"â‚¬2.4M",c:C.blue,sub:"â†“ 18%"},{l:"Revenue Protection",v:"â‚¬1.6M",c:C.green,sub:"Uptime"},{l:"Insurance Reduction",v:"â‚¬0.6M",c:C.amber,sub:"Safety"}].map(({l,v,c,sub})=>(
          <div key={l} className="rounded p-2" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
            <div className="text-[7px]" style={{color:C.txt2}}>{l}</div>
            <div className="text-[20px] font-bold" style={{color:c}}>{v}</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>{sub}</div>
          </div>
        ))}
      </div>
      {/* OTP + Cost + Comp */}
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2fr 2fr 1fr",height:140}}>
        <Panel title="On-Time Performance Trend (%)" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={OTP_TREND} margin={{top:4,right:4,bottom:0,left:-20}}>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis domain={[85,95]} tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Line type="monotone" dataKey="v" name="OTP %" stroke={C.blue} strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Maintenance Cost Trend (â‚¬M)" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MAINT_COST_TREND} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs><linearGradient id="g-perf-maint" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.amber} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={C.amber} stopOpacity="0"/>
              </linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="v" name="Cost â‚¬M" stroke={C.amber} strokeWidth={1.5} fill="url(#g-perf-maint)"/>
            </AreaChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Fleet Composition" className="h-full">
          <div className="flex-1 p-1 flex flex-col">
            <div style={{flex:1}}><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={FLEET_COMP} dataKey="value" cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" strokeWidth={0}>
                {FLEET_COMP.map((e,i)=><Cell key={`fc-${e.name}`} fill={e.color}/>)}
              </Pie></PieChart>
            </ResponsiveContainer></div>
            {FLEET_COMP.map(f=><Row key={f.name}><Dot c={f.color}/><span className="text-[6.5px] flex-1" style={{color:C.txt2}}>{f.name}</span><span className="text-[7px] font-bold" style={{color:f.color}}>{f.value}</span></Row>)}
            <div className="text-center text-[7px] font-bold mt-0.5" style={{color:C.txt}}>156 Total</div>
          </div>
        </Panel>
      </div>
      {/* Bottom row */}
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2fr 1fr 1fr 1fr 2fr",height:140}}>
        <Panel title="AI Detection Trends" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={AI_DET_TREND} margin={{top:4,right:4,bottom:0,left:-10}}>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="v" name="Detections" fill={C.purple} radius={2} barSize={16}/>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Top Risk Locations" className="h-full">
          <div className="p-1.5 flex flex-col gap-0.5 overflow-auto">
            {TOP_RISKS.map((r,i)=>(
              <div key={i} className="flex items-center gap-1">
                <span className="text-[6.5px] flex-1 truncate" style={{color:C.txt}}>{r.loc}</span>
                <SevPill sev={r.risk}/>
                <span className="text-[7px] font-mono" style={{color:C.txt2}}>{r.cnt}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Alert Summary" className="h-full">
          <div className="p-1.5 flex flex-col gap-0.5">
            {EXEC_ALERTS.map((a,i)=>(
              <div key={i} className="flex items-center justify-between">
                <Row><Dot c={a.c}/><span className="text-[7px]" style={{color:C.txt2}}>{a.type}</span></Row>
                <span className="text-[8px] font-bold font-mono" style={{color:a.c}}>{a.cnt}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Sustainability Impact" className="h-full">
          <div className="p-1.5 flex flex-col gap-1.5">
            {[{l:"COâ‚‚ Avoided",v:"380,250",u:"kg",c:C.green},{l:"Incidents Avoided",v:"1,245",u:"events",c:C.blue},{l:"Energy Efficiency",v:"+8.7%",u:"improvement",c:C.green}].map(({l,v,u,c})=>(
              <div key={l}>
                <div className="text-[6.5px]" style={{color:C.txt2}}>{l}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] font-bold" style={{color:c}}>{v}</span>
                  <span className="text-[6px]" style={{color:C.txt3}}>{u}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Performance by Route" className="h-full">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[7px]">
              <thead><tr style={{background:C.bg1}}>
                {["Route","OTP%","Inc.","Avail%"].map(h=><th key={h} className="px-1.5 py-0.5 text-left font-bold" style={{color:C.txt2}}>{h}</th>)}
              </tr></thead>
              <tbody>{PERF_BY_ROUTE.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?"transparent":C.bg1}}>
                  <td className="px-1.5 py-0.5 truncate" style={{color:C.txt,maxWidth:80}}>{r.route}</td>
                  <td className="px-1.5 py-0.5 font-bold" style={{color:r.otp>=92?C.green:r.otp>=89?C.blue:C.amber}}>{r.otp}</td>
                  <td className="px-1.5 py-0.5" style={{color:r.inc>10?C.red:C.txt}}>{r.inc}</td>
                  <td className="px-1.5 py-0.5 font-bold" style={{color:r.avail>=94?C.green:C.blue}}>{r.avail}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// â”€â”€ View 2: Safety â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EASafetyView(){
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      <div className="grid grid-cols-4 gap-1 shrink-0">
        {[{l:"Incidents Avoided",v:"47",c:C.green,sub:"+12 vs prev month"},{l:"Safety Score",v:"96",c:C.green,sub:"Excellent"},{l:"Active Alerts",v:"12",c:C.red,sub:"3 High Â |  5 Med"},{l:"Risk Zones",v:"2",c:C.amber,sub:"Avignon Â |  Marseille"}].map(({l,v,c,sub})=>(
          <div key={l} className="rounded p-2" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
            <div className="text-[7px]" style={{color:C.txt2}}>{l}</div>
            <div className="text-[24px] font-bold" style={{color:c}}>{v}</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2.5fr 1fr 1fr",height:180}}>
        <Panel title="Safety Trend â€” Incidents Avoided (6 months)" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SAFETY_TREND} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs><linearGradient id="g-safety-trend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.green} stopOpacity="0.35"/>
                <stop offset="100%" stopColor={C.green} stopOpacity="0"/>
              </linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="v" name="Avoided" stroke={C.green} strokeWidth={2} fill="url(#g-safety-trend)"/>
            </AreaChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Incidents by Type" className="h-full">
          <div className="flex-1 p-1 flex flex-col">
            <div style={{flex:1}}><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={INC_TYPES} dataKey="value" cx="50%" cy="50%" innerRadius="38%" outerRadius="62%" strokeWidth={0}>
                {INC_TYPES.map((e,i)=><Cell key={`inc-${e.name}`} fill={e.color}/>)}
              </Pie><Tooltip content={<TT/>}/></PieChart>
            </ResponsiveContainer></div>
            <div className="px-1 space-y-0.5">{INC_TYPES.map(t=>(
              <Row key={t.name}><Dot c={t.color}/><span className="text-[6.5px] flex-1" style={{color:C.txt2}}>{t.name}</span><span className="text-[7px] font-bold" style={{color:t.color}}>{t.value}%</span></Row>
            ))}</div>
          </div>
        </Panel>
        <Panel title="Route Risk Map" className="h-full">
          <div className="flex-1 p-1"><EARouteRisk/></div>
        </Panel>
      </div>
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2fr 1fr",height:180}}>
        <Panel title="Top Risk Locations â€” Full List">
          <div className="flex-1 overflow-auto p-1.5">
            <table className="w-full text-[7.5px]">
              <thead><tr style={{background:C.bg1}}>
                {["Location","Risk Level","Incidents","Last Detected","Action"].map(h=><th key={h} className="px-2 py-1 text-left font-bold" style={{color:C.txt2}}>{h}</th>)}
              </tr></thead>
              <tbody>{TOP_RISKS.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?"transparent":C.bg1}}>
                  <td className="px-2 py-1" style={{color:C.txt}}>{r.loc}</td>
                  <td className="px-2 py-1"><SevPill sev={r.risk}/></td>
                  <td className="px-2 py-1 font-mono" style={{color:C.txt}}>{r.cnt}</td>
                  <td className="px-2 py-1 font-mono" style={{color:C.txt2}}>28 Jan 2026</td>
                  <td className="px-2 py-1"><Pill label="Monitor" c={C.blue}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Alert Summary">
          <div className="p-2 flex flex-col gap-1.5">
            {EXEC_ALERTS.map((a,i)=>(
              <div key={i} className="flex items-center justify-between p-1.5 rounded" style={{background:C.bg1}}>
                <Row><Dot c={a.c}/><span className="text-[8px] font-bold" style={{color:C.txt2}}>{a.type}</span></Row>
                <span className="text-[14px] font-bold font-mono" style={{color:a.c}}>{a.cnt}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// â”€â”€ View 3: Fleet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EAFleetView(){
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      <div className="grid grid-cols-4 gap-1 shrink-0">
        {[{l:"Total Fleet Assets",v:"156",c:C.blue,sub:"Across all routes"},{l:"Active",v:"142",c:C.green,sub:"91% operational"},{l:"In Maintenance",v:"14",c:C.amber,sub:"9% scheduled"},{l:"Fleet Availability",v:"94.6%",c:C.green,sub:"âˆ’0.4% target"}].map(({l,v,c,sub})=>(
          <div key={l} className="rounded p-2" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
            <div className="text-[7px]" style={{color:C.txt2}}>{l}</div>
            <div className="text-[24px] font-bold" style={{color:c}}>{v}</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5" style={{gridTemplateColumns:"1fr 2fr",height:180}}>
        <Panel title="Fleet Composition" className="h-full">
          <div className="flex-1 p-1 flex flex-col">
            <div style={{flex:1}}><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={FLEET_COMP} dataKey="value" cx="50%" cy="50%" innerRadius="38%" outerRadius="62%" strokeWidth={0}>
                {FLEET_COMP.map((e,i)=><Cell key={`fc-${e.name}`} fill={e.color}/>)}
              </Pie><Tooltip content={<TT/>}/></PieChart>
            </ResponsiveContainer></div>
            <div className="px-1 space-y-1">{FLEET_COMP.map(f=>(
              <div key={f.name}>
                <Row className="mb-0.5"><Dot c={f.color}/><span className="text-[7px] flex-1" style={{color:C.txt2}}>{f.name}</span><span className="text-[8px] font-bold" style={{color:f.color}}>{f.value}</span></Row>
                <PBar v={(f.value/156)*100} c={f.color} h={3}/>
              </div>
            ))}
            <div className="text-center text-[7px] font-bold mt-1" style={{color:C.txt}}>156 Total</div>
            </div>
          </div>
        </Panel>
        <Panel title="Fleet Utilization by Route" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={FLEET_UTIL} margin={{top:4,right:4,bottom:0,left:-20}} layout="vertical">
              <XAxis type="number" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="r" type="category" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false} width={80}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="active" name="Active %" stackId="a" fill={C.blue} radius={0} barSize={12}/>
              <Bar dataKey="idle" name="Idle %" stackId="a" fill={C.amber} radius={0} barSize={12}/>
              <Bar dataKey="maint" name="Maint %" stackId="a" fill={C.red} radius={[0,2,2,0]} barSize={12}/>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
      </div>
      <Panel title="Fleet Availability by Route">
        <div className="flex-1 p-1" style={{height:140}}><ResponsiveContainer width="100%" height="100%">
          <BarChart data={FLEET_AVAIL} margin={{top:4,right:16,bottom:0,left:-10}}>
            <XAxis dataKey="r" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
            <YAxis domain={[80,100]} tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="v" name="Availability %" fill={C.blue} radius={[2,2,0,0]} barSize={28}/>
          </BarChart>
        </ResponsiveContainer></div>
      </Panel>
      <Panel title="Fleet Performance by Route">
        <div className="overflow-auto" style={{maxHeight:120}}>
          <table className="w-full text-[7.5px]">
            <thead><tr style={{background:C.bg1}}>
              {["Route","OTP%","Incidents","Avail%","Utilization","Status"].map(h=><th key={h} className="px-2 py-1 text-left font-bold" style={{color:C.txt2}}>{h}</th>)}
            </tr></thead>
            <tbody>{PERF_BY_ROUTE.map((r,i)=>(
              <tr key={i} style={{background:i%2===0?"transparent":C.bg1}}>
                <td className="px-2 py-1" style={{color:C.txt}}>{r.route}</td>
                <td className="px-2 py-1 font-bold" style={{color:r.otp>=92?C.green:r.otp>=89?C.blue:C.amber}}>{r.otp}%</td>
                <td className="px-2 py-1" style={{color:r.inc>10?C.red:C.txt}}>{r.inc}</td>
                <td className="px-2 py-1 font-bold" style={{color:r.avail>=94?C.green:C.blue}}>{r.avail}%</td>
                <td className="px-2 py-1"><PBar v={r.avail} c={r.avail>=94?C.green:C.blue} h={4}/></td>
                <td className="px-2 py-1"><Pill label={r.otp>=92?"On Track":"Monitor"} c={r.otp>=92?C.green:C.amber}/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// â”€â”€ View 4: Financial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EAFinancialView(){
  const costByRoute=[
    {r:"Paris-Monaco",cost:0.62,save:0.18},{r:"Lyon-Marseille",cost:0.55,save:0.14},
    {r:"Nice-Lyon",cost:0.41,save:0.12},{r:"Bordeaux-Paris",cost:0.48,save:0.09},
    {r:"Toulouse-Paris",cost:0.34,save:0.07},
  ];
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      <div className="grid grid-cols-4 gap-1 shrink-0">
        {[{l:"Total Annual Savings",v:"â‚¬5.6M",c:C.green,sub:"Full ROI achieved"},{l:"Maintenance Reduction",v:"â‚¬2.4M",c:C.blue,sub:"â†“ 18% vs baseline"},{l:"Revenue Protection",v:"â‚¬1.6M",c:C.green,sub:"Uptime-driven"},{l:"Insurance Reduction",v:"â‚¬0.6M",c:C.amber,sub:"Safety index impact"}].map(({l,v,c,sub})=>(
          <div key={l} className="rounded p-3" style={{background:C.bg2,border:`1px solid ${c}30`}}>
            <div className="text-[7px]" style={{color:C.txt2}}>{l}</div>
            <div className="text-[28px] font-bold" style={{color:c}}>{v}</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2fr 1fr",height:180}}>
        <Panel title="Maintenance Cost Trend (â‚¬M)" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MAINT_COST_TREND} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs><linearGradient id="g-financial-cost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.amber} stopOpacity="0.35"/>
                <stop offset="100%" stopColor={C.amber} stopOpacity="0"/>
              </linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="v" name="Cost â‚¬M" stroke={C.amber} strokeWidth={2} fill="url(#g-financial-cost)"/>
            </AreaChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Savings Breakdown" className="h-full">
          <div className="p-2 flex flex-col gap-2">
            {[{l:"Maintenance",v:2.4,t:5.6,c:C.blue},{l:"Revenue",v:1.6,t:5.6,c:C.green},{l:"Insurance",v:0.6,t:5.6,c:C.amber}].map(({l,v,t,c})=>(
              <div key={l}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[7.5px]" style={{color:C.txt2}}>{l}</span>
                  <span className="text-[8px] font-bold" style={{color:c}}>â‚¬{v}M</span>
                </div>
                <PBar v={(v/t)*100} c={c} h={5}/>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Cost & Savings by Route">
        <div className="flex-1 p-1" style={{height:150}}><ResponsiveContainer width="100%" height="100%">
          <BarChart data={costByRoute} margin={{top:4,right:16,bottom:0,left:-10}}>
            <XAxis dataKey="r" tick={{fill:C.txt3,fontSize:6}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="cost" name="Cost â‚¬M" fill={C.red} radius={[2,2,0,0]} barSize={16}/>
            <Bar dataKey="save" name="Saved â‚¬M" fill={C.green} radius={[2,2,0,0]} barSize={16}/>
          </BarChart>
        </ResponsiveContainer></div>
      </Panel>
    </div>
  );
}

// â”€â”€ View 5: AI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EAAIView(){
  const aiByType=[
    {t:"Animal on Track",v:5916,c:"#ff9800"},{t:"Track Debris",v:4287,c:"#ff1744"},
    {t:"Weather",v:2144,c:"#00b4d8"},{t:"Vehicle",v:1430,c:"#7c4dff"},{t:"Other",v:514,c:"#5a8aaa"},
  ];
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      <div className="grid grid-cols-4 gap-1 shrink-0">
        {[{l:"AI Detections / Month",v:"14,291",c:C.amber,sub:"â†‘ 7.3% vs prev"},{l:"Detection Accuracy",v:"98.1%",c:C.green,sub:"All model types"},{l:"Anomalies Detected",v:"24",c:C.red,sub:"Requires review"},{l:"AI Confidence Avg",v:"98.7%",c:C.blue,sub:"High precision"}].map(({l,v,c,sub})=>(
          <div key={l} className="rounded p-2" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
            <div className="text-[7px]" style={{color:C.txt2}}>{l}</div>
            <div className="text-[22px] font-bold" style={{color:c}}>{v}</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2.5fr 1fr 1fr",height:200}}>
        <Panel title="AI Detection Trends (6 Months)" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={AI_DET_TREND} margin={{top:4,right:4,bottom:0,left:-10}}>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="v" name="Detections" fill={C.purple} radius={[2,2,0,0]} barSize={24}/>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Detections by Type" className="h-full">
          <div className="flex-1 p-1 flex flex-col">
            <div style={{flex:1}}><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={aiByType} dataKey="v" cx="50%" cy="50%" innerRadius="38%" outerRadius="62%" strokeWidth={0}>
                {aiByType.map((e,i)=><Cell key={`ai-${e.t}`} fill={e.c}/>)}
              </Pie><Tooltip content={<TT/>}/></PieChart>
            </ResponsiveContainer></div>
            <div className="px-1 space-y-0.5">{aiByType.slice(0,4).map(t=>(
              <Row key={t.t}><Dot c={t.c}/><span className="text-[6.5px] flex-1 truncate" style={{color:C.txt2}}>{t.t}</span><span className="text-[7px] font-bold" style={{color:t.c}}>{t.v.toLocaleString()}</span></Row>
            ))}</div>
          </div>
        </Panel>
        <Panel title="AI Model Performance" className="h-full">
          <div className="p-2 flex flex-col gap-2">
            {[{l:"Detection Accuracy",v:98.1,c:C.green},{l:"Prediction Accuracy",v:98.2,c:C.green},{l:"AI Confidence",v:98.7,c:C.blue},{l:"False Positive Rate",v:1.3,c:C.red,inv:true}].map(({l,v,c,inv})=>(
              <div key={l}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[7px]" style={{color:C.txt2}}>{l}</span>
                  <span className="text-[8px] font-bold" style={{color:c}}>{v}%</span>
                </div>
                <PBar v={inv?v:v} c={c} h={4}/>
              </div>
            ))}
            <div className="flex items-center gap-1 mt-auto p-1 rounded" style={{background:C.green+"0d",border:`1px solid ${C.green}20`}}>
              <Brain size={8} style={{color:C.green}}/>
              <span className="text-[6.5px] font-bold" style={{color:C.green}}>All Models Active Â |  v3.1.0</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// â”€â”€ View 6: Predictive (reuses PM data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EAPredictiveView(){
  const pc:Record<string,string>={CRITICAL:C.red,HIGH:C.amber,MED:C.blue,LOW:C.green};
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      <div className="grid grid-cols-4 gap-1 shrink-0">
        {[{l:"Maintenance Cost",v:"â‚¬2.4M",c:C.green,sub:"â†“ 18% vs last month"},{l:"Active Alerts",v:"12",c:C.red,sub:"3 High Â |  5 Med Â |  4 Low"},{l:"Scheduled Jobs",v:"27",c:C.amber,sub:"Next 90 days"},{l:"Fleet Health",v:"79%",c:C.amber,sub:"13 assets monitored"}].map(({l,v,c,sub})=>(
          <div key={l} className="rounded p-2" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
            <div className="text-[7px]" style={{color:C.txt2}}>{l}</div>
            <div className="text-[22px] font-bold" style={{color:c}}>{v}</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5" style={{gridTemplateColumns:"2fr 1.2fr 1fr",height:190}}>
        <Panel title="Maintenance Cost Trend (â‚¬M)" className="h-full">
          <div className="flex-1 p-1"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MAINT_COST_TREND} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs><linearGradient id="g-pred-cost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.amber} stopOpacity="0.35"/>
                <stop offset="100%" stopColor={C.amber} stopOpacity="0"/>
              </linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="v" name="Cost â‚¬M" stroke={C.amber} strokeWidth={2} fill="url(#g-pred-cost)"/>
            </AreaChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Remaining Useful Life" className="h-full">
          <div className="p-1.5 flex flex-col gap-1.5">
            {PM_RUL.map((r,i)=>{const c=hue(r.rul);return(
              <div key={i}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[7px]" style={{color:C.txt}}>{r.sys}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] font-bold" style={{color:c}}>{r.rul}%</span>
                    <span className="text-[6px]" style={{color:C.txt3}}>{r.mo}mo</span>
                  </div>
                </div>
                <PBar v={r.rul} c={c} h={5}/>
              </div>
            );})}
          </div>
        </Panel>
        <Panel title="Failure Risk Forecast" className="h-full">
          <div className="flex-1 flex items-center justify-center p-1">
            <RiskGauge value={66.52}/>
          </div>
        </Panel>
      </div>
      <Panel title="Upcoming Maintenance Schedule">
        <div className="overflow-auto" style={{maxHeight:150}}>
          <table className="w-full text-[7.5px]">
            <thead><tr style={{background:C.bg1}}>
              {["Train","System","Type","Due (days)","Priority","Status"].map(h=><th key={h} className="px-2 py-1 text-left font-bold" style={{color:C.txt2}}>{h}</th>)}
            </tr></thead>
            <tbody>{PM_UPCOMING.map((u,i)=>{const c=pc[u.pri]??C.txt2;return(
              <tr key={i} style={{background:i%2===0?"transparent":C.bg1}}>
                <td className="px-2 py-1 font-mono font-bold" style={{color:C.blue}}>{u.train}</td>
                <td className="px-2 py-1" style={{color:C.txt}}>{u.sys}</td>
                <td className="px-2 py-1" style={{color:C.txt2}}>{u.type}</td>
                <td className="px-2 py-1" style={{color:c}}>{u.days}d</td>
                <td className="px-2 py-1"><Pill label={u.pri} c={c}/></td>
                <td className="px-2 py-1"><Pill label="Scheduled" c={C.blue}/></td>
              </tr>
            );})}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// â”€â”€ View 7: Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EAReportsView(){
  const reports=[
    {title:"Monthly Fleet Performance",date:"Jan 2026",type:"Performance",size:"2.4 MB",c:C.blue},
    {title:"Safety Incident Summary",date:"Jan 2026",type:"Safety",size:"1.1 MB",c:C.green},
    {title:"AI Detection Analysis",date:"Jan 2026",type:"AI Analytics",size:"3.2 MB",c:C.purple},
    {title:"Financial Impact Report",date:"Jan 2026",type:"Financial",size:"0.9 MB",c:C.amber},
    {title:"Maintenance Cost Report",date:"Jan 2026",type:"Maintenance",size:"1.7 MB",c:C.amber},
    {title:"Compliance & Certification",date:"Jan 2026",type:"Compliance",size:"0.6 MB",c:C.green},
  ];
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      <div className="grid grid-cols-3 gap-1.5">
        {reports.map(r=>(
          <div key={r.title} className="rounded p-3" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
            <div className="flex items-start justify-between mb-2">
              <FileText size={18} style={{color:r.c}}/>
              <Pill label={r.type} c={r.c}/>
            </div>
            <div className="text-[9px] font-bold mb-0.5" style={{color:C.txt}}>{r.title}</div>
            <div className="text-[7px] mb-2" style={{color:C.txt2}}>{r.date} Â |  {r.size}</div>
            <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[7.5px] font-bold w-full justify-center"
              style={{background:r.c+"18",border:`1px solid ${r.c}44`,color:r.c}}>
              <Download size={8}/> Download
            </button>
          </div>
        ))}
      </div>
      <Panel title="Recent Report Activity">
        <div className="p-2">
          {[{t:"Monthly Fleet Performance report generated",time:"28 Jan 2026 Â |  12:20",u:"System"},{t:"Safety Incident Summary exported by operator",time:"28 Jan 2026 Â |  09:15",u:"J. Martin"},{t:"AI Detection Analysis scheduled",time:"27 Jan 2026 Â |  17:00",u:"System"},{t:"Financial Impact Report downloaded",time:"26 Jan 2026 Â |  14:30",u:"A. Dupont"}].map((a,i)=>(
            <div key={i} className="flex items-center gap-2 py-1.5 border-b" style={{borderColor:C.border}}>
              <Dot c={C.blue}/>
              <div className="flex-1 min-w-0">
                <div className="text-[8px]" style={{color:C.txt}}>{a.t}</div>
                <div className="text-[6.5px]" style={{color:C.txt2}}>{a.time} Â |  {a.u}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// â”€â”€ View 8: Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EASettingsView(){
  return(
    <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-auto">
      {[
        {section:"Dashboard Preferences",items:[["Default View","Performance"],["Refresh Interval","Every 5 min"],["Date Range Default","Last 30 days"],["Chart Theme","Dark Navy"]]},
        {section:"Alert Configuration",items:[["Email Notifications","Enabled"],["Critical Alert Threshold","3+"],["SMS Alerts","Enabled"],["Alert Sound","Enabled"]]},
        {section:"Data Sources",items:[["Primary Data Feed","Connected"],["Backup Feed","Standby"],["API Version","v3.1.0"],["Last Full Sync","28 Jan 2026 12:20"]]},
        {section:"User & Access",items:[["Current User","Fleet Manager"],["Role","Administrator"],["Last Login","28 Jan 2026 08:45"],["Session Timeout","8 hours"]]},
      ].map(({section,items})=>(
        <Panel key={section} title={section}>
          <div className="p-2">
            {items.map(([k,v])=>(
              <div key={k} className="flex items-center justify-between py-1.5 border-b" style={{borderColor:C.border}}>
                <span className="text-[8px]" style={{color:C.txt2}}>{k}</span>
                <span className="text-[8px] font-bold" style={{color:C.txt}}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// â”€â”€ Executive Analytics shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EXEC_NAV=[
  {id:"Performance", Icon:BarChart2},
  {id:"Safety",      Icon:Shield},
  {id:"Fleet",       Icon:Train},
  {id:"Financial",   Icon:DollarSign},
  {id:"AI",          Icon:Brain},
  {id:"Predictive",  Icon:Wrench},
  {id:"Reports",     Icon:FileText},
  {id:"Settings",    Icon:Settings},
];

const EA_VIEWS:Record<string,React.ReactNode>={
  Performance:<EAPerformanceView/>,
  Safety:<EASafetyView/>,
  Fleet:<EAFleetView/>,
  Financial:<EAFinancialView/>,
  AI:<EAAIView/>,
  Predictive:<EAPredictiveView/>,
  Reports:<EAReportsView/>,
  Settings:<EASettingsView/>,
};

function ExecutiveAnalytics(){
  const [view,setView]=useState("Performance");
  const subtitles:Record<string,string>={
    Performance:"Performance Â |  Safety & Business Impact",
    Safety:"Safety Incidents Â |  Risk Analysis Â |  Alert Management",
    Fleet:"Fleet Composition Â |  Utilization Â |  Availability",
    Financial:"Cost Savings Â |  ROI Â |  Revenue Protection",
    AI:"AI Detections Â |  Model Performance Â |  Anomaly Analysis",
    Predictive:"Maintenance Forecasts Â |  RUL Â |  Risk Assessment",
    Reports:"Report Generation Â |  Export Â |  Activity Log",
    Settings:"Dashboard Configuration Â |  Alerts Â |  Data Sources",
  };
  return(
    <div className="flex h-full min-h-0 overflow-hidden" style={{background:C.bg0}}>
      {/* Sidebar */}
      <div className="shrink-0 flex flex-col" style={{width:148,background:C.bg1,borderRight:`1px solid ${C.border}`}}>
        <div className="flex items-center gap-2 px-3 py-2.5" style={{borderBottom:`1px solid ${C.border}`}}>
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{background:C.blue+"20",border:`1px solid ${C.blue}44`}}>
            <Shield size={12} style={{color:C.blue}}/>
          </div>
          <div>
            <div className="text-[9px] font-bold" style={{color:C.txt}}>RailSAFE AI</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>Fleet Analytics</div>
          </div>
        </div>
        <div className="flex-1 py-1">
          {EXEC_NAV.map(({id,Icon})=>{
            const active=view===id;
            return(
              <button key={id} onClick={()=>setView(id)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors"
                style={{color:active?C.blue:C.txt2,background:active?C.blue+"10":"transparent",
                  borderLeft:`2px solid ${active?C.blue:"transparent"}`}}>
                <Icon size={12} style={{color:active?C.blue:C.txt3}}/>
                <span className="text-[8.5px] font-bold">{id}</span>
              </button>
            );
          })}
        </div>
        <div className="px-3 py-2" style={{borderTop:`1px solid ${C.border}`}}>
          <div className="flex items-center gap-1 mb-1"><span className="w-1.5 h-1.5 rounded-full" style={{background:C.green}}/><span className="text-[7px]" style={{color:C.txt2}}>Data: Available</span></div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{background:C.blue}}/><span className="text-[7px]" style={{color:C.txt2}}>AI: Connected</span></div>
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5"
          style={{background:C.bg1,borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div className="text-[11px] font-bold" style={{color:C.txt}}>Executive / Fleet Analytics â€” {view}</div>
            <div className="text-[7.5px]" style={{color:C.txt2}}>{subtitles[view]}</div>
          </div>
          <Row className="gap-2">
            {[["Date Range","Jan 26â€“28, 2026"],["All Routes","â–¾"],["All Trains","â–¾"]].map(([l,v])=>(
              <div key={l} className="flex items-center gap-1 px-2 py-0.5 rounded text-[7.5px]"
                style={{background:C.bg2,border:`1px solid ${C.border}`,color:C.txt2}}>
                {l}: <span style={{color:C.txt}}>{v}</span>
              </div>
            ))}
            <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[7.5px] font-bold"
              style={{background:C.blue,color:C.bg0}}>
              <Download size={8}/> Export
            </button>
          </Row>
        </div>
        {EA_VIEWS[view]}
      </div>
    </div>
  );
}

// â”€â”€â”€ PREDICTIVE MAINTENANCE CONSOLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// PM Data
const PM_ASSET_HEALTH = [
  {sys:"Pantograph",      train:"TSV-001",age:"48 yrs",km:"41 km",  st:"Normal",  pct:90},
  {sys:"Battery System",  train:"TSV-001",age:"12 yrs",km:"187 km", st:"Critical",pct:32},
  {sys:"Suspension",      train:"TSV-002",age:"8 yrs", km:"45 km",  st:"Good",    pct:85},
  {sys:"Traction Motor",  train:"TGV-007",age:"15 yrs",km:"312 km", st:"Warning", pct:58},
  {sys:"Power Converter", train:"TGV-015",age:"6 yrs", km:"28 km",  st:"Good",    pct:95},
  {sys:"Wheel Sets",      train:"TSV-023",age:"22 yrs",km:"98 km",  st:"Monitor", pct:71},
  {sys:"HVAC System",     train:"TGV-003",age:"9 yrs", km:"65 km",  st:"Good",    pct:82},
  {sys:"Pantograph",      train:"TSV-018",age:"31 yrs",km:"71 km",  st:"Warning", pct:62},
];
const PM_ALERTS = [
  {id:"MA-001",sys:"Battery System", train:"TSV-023",sev:"HIGH",due:"Feb 11, 2026",conf:94,desc:"Immediate replacement required"},
  {id:"MA-002",sys:"Traction Motor", train:"TGV-007",sev:"HIGH",due:"Feb 14, 2026",conf:87,desc:"Bearing wear detected"},
  {id:"MA-003",sys:"Pantograph",     train:"TGV-041",sev:"MED", due:"Feb 18, 2026",conf:76,desc:"Contact strip degradation"},
  {id:"MA-004",sys:"Suspension",     train:"TSV-018",sev:"MED", due:"Feb 25, 2026",conf:82,desc:"Vibration anomaly detected"},
  {id:"MA-005",sys:"Brake System",   train:"TGV-003",sev:"LOW", due:"Mar 02, 2026",conf:68,desc:"Pad wear approaching limit"},
  {id:"MA-006",sys:"HVAC",           train:"TSV-011",sev:"LOW", due:"Mar 08, 2026",conf:61,desc:"Filter replacement due"},
];
const PM_UPCOMING = [
  {train:"TSV-023",sys:"Battery System",days:14,type:"Replacement",pri:"CRITICAL"},
  {train:"TGV-007",sys:"Traction Motor",days:17,type:"Inspection",  pri:"HIGH"},
  {train:"TGV-041",sys:"Pantograph",    days:21,type:"Service",     pri:"MED"},
  {train:"TSV-018",sys:"Suspension",    days:28,type:"Inspection",  pri:"MED"},
  {train:"TGV-003",sys:"Brake System",  days:35,type:"Service",     pri:"LOW"},
  {train:"TSV-011",sys:"HVAC",          days:42,type:"Replacement",  pri:"LOW"},
];
const PM_ANOMALIES = [
  {type:"Vibration",   cnt:8, color:"#ff1744"},
  {type:"Temperature", cnt:6, color:"#ff9800"},
  {type:"Electrical",  cnt:5, color:"#00b4d8"},
  {type:"Wear Pattern",cnt:5, color:"#7c4dff"},
];
const PM_NAV = [
  {id:"overview",    Icon:LayoutDashboard,label:"Overview"},
  {id:"health",      Icon:Heart,           label:"Health Monitor"},
  {id:"diagnostics", Icon:Stethoscope,     label:"Diagnostics"},
  {id:"maintenance", Icon:Wrench,          label:"Maintenance"},
  {id:"workorders",  Icon:ClipboardList,   label:"Work Orders"},
  {id:"reports",     Icon:BarChart2,       label:"Reports"},
  {id:"alerts",      Icon:Bell,            label:"Alerts"},
  {id:"settings",    Icon:Settings,        label:"Settings"},
];

// PM Overview main content
function PMOverview(){
  const stColor=(st:string)=>({Critical:C.red,Warning:C.amber,Monitor:C.amber,Good:C.green,Normal:C.blue}[st]??C.txt2);
  return(
    <div className="flex-1 min-h-0 overflow-auto p-1.5 flex flex-col gap-1.5">
      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-1.5">
        {/* Overall Fleet Health */}
        <Panel className="p-2">
          <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{color:C.blue}}>Overall Fleet Health</div>
          <div className="flex items-center gap-2">
            <div className="relative" style={{width:52,height:52}}>
              <svg viewBox="0 0 52 52" width="52" height="52">
                <circle cx="26" cy="26" r="20" fill="none" stroke="#0d2240" strokeWidth="6"/>
                <circle cx="26" cy="26" r="20" fill="none" stroke={C.amber} strokeWidth="6"
                  strokeDasharray={`${(79/100)*2*Math.PI*20} ${2*Math.PI*20}`}
                  transform="rotate(-90 26 26)" strokeLinecap="round"/>
                <text x="26" y="30" textAnchor="middle" fill={C.amber} fontSize="11" fontWeight="800">79%</text>
              </svg>
            </div>
            <div className="flex flex-col gap-0.5 text-[7px]">
              {[["Good (60-100%)",68,C.green],["Fair (40-60%)",14,C.amber],["Poor (<40%)",18,C.red]].map(([l,v,c])=>(
                <div key={l as string}><span style={{color:C.txt2}}>{l}: </span><span style={{color:c as string}}>{v}%</span></div>
              ))}
              <div style={{color:C.txt3}}>13 Trains Monitored</div>
            </div>
          </div>
        </Panel>
        {/* Assets Monitored */}
        <Panel className="p-2">
          <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{color:C.blue}}>Assets Monitored</div>
          <div className="text-[36px] font-black leading-none" style={{color:C.blue}}>156</div>
          <div className="text-[7px] mt-1" style={{color:C.txt2}}>Total Fleet Assets</div>
          <div className="mt-1 grid grid-cols-2 gap-0.5">
            {[["Active",142,C.green],["In Maint.",14,C.amber]].map(([l,v,c])=>(
              <div key={l as string} className="text-center rounded p-0.5" style={{background:C.bg1}}>
                <div className="text-[9px] font-bold" style={{color:c as string}}>{v}</div>
                <div className="text-[6px]" style={{color:C.txt3}}>{l}</div>
              </div>
            ))}
          </div>
        </Panel>
        {/* Active Alerts */}
        <Panel className="p-2">
          <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{color:C.blue}}>Active Alerts</div>
          <div className="flex items-baseline gap-1">
            <div className="text-[36px] font-black leading-none" style={{color:C.red}}>12</div>
            <div className="text-[8px]" style={{color:C.txt2}}>alerts</div>
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {[["High",3,C.red],["Medium",5,C.amber],["Low",4,C.green]].map(([l,v,c])=>(
              <div key={l as string} className="flex items-center justify-between">
                <div className="flex items-center gap-1"><Dot c={c as string}/><span className="text-[7px]" style={{color:C.txt2}}>{l}</span></div>
                <span className="text-[8px] font-bold" style={{color:c as string}}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
        {/* Upcoming Maintenance */}
        <Panel className="p-2">
          <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{color:C.blue}}>Upcoming Maintenance</div>
          <div className="flex items-baseline gap-1">
            <div className="text-[36px] font-black leading-none" style={{color:C.amber}}>27</div>
            <div className="text-[8px]" style={{color:C.txt2}}>scheduled</div>
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {[["< 30 days",3,C.red],["31-90 days",5,C.amber],["90+ days",19,C.green]].map(([l,v,c])=>(
              <div key={l as string} className="flex justify-between">
                <span className="text-[7px]" style={{color:C.txt2}}>{l}</span>
                <span className="text-[8px] font-bold" style={{color:c as string}}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
        {/* Maintenance Cost */}
        <Panel className="p-2">
          <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{color:C.blue}}>Maintenance Cost</div>
          <div className="text-[28px] font-black leading-none" style={{color:C.green}}>â‚¬2.4M</div>
          <div className="text-[7px] mt-0.5" style={{color:C.txt2}}>This Month</div>
          <div className="text-[7px] mt-1 flex items-center gap-1" style={{color:C.green}}>
            <TrendingDown size={9}/> â†“ 18% vs last month
          </div>
          <div className="text-[6.5px] mt-0.5" style={{color:C.txt3}}>Last Updated: 28 Jan 12:25:31</div>
        </Panel>
      </div>

      {/* Row 2: Asset Health | Alerts | Upcoming */}
      <div className="grid gap-1.5 min-h-0" style={{gridTemplateColumns:"2fr 1.5fr 1.5fr",height:200}}>
        {/* Asset Health Details */}
        <Panel title="Asset Health Details" className="h-full">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead>
                <tr style={{background:C.bg1}}>
                  {["System","Train","Age","km","Status","Health"].map(h=>(
                    <th key={h} className="px-1.5 py-1 text-left text-[7px] font-bold" style={{color:C.txt2}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PM_ASSET_HEALTH.map((a,i)=>{
                  const c=hue(a.pct);
                  return(
                    <tr key={i} style={{background:i%2===0?"transparent":C.bg1}}>
                      <td className="px-1.5 py-0.5 text-[7.5px]" style={{color:C.txt}}>{a.sys}</td>
                      <td className="px-1.5 py-0.5 text-[7px] font-mono" style={{color:C.blue}}>{a.train}</td>
                      <td className="px-1.5 py-0.5 text-[7px]" style={{color:C.txt2}}>{a.age}</td>
                      <td className="px-1.5 py-0.5 text-[7px]" style={{color:C.txt2}}>{a.km}</td>
                      <td className="px-1.5 py-0.5"><Pill label={a.st} c={stColor(a.st)}/></td>
                      <td className="px-1.5 py-0.5 w-20">
                        <div className="flex items-center gap-1">
                          <PBar v={a.pct} c={c} h={4}/>
                          <span className="text-[6.5px] font-mono shrink-0" style={{color:c}}>{a.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Maintenance Alerts */}
        <Panel title="Maintenance Alerts" className="h-full">
          <div className="flex-1 overflow-auto p-1.5 flex flex-col gap-1">
            {PM_ALERTS.map((a,i)=>(
              <div key={i} className="p-1.5 rounded" style={{background:C.bg1,border:`1px solid ${C.border}`}}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[7.5px] font-bold" style={{color:C.txt}}>{a.sys}</span>
                  <SevPill sev={a.sev}/>
                </div>
                <div className="text-[6.5px]" style={{color:C.txt2}}>{a.train} Â |  {a.due}</div>
                <div className="text-[6.5px] mt-0.5" style={{color:C.txt3}}>{a.desc}</div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[6px]" style={{color:C.txt3}}>{a.id}</span>
                  <span className="text-[6px]" style={{color:C.blue}}>AI Conf: {a.conf}%</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Upcoming Maintenance */}
        <Panel title="Upcoming Maintenance" className="h-full">
          <div className="flex-1 overflow-auto p-1.5 flex flex-col gap-1">
            {PM_UPCOMING.map((u,i)=>{
              const pc:Record<string,string>={CRITICAL:C.red,HIGH:C.amber,MED:C.blue,LOW:C.green};
              const c=pc[u.pri]??C.txt2;
              return(
                <div key={i} className="p-1.5 rounded" style={{background:C.bg1,border:`1px solid ${c}28`}}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[7.5px] font-bold font-mono" style={{color:C.blue}}>{u.train}</span>
                    <Pill label={u.pri} c={c}/>
                  </div>
                  <div className="text-[7px]" style={{color:C.txt}}>{u.sys} â€” {u.type}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[6.5px]" style={{color:C.txt2}}>Due in {u.days} days</span>
                    <div className="flex-1 mx-2 h-0.5 rounded overflow-hidden" style={{background:C.bg0}}>
                      <div className="h-full rounded" style={{width:`${Math.min((u.days/42)*100,100)}%`,background:c}}/>
                    </div>
                    <span className="text-[6px]" style={{color:c}}>{u.days}d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Row 3: Diagnostics | RUL | Risk Forecast | AI Anomaly | AI Model */}
      <div className="grid gap-1.5" style={{gridTemplateColumns:"1fr 1.4fr 1fr 1fr 0.9fr",height:180}}>
        {/* Diagnostic Tools */}
        <Panel title="Diagnostic Tools" className="h-full">
          <div className="p-1.5 flex flex-col gap-1">
            {[
              {l:"Full System Scan",    ic:<Play size={8}/>,     c:C.blue},
              {l:"Component Analysis",  ic:<Cpu size={8}/>,      c:C.blue},
              {l:"Vibration Analysis",  ic:<Activity size={8}/>, c:C.blue},
              {l:"Thermal Imaging",     ic:<Thermometer size={8}/>,c:C.amber},
              {l:"Pattern Recognition", ic:<Brain size={8}/>,    c:C.purple},
              {l:"Predictive Scan",     ic:<Eye size={8}/>,      c:C.green},
            ].map(({l,ic,c})=>(
              <button key={l} className="flex items-center gap-2 px-2 py-1 rounded text-left transition-colors w-full"
                style={{background:C.bg1,border:`1px solid ${C.border}`,color:c}}>
                {ic}
                <span className="text-[7.5px] font-bold">{l}</span>
              </button>
            ))}
          </div>
        </Panel>

        {/* Remaining Useful Life */}
        <Panel title="Remaining Useful Life" className="h-full">
          <div className="p-1.5 flex flex-col gap-1.5">
            {PM_RUL.map((r,i)=>{
              const c=hue(r.rul);
              return(
                <div key={i}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[7.5px]" style={{color:C.txt}}>{r.sys}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-bold" style={{color:c}}>{r.rul}%</span>
                      <span className="text-[6.5px]" style={{color:C.txt3}}>{r.mo} mo</span>
                    </div>
                  </div>
                  <PBar v={r.rul} c={c} h={5}/>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Failure Risk Forecast */}
        <Panel title="Failure Risk Forecast" className="h-full">
          <div className="flex-1 flex items-center justify-center p-1">
            <RiskGauge value={66.52}/>
          </div>
        </Panel>

        {/* AI Anomaly Detection */}
        <Panel title="AI Anomaly Detection" className="h-full">
          <div className="flex-1 p-1 flex flex-col">
            <div style={{flex:1}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PM_ANOMALIES} dataKey="cnt" cx="50%" cy="50%"
                    innerRadius="38%" outerRadius="62%" strokeWidth={0}>
                    {PM_ANOMALIES.map((e,i)=><Cell key={`pm-${e.type}`} fill={e.color}/>)}
                  </Pie>
                  <Tooltip content={<TT/>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[8px] font-bold mb-1" style={{color:C.red}}>24 Anomalies</div>
            <div className="space-y-0.5 px-1">
              {PM_ANOMALIES.map(a=>(
                <Row key={a.type}><Dot c={a.color}/><span className="text-[6.5px] flex-1" style={{color:C.txt2}}>{a.type}</span><span className="text-[7px] font-bold" style={{color:a.color}}>{a.cnt}</span></Row>
              ))}
            </div>
          </div>
        </Panel>

        {/* AI Model Performance */}
        <Panel title="AI Model" className="h-full">
          <div className="p-1.5 flex flex-col gap-1.5">
            {[
              {l:"Detection Acc.",v:"98.1%",c:C.green},
              {l:"Prediction Acc.",v:"98.2%",c:C.green},
              {l:"AI Confidence",  v:"98.7%",c:C.blue},
            ].map(({l,v,c})=>(
              <div key={l}>
                <div className="text-[7px]" style={{color:C.txt2}}>{l}</div>
                <div className="text-[15px] font-bold leading-none" style={{color:c}}>{v}</div>
                <PBar v={parseFloat(v)} c={c} h={3}/>
              </div>
            ))}
            <div className="mt-auto flex items-center gap-1 p-1 rounded"
              style={{background:C.green+"0d",border:`1px solid ${C.green}20`}}>
              <Brain size={8} style={{color:C.green}}/>
              <span className="text-[6.5px] font-bold" style={{color:C.green}}>AI Active Â |  98.1%</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// PM sub-views
function PMHealthView(){
  return(
    <div className="flex-1 overflow-auto p-2 flex flex-col gap-1.5">
      <Panel title="Asset Health â€” Detailed Monitor">
        <div className="p-2 grid grid-cols-3 gap-2">
          {PM_ASSET_HEALTH.map((a,i)=>{const c=hue(a.pct);return(
            <div key={i} className="rounded p-2" style={{background:C.bg1,border:`1px solid ${c}30`}}>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] font-bold" style={{color:C.txt}}>{a.sys}</span>
                <Pill label={a.st} c={c}/>
              </div>
              <div className="text-[22px] font-black" style={{color:c}}>{a.pct}%</div>
              <PBar v={a.pct} c={c} h={5}/>
              <div className="flex justify-between mt-1">
                <span className="text-[7px]" style={{color:C.txt2}}>{a.train}</span>
                <span className="text-[7px]" style={{color:C.txt3}}>{a.age} Â |  {a.km}</span>
              </div>
            </div>
          );})}
        </div>
      </Panel>
    </div>
  );
}

function PMDiagnosticsView(){
  const [running,setRunning]=useState<string|null>(null);
  const tools=[
    {l:"Full System Scan",     desc:"Complete diagnostic of all systems",           est:"~4 min"},
    {l:"Component Analysis",   desc:"Deep-dive into individual components",         est:"~2 min"},
    {l:"Vibration Analysis",   desc:"Real-time vibration spectrum analysis",        est:"~1 min"},
    {l:"Thermal Imaging",      desc:"AI-powered thermal pattern recognition",       est:"~3 min"},
    {l:"Pattern Recognition",  desc:"ML anomaly pattern detection",                 est:"~5 min"},
    {l:"Predictive Scan",      desc:"Failure probability modelling",                est:"~6 min"},
  ];
  return(
    <div className="flex-1 overflow-auto p-2 flex flex-col gap-1.5">
      <Panel title="Diagnostic Tools â€” Select & Run">
        <div className="p-2 grid grid-cols-2 gap-2">
          {tools.map(t=>(
            <div key={t.l} className="rounded p-2" style={{background:C.bg1,border:`1px solid ${C.border}`}}>
              <div className="text-[9px] font-bold mb-0.5" style={{color:C.txt}}>{t.l}</div>
              <div className="text-[7.5px] mb-1" style={{color:C.txt2}}>{t.desc}</div>
              <div className="flex items-center justify-between">
                <span className="text-[7px]" style={{color:C.txt3}}>Est: {t.est}</span>
                <button onClick={()=>setRunning(t.l)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[7.5px] font-bold"
                  style={{background:running===t.l?C.amber:C.blue,color:C.bg0}}>
                  <Play size={7}/>{running===t.l?"Runningâ€¦":"Run"}
                </button>
              </div>
              {running===t.l&&(
                <div className="mt-1 overflow-hidden rounded-full" style={{height:2,background:C.bg0}}>
                  <div className="h-full rounded-full animate-pulse" style={{width:"60%",background:C.amber}}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PMMaintenanceView(){
  return(
    <div className="flex-1 overflow-auto p-2 flex flex-col gap-1.5">
      <Panel title="Maintenance Schedule">
        <div className="p-2">
          <table className="w-full text-[8px]">
            <thead><tr style={{background:C.bg1}}>
              {["Train","System","Type","Due Date","Days","Priority","Status"].map(h=>(
                <th key={h} className="px-2 py-1 text-left font-bold" style={{color:C.txt2}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {PM_UPCOMING.map((u,i)=>{
                const pc:Record<string,string>={CRITICAL:C.red,HIGH:C.amber,MED:C.blue,LOW:C.green};
                const c=pc[u.pri]??C.txt2;
                return(
                  <tr key={i} style={{background:i%2===0?"transparent":C.bg1}}>
                    <td className="px-2 py-1 font-mono font-bold" style={{color:C.blue}}>{u.train}</td>
                    <td className="px-2 py-1" style={{color:C.txt}}>{u.sys}</td>
                    <td className="px-2 py-1" style={{color:C.txt2}}>{u.type}</td>
                    <td className="px-2 py-1 font-mono" style={{color:C.txt2}}>Feb/Mar 2026</td>
                    <td className="px-2 py-1" style={{color:c}}>{u.days}d</td>
                    <td className="px-2 py-1"><Pill label={u.pri} c={c}/></td>
                    <td className="px-2 py-1"><Pill label="Scheduled" c={C.blue}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function PMWorkOrdersView(){
  const orders=[
    {id:"WO-2641",sys:"Battery System",train:"TSV-023",tech:"J. Martin",status:"Open",   priority:"CRITICAL"},
    {id:"WO-2640",sys:"Traction Motor", train:"TGV-007",tech:"A. Dupont",status:"In Progress",priority:"HIGH"},
    {id:"WO-2639",sys:"Pantograph",     train:"TGV-041",tech:"L. Blanc", status:"Open",   priority:"MED"},
    {id:"WO-2638",sys:"Suspension",     train:"TSV-018",tech:"M. Petit", status:"Pending",priority:"MED"},
    {id:"WO-2637",sys:"Brake System",   train:"TGV-003",tech:"R. Simon", status:"Open",   priority:"LOW"},
    {id:"WO-2636",sys:"HVAC",           train:"TSV-011",tech:"C. Morel", status:"Closed", priority:"LOW"},
  ];
  const sc:Record<string,string>={Open:C.amber,"In Progress":C.blue,Pending:C.txt2,Closed:C.green};
  return(
    <div className="flex-1 overflow-auto p-2">
      <Panel title="Work Orders">
        <div className="p-2">
          <table className="w-full text-[8px]">
            <thead><tr style={{background:C.bg1}}>
              {["WO #","System","Train","Technician","Priority","Status"].map(h=>(
                <th key={h} className="px-2 py-1 text-left font-bold" style={{color:C.txt2}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {orders.map((o,i)=>{
                const pc:Record<string,string>={CRITICAL:C.red,HIGH:C.amber,MED:C.blue,LOW:C.green};
                return(
                  <tr key={i} style={{background:i%2===0?"transparent":C.bg1}}>
                    <td className="px-2 py-1 font-mono font-bold" style={{color:C.blue}}>{o.id}</td>
                    <td className="px-2 py-1" style={{color:C.txt}}>{o.sys}</td>
                    <td className="px-2 py-1 font-mono" style={{color:C.txt2}}>{o.train}</td>
                    <td className="px-2 py-1" style={{color:C.txt2}}>{o.tech}</td>
                    <td className="px-2 py-1"><Pill label={o.priority} c={pc[o.priority]??C.txt2}/></td>
                    <td className="px-2 py-1"><Pill label={o.status} c={sc[o.status]??C.txt2}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function PMReportsView(){
  return(
    <div className="flex-1 overflow-auto p-2 flex flex-col gap-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {[{l:"Monthly Maintenance Report",d:"Jan 2026 complete",c:C.green},{l:"Fleet Health Summary",d:"28 Jan 2026",c:C.blue},{l:"AI Prediction Accuracy",d:"Last 30 days",c:C.purple}].map(({l,d,c})=>(
          <div key={l} className="rounded p-3" style={{background:C.bg2,border:`1px solid ${C.border}`}}>
            <FileText size={20} style={{color:c}} className="mb-2"/>
            <div className="text-[9px] font-bold" style={{color:C.txt}}>{l}</div>
            <div className="text-[7.5px] mt-0.5" style={{color:C.txt2}}>{d}</div>
            <button className="mt-2 flex items-center gap-1 px-2 py-0.5 rounded text-[7.5px] font-bold"
              style={{background:c+"18",border:`1px solid ${c}44`,color:c}}>
              <Download size={8}/> Download
            </button>
          </div>
        ))}
      </div>
      <Panel title="Maintenance Cost Trend">
        <div className="p-2" style={{height:160}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MAINT_COST_TREND} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs><linearGradient id="g-pm-reports-cost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.amber} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={C.amber} stopOpacity="0"/>
              </linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txt3,fontSize:7}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="v" name="Cost â‚¬M" stroke={C.amber} strokeWidth={1.5} fill="url(#g-pm-reports-cost)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

function PMAlertsView(){
  return(
    <div className="flex-1 overflow-auto p-2">
      <Panel title="All Active Alerts">
        <div className="p-2 flex flex-col gap-1">
          {PM_ALERTS.map((a,i)=>(
            <div key={i} className="flex items-start gap-2 p-2 rounded" style={{background:C.bg1,border:`1px solid ${C.border}`}}>
              <AlertTriangle size={12} style={{color:{HIGH:C.red,MED:C.amber,LOW:C.green}[a.sev]??C.txt2,marginTop:2}}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8.5px] font-bold" style={{color:C.txt}}>{a.sys}</span>
                  <SevPill sev={a.sev}/>
                  <span className="text-[7px] font-mono" style={{color:C.txt3}}>{a.id}</span>
                </div>
                <div className="text-[7.5px]" style={{color:C.txt2}}>{a.desc}</div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[7px]" style={{color:C.txt3}}>Train: {a.train}</span>
                  <span className="text-[7px]" style={{color:C.txt3}}>Due: {a.due}</span>
                  <span className="text-[7px]" style={{color:C.blue}}>AI Conf: {a.conf}%</span>
                </div>
              </div>
              <button className="px-2 py-0.5 rounded text-[7px] font-bold shrink-0"
                style={{background:C.blue+"18",border:`1px solid ${C.blue}44`,color:C.blue}}>Acknowledge</button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PMSettingsView(){
  return(
    <div className="flex-1 overflow-auto p-2 flex flex-col gap-1.5">
      {[
        {section:"Alert Thresholds",items:[["Health Critical Threshold","<40%"],["Health Warning Threshold","<70%"],["Alert Email Notifications","Enabled"],["SMS Alerts","Enabled"]]},
        {section:"AI Configuration",items:[["Model Version","v3.1.0"],["Prediction Horizon","30 days"],["Confidence Threshold","75%"],["Auto-schedule Maintenance","Enabled"]]},
        {section:"Data & Sync",items:[["Sync Interval","Every 5 min"],["Data Retention","24 months"],["API Integration","Connected"],["Last Full Sync","28 Jan 2026 12:20"]]},
      ].map(({section,items})=>(
        <Panel key={section} title={section}>
          <div className="p-2">
            {items.map(([k,v])=>(
              <div key={k} className="flex items-center justify-between py-1 border-b" style={{borderColor:C.border}}>
                <span className="text-[8px]" style={{color:C.txt2}}>{k}</span>
                <span className="text-[8px] font-bold" style={{color:C.txt}}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// Main PM Console shell
function PredictiveMaintenanceConsole(){
  const [pmView,setPmView]=useState("overview");
  const views:Record<string,React.ReactNode>={
    overview:<PMOverview/>,health:<PMHealthView/>,diagnostics:<PMDiagnosticsView/>,
    maintenance:<PMMaintenanceView/>,workorders:<PMWorkOrdersView/>,
    reports:<PMReportsView/>,alerts:<PMAlertsView/>,settings:<PMSettingsView/>,
  };
  return(
    <div className="flex h-full min-h-0 overflow-hidden" style={{background:C.bg0}}>
      {/* Sidebar */}
      <div className="shrink-0 flex flex-col" style={{width:148,background:C.bg1,borderRight:`1px solid ${C.border}`}}>
        {/* Brand */}
        <div className="flex items-center gap-2 px-3 py-2.5" style={{borderBottom:`1px solid ${C.border}`}}>
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{background:C.blue+"20",border:`1px solid ${C.blue}44`}}>
            <Wrench size={12} style={{color:C.blue}}/>
          </div>
          <div>
            <div className="text-[9px] font-bold" style={{color:C.txt}}>Predictive</div>
            <div className="text-[6.5px]" style={{color:C.txt3}}>Maintenance AI</div>
          </div>
        </div>
        {/* Nav */}
        <div className="flex-1 py-1">
          {PM_NAV.map(({id,Icon,label})=>{
            const active=pmView===id;
            return(
              <button key={id} onClick={()=>setPmView(id)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors relative"
                style={{color:active?C.blue:C.txt2,background:active?C.blue+"10":"transparent",
                  borderLeft:`2px solid ${active?C.blue:"transparent"}`}}>
                <Icon size={12} style={{color:active?C.blue:C.txt3}}/>
                <span className="text-[8.5px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
        {/* Status footer */}
        <div className="px-3 py-2" style={{borderTop:`1px solid ${C.border}`}}>
          <div className="text-[6.5px] font-bold mb-1 uppercase tracking-wide" style={{color:C.txt3}}>System Status</div>
          {[["Data Source","Connected",C.green],["AI Engine","Active",C.blue]].map(([l,v,c])=>(
            <div key={l} className="flex items-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:c as string}}/>
              <span className="text-[6.5px]" style={{color:C.txt2}}>{l}: </span>
              <span className="text-[6.5px] font-bold" style={{color:c as string}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Header + Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top header */}
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5"
          style={{background:C.bg1,borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div className="text-[11px] font-bold" style={{color:C.txt}}>Predictive Maintenance Console</div>
            <div className="text-[7.5px]" style={{color:C.txt2}}>Asset Health, Maintenance & AI Intelligence</div>
          </div>
          <Row className="gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[7.5px]"
              style={{background:C.bg2,border:`1px solid ${C.border}`,color:C.txt2}}>
              <Calendar size={8}/> 28 Jan 2026
            </div>
            <div className="text-[10px] font-mono font-bold" style={{color:C.txt}}>12:25:31</div>
            <button className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{background:C.bg2,border:`1px solid ${C.border}`,color:C.txt2}}>
              <RefreshCw size={9}/>
            </button>
          </Row>
        </div>
        {/* View content */}
        {views[pmView]}
      </div>
    </div>
  );
}

// â”€â”€â”€ Image Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ImgTab({src,alt}:{src:string;alt:string}){
  return(
    <div className="flex-1 flex items-start justify-center p-2 overflow-auto" style={{background:C.bg0}}>
      <ImageWithFallback src={src} alt={alt} className="max-w-full h-auto object-contain rounded"/>
    </div>
  );
}

// â”€â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS:{id:Tab;label:string;I:React.ElementType}[]=[
  {id:"france",       label:"Control Centre",     I:Monitor},
  {id:"hmi",          label:"Driver HMI",          I:Gauge},
  {id:"executive",    label:"Fleet Analytics",     I:BarChart2},
  {id:"maintenance",  label:"Maintenance",         I:Wrench},
  {id:"arch-feat",    label:"Sys. Architecture",   I:Network},
  {id:"arch-inv",     label:"Investor View",       I:Users},
  {id:"pipeline",     label:"AI/ML Pipeline",      I:Cpu},
  {id:"certification",label:"Certification",       I:Award},
];

export default function App(){
  const [tab,setTab]=useState<Tab>("france");
  return(
    <div className="size-full flex flex-col overflow-hidden"
      style={{background:C.bg0,color:C.txt,fontFamily:"'JetBrains Mono','Inter','Segoe UI','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif",fontSize:12}}>
      {/* Tab bar */}
      <div className="shrink-0 flex items-center overflow-x-auto"
        style={{background:"#030b16",borderBottom:`1px solid ${C.border}`}}>
        <div className="flex items-center gap-1.5 px-3 py-2 shrink-0" style={{borderRight:`1px solid ${C.border}`}}>
          <div className="w-5 h-5 rounded flex items-center justify-center"
            style={{background:C.blue+"18",border:`1px solid ${C.blue}44`}}>
            <Shield size={10} style={{color:C.blue}}/>
          </div>
          <span className="text-[9px] font-bold tracking-widest" style={{color:C.blue}}>RailSAFE AI</span>
        </div>
        {TABS.map(({id,label,I})=>(
          <button key={id} onClick={()=>setTab(id)}
            className="flex items-center gap-1.5 px-3 py-2 transition-colors shrink-0"
            style={{fontSize:8,fontWeight:700,letterSpacing:"0.07em",
              color:tab===id?C.blue:C.txt2,
              background:tab===id?C.blue+"0c":"transparent",
              borderBottom:`2px solid ${tab===id?C.blue:"transparent"}`}}>
            <I size={10}/>{label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-3 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:C.green}}/>
          <span className="text-[8px] font-bold" style={{color:C.green}}>LIVE</span>
          <span className="text-[7px] ml-1" style={{color:C.txt3}}>v3.1.0</span>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {tab==="france"        && <ControlCentre/>}
        {tab==="hmi"           && <DriverHMI/>}
        {tab==="executive"     && <ExecutiveAnalytics/>}
        {tab==="maintenance"   && <PredictiveMaintenanceConsole/>}
        {tab==="arch-feat"     && <ImgTab src={archFeatImg} alt="System Architecture â€” Features"/>}
        {tab==="arch-inv"      && <ImgTab src={archInvImg}  alt="System Architecture â€” Investor"/>}
        {tab==="pipeline"      && <ImgTab src={aimlImg}     alt="AI/ML Pipeline Architecture"/>}
        {tab==="certification" && <ImgTab src={certImg}     alt="Certification Roadmap Timeline"/>}
      </div>
    </div>
  );
}

