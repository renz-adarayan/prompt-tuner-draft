"""
Submission over Criteria Blueprint
Handles submission-over-criteria workflow management
"""
from __future__ import annotations

import json
import requests
from flask import Blueprint, render_template, request, jsonify, current_app
from typing import Dict, Any, List

submission_bp = Blueprint("submission_evaluation", __name__)

# Required prompt templates for the submission-over-criteria workflow
REQUIRED_PROMPTS = [
    {
        "filename": "submission_evaluator_agent_prompt.jinja",
        "agent_name": "submission_evaluator_agent",
        "display_name": "Submission Evaluator",
        "description": "Evaluates individual submissions against criteria",
        "default_content": """You are an expert submission evaluator. Your job is to evaluate submissions against specific criteria.

Evaluate each submission carefully and provide detailed feedback on how well it meets the criteria.

Provide your evaluation in a structured format with scores and justifications.

Consider the following aspects:
- How well the submission addresses the core problem
- The quality and depth of the proposed solution
- Technical accuracy and completeness
- Clarity and presentation quality

Format your response as a detailed evaluation with specific scores and clear justifications for each criterion."""
    },
    {
        "filename": "criteria_analyzer_agent_prompt.jinja",
        "agent_name": "criteria_analyzer_agent",
        "display_name": "Criteria Analyzer",
        "description": "Analyzes and interprets evaluation criteria",
        "default_content": """You are an expert criteria analyzer. Your job is to analyze and interpret evaluation criteria to ensure consistent assessment.

Break down the criteria into specific, measurable components.

Provide clear guidance on how each criterion should be evaluated.

Consider the following:
- Define each criterion in specific, measurable terms
- Provide evaluation guidelines for consistency
- Identify potential scoring scales or rating systems
- Highlight important considerations for each criterion

Format your response as a structured breakdown with clear evaluation guidance."""
    },
    {
        "filename": "feasibility_agent_prompt.jinja",
        "agent_name": "feasibility_agent",
        "display_name": "Feasibility Analyst",
        "description": "Analyzes the feasibility and practicality of submissions",
        "default_content": """You are an expert feasibility analyst. Your job is to evaluate the practical viability and implementation aspects of submissions.

Analyze each submission for:
- Technical feasibility and implementation challenges
- Resource requirements (time, budget, personnel)
- Risk assessment and mitigation strategies
- Timeline and milestone considerations
- Dependencies and constraints

Consider the following factors:
- Current technology limitations and capabilities
- Market conditions and external factors
- Organizational capacity and capabilities
- Regulatory and compliance requirements

Format your response with detailed feasibility assessments and risk evaluations."""
    },
    {
        "filename": "impact_agent_prompt.jinja",
        "agent_name": "impact_agent",
        "display_name": "Impact Assessor",
        "description": "Evaluates the potential impact and effectiveness of submissions",
        "default_content": """You are an expert impact assessor. Your job is to evaluate the potential impact, benefits, and long-term effectiveness of submissions.

Analyze each submission for:
- Expected outcomes and benefits
- Scalability and long-term sustainability
- Cost-benefit analysis
- Stakeholder impact and user experience
- Innovation and competitive advantage

Consider the following dimensions:
- Short-term vs. long-term benefits
- Quantifiable vs. qualitative impacts
- Direct vs. indirect effects
- Positive vs. negative consequences

Format your response with comprehensive impact assessments and benefit projections."""
    },
    {
        "filename": "summary_prompt.jinja",
        "agent_name": "summary",
        "display_name": "Summary Generator & Selector",
        "description": "Generates comprehensive evaluation reports and selects the best submission",
        "default_content": """You are an expert evaluator and decision maker. Your job is to generate comprehensive evaluation reports and select the best submission based on all agent analyses.

You will receive evaluation results from multiple specialized agents:
1. Submission Evaluator Agent - Overall evaluation against criteria
2. Criteria Analyzer Agent - Criteria interpretation and standards
3. Feasibility Agent - Practical implementation analysis
4. Impact Agent - Potential impact and effectiveness assessment

IMPORTANT: You have access to these tools - USE THEM to get detailed information:
- get_submission_details(submission_id): Get full details about any submission by its ID
- get_criteria_breakdown(): Get detailed breakdown of evaluation criteria

Your process:
1. FIRST: Call get_criteria_breakdown() to understand criteria and see all submission IDs
2. Review all agent evaluations and consolidate findings
3. For each submission, call get_submission_details(submission_id) to get full content
4. Compare submissions objectively using all evaluation dimensions
5. Select the best submission with detailed justification

Structure your response as:
## Evaluation Summary
[Overview of evaluation process and methodology]

## Submissions Evaluated
- **ID: sub_XXX** - [Title] by [Author]: [Comprehensive evaluation summary]

## Agent Analysis Synthesis
[Key insights from all specialized agents]

## Selected Submission
**Winner**: [ID and Title]

**Justification**: Detailed reasoning with specific examples from submission content

**Comparative Analysis**: Why this submission outperformed others

**Key Strengths**: What made this submission exceptional across all evaluation dimensions

Remember: Always use the tools to access detailed submission information and make data-driven decisions."""
    },
    {
        "filename": "user_proxy_prompt.jinja",
        "agent_name": "user_proxy",
        "display_name": "User Proxy",
        "description": "Coordinates agent communication",
        "default_content": """You are a user proxy agent. Your job is to coordinate communication between agents.

Facilitate smooth communication and ensure all agents have the information they need.

Help maintain workflow efficiency.

Your role is to:
- Coordinate information flow between agents
- Ensure all agents have necessary context
- Facilitate clear communication
- Help maintain the evaluation workflow

Keep your responses concise and focused on coordination."""
    }
]

