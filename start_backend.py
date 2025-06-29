#!/usr/bin/env python3
"""
Startup script for SegnoVivo Hand Gesture Recognition Backend
This script starts the Flask server that handles gesture recognition
"""

import os
import sys
import subprocess
import time

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = [
        'opencv-python',
        'mediapipe', 
        'tensorflow',
        'numpy',
        'pandas',
        'flask',
        'flask-cors',
        'flask-socketio'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Installing missing packages...")
        subprocess.run([sys.executable, '-m', 'pip', 'install'] + missing_packages)
        print("✅ Packages installed successfully!")
    else:
        print("✅ All required packages are installed!")

def check_model_files():
    """Check if the trained model files exist"""
    required_files = [
        'Predictor/gesture_model.h5',
        'Predictor/label_map.npy'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing model files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print("\n⚠️  You need to train the model first!")
        print("   Run: python Predictor/train_model.py")
        return False
    
    print("✅ Model files found!")
    return True

def start_server():
    """Start the Flask server"""
    print("\n🚀 Starting SegnoVivo Gesture Recognition Server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("📱 WebSocket will be available at: ws://localhost:5000")
    print("\n⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Change to the Predictor directory and start the server
        os.chdir('Predictor')
        subprocess.run([sys.executable, 'connection.py'])
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")

def main():
    print("🎯 SegnoVivo Hand Gesture Recognition Backend")
    print("=" * 50)
    
    # Check dependencies
    check_dependencies()
    
    # Check model files
    if not check_model_files():
        return
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main() 