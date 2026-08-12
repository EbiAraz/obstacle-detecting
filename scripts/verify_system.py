#!/usr/bin/env python3
"""
Railway AI System - Verification & Setup Checker
Verifies all components are properly configured and ready to run
"""

import sys
import os
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from railway_ai_system.config import JOURNEY_DATABASE_PATH, LEGACY_SENSOR_DATABASE_PATH

class SystemVerifier:
    def __init__(self):
        self.base_path = PROJECT_ROOT
        self.results = {
            'system_info': {},
            'files': {},
            'packages': {},
            'warnings': [],
            'ready': True
        }
    
    def check_python_version(self):
        """Check Python version (3.7+ required)"""
        version = sys.version_info
        py_version = f"{version.major}.{version.minor}.{version.micro}"
        
        if version.major < 3 or (version.major == 3 and version.minor < 7):
            self.results['warnings'].append(f"⚠️  Python 3.7+ required, found {py_version}")
            self.results['ready'] = False
        else:
            self.results['system_info']['python_version'] = py_version
        
        return f"✅ Python {py_version}"
    
    def check_platform(self):
        """Check operating system"""
        platform = sys.platform
        self.results['system_info']['platform'] = platform
        return f"✅ Platform: {platform}"
    
    def check_files(self):
        """Check if all required files exist"""
        required_files = [
            'main.py',
            'train.py',
            'client.py',
            'server.py',
            'railway_ai_system/app.py',
            'railway_ai_system/config.py',
            'railway_ai_system/core/ai.py',
            'railway_ai_system/core/logging.py',
            'railway_ai_system/domain/route_config.py',
            'railway_ai_system/federated/learning.py',
            'railway_ai_system/reporting/generator.py',
            'railway_ai_system/sensors/crossing_fusion.py',
            'railway_ai_system/services/monitoring.py',
            'railway_ai_system/simulation/standalone.py',
            'railway_ai_system/web/dashboard.py',
            'scripts/verify_system.py',
            'requirements.txt',
            'pyproject.toml',
        ]
        
        missing = []
        for file in required_files:
            file_path = self.base_path / file
            exists = file_path.exists()
            self.results['files'][file] = exists
            if not exists:
                missing.append(file)
        
        if missing:
            self.results['warnings'].append(f"❌ Missing files: {', '.join(missing)}")
            self.results['ready'] = False
            return f"❌ Missing {len(missing)} files"
        
        return f"✅ All {len(required_files)} core files present"
    
    def check_packages(self):
        """Check if required packages are installed"""
        packages = {
            'torch': 'PyTorch (AI/ML)',
            'flask': 'Flask (Web Framework)',
            'flask_cors': 'Flask-CORS',
            'folium': 'Folium (Maps)',
            'PIL': 'Pillow (Images)',
            'numpy': 'NumPy',
            'pandas': 'Pandas',
            'flwr': 'Flower (Federated Learning)',
            'sqlalchemy': 'SQLAlchemy',
        }
        
        missing = []
        installed = []
        
        for package, name in packages.items():
            try:
                __import__(package)
                self.results['packages'][package] = True
                installed.append(f"✅ {name}")
            except ImportError:
                self.results['packages'][package] = False
                missing.append(f"❌ {name}")
        
        if missing:
            self.results['warnings'].append(f"Missing packages: {', '.join([m.split(' ')[1] for m in missing])}")
            return f"⚠️  {len(installed)}/{len(packages)} packages installed\n\n" + "\n".join(installed + missing)
        
        return f"✅ All {len(packages)} packages installed\n\n" + "\n".join(installed)
    
    def check_directories(self):
        """Check/create required directories"""
        dirs = ['journey_logs', 'journey_logs/images', 'journey_logs/maps', 'journey_logs/exports', 'ai_models', 'templates', 'static']
        
        for dir_name in dirs:
            dir_path = self.base_path / dir_name
            if dir_path.exists():
                self.results[f'dir_{dir_name}'] = True
            else:
                try:
                    dir_path.mkdir(parents=True, exist_ok=True)
                    self.results[f'dir_{dir_name}'] = True
                except Exception as e:
                    self.results['warnings'].append(f"❌ Cannot create {dir_name}: {e}")
                    self.results['ready'] = False
        
        return f"✅ Required directories ready"
    
    def check_databases(self):
        """Check if databases exist/can be created"""
        dbs = [LEGACY_SENSOR_DATABASE_PATH, JOURNEY_DATABASE_PATH]
        
        for db in dbs:
            db_path = Path(db)
            if db_path.exists():
                self.results[f'db_{db_path.name}'] = True
            else:
                try:
                    db_path.parent.mkdir(parents=True, exist_ok=True)
                    db_path.touch(exist_ok=True)
                    self.results[f'db_{db_path.name}'] = True
                except Exception as e:
                    self.results['warnings'].append(f"❌ Cannot access {db_path.name}: {e}")
                    self.results['ready'] = False
        
        return f"✅ Database files accessible"
    
    def check_config(self):
        """Check configuration files"""
        configs = ['pyproject.toml', 'requirements.txt']
        
        for config in configs:
            config_path = self.base_path / config
            if config_path.exists():
                self.results[f'config_{config}'] = True
        
        return f"✅ Configuration files present"
    
    def generate_report(self):
        """Generate verification report"""
        print("\n" + "="*80)
        print("   🚂 RAILWAY AI SYSTEM - VERIFICATION REPORT")
        print("="*80 + "\n")
        
        print("📊 SYSTEM INFORMATION")
        print("-" * 80)
        print(self.check_python_version())
        print(self.check_platform())
        print()
        
        print("📁 FILES & STRUCTURE")
        print("-" * 80)
        print(self.check_files())
        print(self.check_directories())
        print()
        
        print("📦 PACKAGES")
        print("-" * 80)
        print(self.check_packages())
        print()
        
        print("💾 DATABASES")
        print("-" * 80)
        print(self.check_databases())
        print()
        
        print("⚙️ CONFIGURATION")
        print("-" * 80)
        print(self.check_config())
        print()
        
        print("="*80)
        if self.results['warnings']:
            print("⚠️  WARNINGS:")
            for warning in self.results['warnings']:
                print(f"   {warning}")
            print()
        
        if self.results['ready']:
            print("✅ SYSTEM STATUS: READY TO RUN")
            print("\nNext steps:")
            print("  1. pip install -r requirements.txt")
            print("  2. python main.py --mode complete")
            print("  3. Or run: python train.py")
            print("  4. Visit http://localhost:5001")
        else:
            print("❌ SYSTEM STATUS: NEEDS ATTENTION")
            print("\nPlease fix the issues above before running the system.")
        
        print("\n" + "="*80)
        print("\n")
        
        return self.results
    
    def save_report(self, filename='outputs/verification/system_verification.json'):
        """Save verification report to file"""
        report_path = self.base_path / filename
        try:
            report_path.parent.mkdir(parents=True, exist_ok=True)
            with open(report_path, 'w') as f:
                json.dump(self.results, f, indent=2)
            return f"✅ Report saved to {filename}"
        except Exception as e:
            return f"❌ Cannot save report: {e}"


def main():
    """Run verification"""
    verifier = SystemVerifier()
    results = verifier.generate_report()
    print(verifier.save_report())
    
    return 0 if results['ready'] else 1


if __name__ == '__main__':
    exit(main())
