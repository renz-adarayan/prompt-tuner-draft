// Main application logic using Alpine.js

// API Configuration
const API_CONFIG = {
    baseUrl: 'http://localhost:8000', // Updated to localhost
    endpoints: {
        workflows: '/api/v1/workflows',
        workflowStatus: '/api/v1/workflow-status'
    }
};

// Alpine.js data for the main application
function workflowApp() {
    return {
        workflows: [], // Start with empty array
        loading: false,
        error: null,
        initialized: false, // Add flag to prevent multiple inits
        
        // Initialize the application
        async init() {
            if (this.initialized) {
                console.log('WorkflowApp already initialized, skipping...');
                return;
            }
            console.log('Initializing workflowApp...');
            this.initialized = true;
            await this.loadWorkflows();
        },
        
        // Load workflows from API
        async loadWorkflows() {
            console.log('Loading workflows from API...');
            try {
                this.loading = true;
                
                const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.workflows}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('API Response:', data); // Debug log
                
                // Handle the actual API response structure
                if (data.workflows && Array.isArray(data.workflows) && data.workflows.length > 0) {
                    // Filter out excluded workflows and map the API response to our expected format
                    const excludedWorkflows = ['classification_agent', 'knowledge_base_agent', 'sql_manipulation_agent'];
                    
                    this.workflows = data.workflows
                        .filter(workflow => !excludedWorkflows.includes(workflow.workflow)) // Exclude specified workflows
                        .map(workflow => ({
                            id: workflow.workflow,
                            name: this.formatWorkflowName(workflow.workflow),
                            description: workflow.description,
                            status: this.getWorkflowStatus(workflow),
                            agents: workflow.external_services || [],
                            category: workflow.category,
                            ready: workflow.ready,
                            configured: workflow.configured
                        }));
                    console.log('Successfully mapped workflows:', this.workflows.length, 'workflows (after exclusions)');
                } else {
                    // If no workflows from API, set empty array to show "not found" message
                    console.log('No workflows found in API response');
                    this.workflows = [];
                }
                
            } catch (error) {
                console.error('Error loading workflows:', error);
                // Don't use placeholder - just set empty array to show "not found" message
                this.workflows = [];
                console.log('Set empty workflows array due to API error');
            } finally {
                this.loading = false;
                console.log('Final workflows array:', this.workflows);
            }
        },
        
        // Format workflow name to be more readable
        formatWorkflowName(workflowId) {
            return DisplayUtils.formatWorkflowName(workflowId);
        },
        
        // Determine workflow status based on API response
        getWorkflowStatus(workflow) {
            if (!workflow.configured) return 'maintenance';
            if (!workflow.ready) return 'development';
            return 'ready';
        },
        
        // Get a single placeholder workflow when API fails or returns no data
        getPlaceholderWorkflow() {
            return [
                {
                    id: 'bike_insights',
                    name: 'Bike Insights',
                    description: 'Comprehensive analysis workflow for bicycle sharing data with predictive analytics and user behavior insights.',
                    status: 'ready',
                    agents: ['Azure OpenAI']
                },
                {
                    id: 'restaurant_recommender',
                    name: 'Restaurant Recommender',
                    description: 'Intelligent restaurant recommendation system using location, preferences, and real-time data for personalized suggestions.',
                    status: 'ready',
                    agents: ['Azure OpenAI']
                }
            ];
        },
        
        // Default workflows to show when API is not available (keeping for reference)
        getDefaultWorkflows() {
            return [
                {
                    id: 'prompt-optimization',
                    name: 'Prompt Optimization',
                    description: 'Workflow for testing and optimizing prompts across different scenarios to improve AI model performance.',
                    status: 'available',
                    agents: ['prompt_tester', 'performance_analyzer']
                },
                {
                    id: 'content-generation',
                    name: 'Content Generation',
                    description: 'Automated content creation workflow with quality assurance and style consistency checks.',
                    status: 'development',
                    agents: ['content_generator', 'quality_checker', 'style_validator']
                },
                {
                    id: 'data-analysis',
                    name: 'Data Analysis',
                    description: 'Comprehensive data analysis workflow with automated insights generation and visualization.',
                    status: 'available',
                    agents: ['data_processor', 'insight_generator', 'visualizer']
                }
            ];
        },
        
        // Navigate to workflow process page
        openWorkflow(workflowId) {
            console.log('openWorkflow called with ID:', workflowId);
            console.log('Available workflows:', this.workflows);
            
            // Find the workflow to check if it's maintenance
            const workflow = this.workflows.find(w => w.id === workflowId);
            console.log('Found workflow:', workflow);
            
            if (workflow && workflow.status === 'maintenance') {
                console.log('Workflow is under maintenance, not navigating');
                return; // Don't navigate if workflow is under maintenance
            }
            
            const targetUrl = `pages/workflow-process.html?id=${workflowId}`;
            console.log('Navigating to:', targetUrl);
            window.location.href = targetUrl;
        },
        
        // Navigate to prompt manager
        openPromptManager() {
            window.location.href = 'pages/manage-prompts.html';
        },
        
        // Navigate to evaluate page
        openEvaluate() {
            window.location.href = 'pages/prompt-evaluation.html';
        },
        
        // Get status badge class
        getStatusBadgeClass(status) {
            return DisplayUtils.getStatusBadgeClass(status);
        },

        // Format status text
        formatStatus(status) {
            return DisplayUtils.formatStatus(status);
        },
        
        // Retry loading workflows
        async retryLoad() {
            await this.loadWorkflows();
        }
    };
}

// Legacy utility functions for backward compatibility
// These now delegate to the new utility classes
const utils = {
    formatDate: (dateString, format = 'short') => DisplayUtils.formatDate(dateString, format),
    showToast: (message, type = 'info') => DisplayUtils.showToast(message, type),
    isValidUrl: (string) => ValidationUtils.isValidUrl(string)
};

// Export for use in HTML
window.workflowApp = workflowApp;
window.utils = utils;
