"""
Prompts Blueprint - Prompt management and editing
"""
from __future__ import annotations

import requests
from flask import Blueprint, render_template, request, jsonify, current_app, abort

prompts_bp = Blueprint("prompts", __name__)

@prompts_bp.route("/")
def prompts_list():
    """List all prompts"""
    return render_template("prompts/list.html")

@prompts_bp.route("/<revision_id>")
def prompts_revision(revision_id: str):
    """View prompts for a specific revision"""
    return render_template("prompts/revision.html", revision_id=revision_id)

@prompts_bp.route("/api/list/<revision_id>")
def get_prompts_list(revision_id: str):
    """Get list of prompts for a revision from API"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/prompts/list/{revision_id}"
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500

@prompts_bp.route("/view/<revision_id>/<filename>")
def view_prompt(revision_id: str, filename: str):
    """View a specific prompt file"""
    return render_template("prompts/view.html", revision_id=revision_id, filename=filename)

@prompts_bp.route("/api/view/<revision_id>/<filename>")
def get_prompt_content(revision_id: str, filename: str):
    """Get prompt content from API"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/prompts/view/{revision_id}/{filename}"
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500

@prompts_bp.route("/edit/<revision_id>/<filename>")
def edit_prompt(revision_id: str, filename: str):
    """Edit a specific prompt file"""
    return render_template("prompts/edit.html", revision_id=revision_id, filename=filename)

@prompts_bp.route("/api/update/<revision_id>/<filename>", methods=["POST"])
def update_prompt(revision_id: str, filename: str):
    """Update prompt content via API"""
    try:
        data = request.get_json()
        
        if not data:
            abort(400, description="Request body is required")
        
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/prompts/update/{revision_id}/{filename}"
        
        response = requests.post(
            api_url,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500
