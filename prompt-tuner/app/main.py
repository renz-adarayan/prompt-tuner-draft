#!/usr/bin/env python3
"""
Main entry point for the Prompt Tuner application
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from . import create_app

def main():
    """Main entry point for the application"""
    app = create_app()
    
    print("🚀 Starting Prompt Tuner - Dynamic UI System")
    print("=" * 60)
    print("📍 Navigate to: http://localhost:5000")
    print("🔗 Dynamic Workflows: http://localhost:5000/workflows/dynamic")
    print("=" * 60)
    print("\n🧪 Test Features:")
    print("1. Select 'Bike Insights Analysis' workflow")
    print("2. Fill in the dynamic form (stores array)")
    print("3. Submit to see mock results with table rendering")
    print("4. Try 'Upload Custom Schema' with the provided schema.txt")
    print("5. Test different view modes (Auto, Table, Cards, JSON)")
    print("6. Export results in different formats")
    print("\n💡 The UI dynamically adapts to any JSON schema structure!")
    print("=" * 60)
    
    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main()
