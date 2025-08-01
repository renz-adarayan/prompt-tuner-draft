"""
Chat Blueprint - Chat interface and conversation management
"""
from __future__ import annotations

import json
import requests
from flask import Blueprint, render_template, request, jsonify, current_app, abort

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/")
def chat_interface():
    """Main chat interface page"""
    return render_template("chat/interface.html")

@chat_bp.route("/api/send", methods=["POST"])
def send_message():
    """Send a message to the API and return the response"""
    try:
        data = request.get_json()
        
        if not data or "message" not in data:
            abort(400, description="Message is required")
        
        user_message = data["message"]
        conversation_flow = data.get("conversation_flow", "")
        
        # Prepare the chat request
        chat_request = {
            "user_prompt": user_message,
            "conversation_flow": conversation_flow
        }
        
        # Make API call to the backend
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/chat"
        
        params = {}
        if conversation_flow:
            params["conversation_flow"] = conversation_flow
        
        response = requests.post(
            api_url,
            json=chat_request,
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500

@chat_bp.route("/api/feedback", methods=["POST"])
def send_feedback():
    """Send feedback for a message"""
    try:
        data = request.get_json()
        
        if not data or "message_id" not in data or "feedback" not in data:
            abort(400, description="Message ID and feedback are required")
        
        message_id = data["message_id"]
        feedback = data["feedback"]
        
        # Make API call to the backend
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/messages/{message_id}/feedback"
        
        response = requests.put(
            api_url,
            json={"feedback": feedback},
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

@chat_bp.route("/custom")
def custom_chat():
    """Custom chat sample interface"""
    return render_template("chat/custom.html")

@chat_bp.route("/api/custom", methods=["POST"])
def send_custom_message():
    """Send a custom message to the API"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/chat_custom_sample"
        
        response = requests.post(api_url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status {response.status_code}"}, response.status_code
            
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}, 500
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}, 500
