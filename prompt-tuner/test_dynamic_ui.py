#!/usr/bin/env python3
"""
Test script to demonstrate the dynamic UI system
Run this to start the Flask development server and test the dynamic workflows
"""

import os
import sys
from pathlib import Path

def main():
    """Run the Flask development server"""
    # Change to the prompt-tuner directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Add the current directory to Python path for imports
    sys.path.insert(0, str(script_dir))
    
    try:
        from app import create_app
        app = create_app()
        
        print("🚀 Starting Dynamic UI Test Server")
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
        print("\n⚠️  If you see import errors, run: uv sync")
        print("=" * 60)
        
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("\n🔧 To fix this, run the following commands:")
        print("   cd prompt-tuner")
        print("   uv sync")
        print("   uv run python test_dynamic_ui.py")
        print("\nOr install dependencies manually:")
        print("   pip install flask flask-cors requests")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main()