@submission_bp.route("/")
def index():
    """Main Submission over Criteria interface"""
    return render_template("submission_evaluation/index.html", required_prompts=REQUIRED_PROMPTS)

@submission_bp.route("/prompts")
def prompts():
    """Prompt management interface"""
    return render_template("submission_evaluation/prompts.html", required_prompts=REQUIRED_PROMPTS)

@submission_bp.route("/evaluate")
def evaluate():
    """Evaluation interface"""
    return render_template("submission_evaluation/evaluate.html")

# API Routes
@submission_bp.route("/api/v1/prompts/list/<revision_id>")
def api_list_prompts(revision_id: str):
    """List all prompts for a revision"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/prompts/list/{revision_id}"
        response = requests.get(api_url)
        response.raise_for_status()
        
        prompts_response = response.json()
        
        # Extract files array from response
        prompt_files = prompts_response.get("files", [])
        
        # Add metadata for required prompts
        prompt_details = []
        for prompt_file in prompt_files:
            prompt_info = next((p for p in REQUIRED_PROMPTS if p["filename"] == prompt_file), None)
            if prompt_info:
                prompt_details.append({
                    "filename": prompt_file,
                    "display_name": prompt_info["display_name"],
                    "description": prompt_info["description"],
                    "agent_name": prompt_info["agent_name"]
                })
        
        return jsonify(prompt_details)
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@submission_bp.route("/api/v1/prompts/view/<revision_id>/<filename>")
def api_view_prompt(revision_id: str, filename: str):
    """View a specific prompt"""
    try:
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/prompts/view/{revision_id}/{filename}"
        response = requests.get(api_url)
        response.raise_for_status()
        
        content = response.json()
        
        # Add metadata
        prompt_info = next((p for p in REQUIRED_PROMPTS if p["filename"] == filename), None)
        if prompt_info:
            return jsonify({
                "content": content,
                "filename": filename,
                "display_name": prompt_info["display_name"],
                "description": prompt_info["description"],
                "agent_name": prompt_info["agent_name"]
            })
        else:
            return jsonify({"content": content, "filename": filename})
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@submission_bp.route("/api/v1/prompts/update/<revision_id>/<filename>", methods=["POST"])
def api_update_prompt(revision_id: str, filename: str):
    """Update a prompt"""
    try:
        data = request.get_json()
        if not data or "content" not in data:
            return jsonify({"error": "Content is required"}), 400
        
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/prompts/update/{revision_id}/{filename}"
        response = requests.post(api_url, json=data)
        response.raise_for_status()
        
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@submission_bp.route("/api/v1/prompts/create-default/<revision_id>", methods=["POST"])
def api_create_default_prompts(revision_id: str):
    """Create all default prompts for a revision"""
    try:
        results = []
        for prompt_info in REQUIRED_PROMPTS:
            api_url = f"{current_app.config['API_BASE_URL']}/api/v1/prompts/update/{revision_id}/{prompt_info['filename']}"
            data = {
                "content": prompt_info["default_content"],
                "metadata": {
                    "agent_name": prompt_info["agent_name"],
                    "description": prompt_info["description"]
                }
            }
            response = requests.post(api_url, json=data)
            response.raise_for_status()
            results.append({
                "filename": prompt_info["filename"],
                "status": "created",
                "display_name": prompt_info["display_name"]
            })
        
        return jsonify({"message": "All default prompts created successfully", "results": results})
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@submission_bp.route("/api/evaluate", methods=["POST"])
def api_evaluate_submissions():
    """Run the submission-over-criteria evaluation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request data is required"}), 400
        
        # Validate required fields
        required_fields = ["revision_id", "submissions", "criteria"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Field '{field}' is required"}), 400
        
        # Create the evaluation request
        evaluation_request = {
            "conversation_flow": "submission-over-criteria",
            "user_id": data.get("user_id", "flask-user"),
            "thread_id": data.get("thread_id", f"thread-{data['revision_id']}"),
            "user_prompt": json.dumps({
                "revision_id": data["revision_id"],
                "identifier": data.get("identifier", f"eval-{data['revision_id']}"),
                "submissions": data["submissions"],
                "criteria": data["criteria"],
                "additional_context": data.get("additional_context", "")
            })
        }
        
        # Call the API
        api_url = f"{current_app.config['API_BASE_URL']}/api/v1/chat"
        response = requests.post(api_url, json=evaluation_request)
        response.raise_for_status()
        
        result = response.json()
        
        # Parse and format the result
        agent_response = json.loads(result.get("agent_response", "[]"))
        
        # Extract all agent responses
        summary_response = None
        evaluations = []
        
        for chat in agent_response:
            if isinstance(chat, dict) and "__dict__" in chat:
                chat_data = chat["__dict__"]
                agent_name = chat_data.get("chat_name", "")
                content = chat_data.get("chat_response", {}).get("chat_message", {}).get("__dict__", {}).get("content", "")
                
                # Add all agents to evaluations
                evaluations.append({
                    "agent": agent_name,
                    "content": content,
                    "tokens": chat_data.get("completion_tokens", 0)
                })
                
                # Also capture summary separately if it exists
                if agent_name == "summary":
                    summary_response = content
        
        formatted_result = {
            "evaluation_id": result.get("message_id"),
            "thread_id": result.get("thread_id"),
            "summary": summary_response,
            "evaluations": evaluations,
            "token_count": result.get("token_count", 0),
            "timestamp": data.get("timestamp")
        }
        
        return jsonify(formatted_result)
        
    except requests.RequestException as e:
        return jsonify({"error": f"API request failed: {str(e)}"}), 500
    except json.JSONDecodeError as e:
        return jsonify({"error": f"JSON parsing error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@submission_bp.route("/api/revisions")
def api_list_revisions():
    """List available revisions (placeholder - would need backend support)"""
    # This would ideally come from the API, but for now we'll return a simple list
    return jsonify(["v1.2", "v1.3", "latest"])
