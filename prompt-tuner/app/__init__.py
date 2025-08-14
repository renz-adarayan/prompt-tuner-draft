"""
Flask Application Factory
Creates and configures the Flask application with all blueprints
"""
from __future__ import annotations

import os
from flask import Flask, render_template
from flask_cors import CORS

def create_app() -> Flask:
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configure the application
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["API_BASE_URL"] = os.getenv("API_BASE_URL", "http://localhost:80")
    
    # Enable CORS for API calls
    CORS(app)
    
    # Register error handlers
    @app.errorhandler(404)
    def not_found(error):
        return render_template("errors/404.html"), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return render_template("errors/500.html"), 500
    
    # Register blueprints
    from .blueprints.main import main_bp
    from .blueprints.submission_evaluation import submission_bp
    from .blueprints.prompts import prompts_bp
    from .blueprints.workflows import workflows_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(submission_bp, url_prefix="/submission-evaluation")
    app.register_blueprint(prompts_bp, url_prefix="/prompts")
    app.register_blueprint(workflows_bp, url_prefix="/workflows")
    
    return app
