"""
Diagnostics Blueprint - System diagnostics and health checks
"""
from __future__ import annotations

import requests
from flask import Blueprint, render_template, request, jsonify, current_app

diagnostics_bp = Blueprint("diagnostics", __name__)

@diagnostics_bp.route("/")
def diagnostics_dashboard():
    """System diagnostics dashboard"""
    return render_template("diagnostics/dashboard.html")

@diagnostics_bp.route("/health")
def health_check():
    """Health check page"""
    return render_template("diagnostics/health.html")

@diagnostics_bp.route("/api/health")
def get_health_status():
    """Get health status from API"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/health"
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500

@diagnostics_bp.route("/api/diagnostic")
def get_diagnostic_info():
    """Get diagnostic information from API"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/diagnostic"
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500
