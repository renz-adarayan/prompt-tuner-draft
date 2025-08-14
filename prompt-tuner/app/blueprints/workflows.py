"""
Workflows Blueprint - Workflow management and status
"""
from __future__ import annotations

import requests
from flask import Blueprint, render_template, request, jsonify, current_app, abort

workflows_bp = Blueprint("workflows", __name__)

@workflows_bp.route("/")
def workflows_list():
    """List all available workflows"""
    return render_template("workflows/list.html")

@workflows_bp.route("/dynamic")
def dynamic_workflows():
    """Dynamic schema-driven workflows interface"""
    return render_template("workflows/dynamic.html")

@workflows_bp.route("/api/list")
def get_workflows():
    """Get list of workflows from API"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/workflows"
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500

@workflows_bp.route("/status/<workflow_name>")
def workflow_status(workflow_name: str):
    """Get status of a specific workflow"""
    return render_template("workflows/status.html", workflow_name=workflow_name)

@workflows_bp.route("/api/status/<workflow_name>")
def get_workflow_status(workflow_name: str):
    """Get workflow status from API"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/workflow-status/{workflow_name}"
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500
