/**
 * Prompt Evaluation Configuration
 * Contains configuration constants and workflow definitions
 */

// API Configuration
const EVALUATION_API_CONFIG = {
    baseUrl: 'http://localhost:8000',
    endpoints: {
        workflowsList: '/api/v1/workflows/list',
        promptView: '/api/v1/prompts/view'
    }
};

// Sample workflow configurations with dynamic input fields
const WORKFLOW_CONFIGS = {
    bike_insights: {
        id: 'bike_insights',
        name: 'Bike Insights',
        description: 'Comprehensive analysis workflow for bicycle sharing data with predictive analytics and user behavior insights.',
        agents: [
            {
                agent_name: "customer_sentiment_agent",
                agent_display_name: "Customer Sentiment",
                agent_description: "Analyzes customer feedback and sentiment"
            },
            {
                agent_name: "fiscal_analysis_agent",
                agent_display_name: "Fiscal Analysis",
                agent_description: "Performs financial analysis and cost optimization"
            },
            {
                agent_name: "bike_lookup_agent",
                agent_display_name: "Bike Lookup Agent",
                agent_description: "Handles bike availability lookups"
            },
            {
                agent_name: "bike_summary_agent",
                agent_display_name: "Summary Agent",
                agent_description: "Generates comprehensive analysis summary"
            }
        ]
    },
    restaurant_recommender: {
        id: 'restaurant_recommender',
        name: 'Restaurant Recommender',
        description: 'Intelligent restaurant recommendation system based on user preferences and contextual factors.',
        agents: [
            {
                agent_name: "preference_analyzer",
                agent_display_name: "Preference Analyzer",
                agent_description: "Analyzes user preferences and requirements"
            },
            {
                agent_name: "location_finder",
                agent_display_name: "Location Finder",
                agent_description: "Finds restaurants in specified locations"
            },
            {
                agent_name: "rating_evaluator",
                agent_display_name: "Rating Evaluator",
                agent_description: "Evaluates restaurant ratings and reviews"
            },
            {
                agent_name: "recommendation_generator",
                agent_display_name: "Recommendation Generator",
                agent_description: "Generates final restaurant recommendations"
            }
        ]
    }
};

// Export for global access
window.EVALUATION_API_CONFIG = EVALUATION_API_CONFIG;
window.WORKFLOW_CONFIGS = WORKFLOW_CONFIGS;
