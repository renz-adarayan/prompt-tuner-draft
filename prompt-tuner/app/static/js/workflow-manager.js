/**
 * Workflow Manager
 * Manages workflow selection, schema loading, and dynamic UI coordination
 */

class WorkflowManager {
    constructor() {
        this.availableWorkflows = [];
        this.selectedWorkflow = null;
        this.workflowSchema = null;
        this.schemaParser = null;
        this.formGenerator = null;
        this.outputRenderer = null;
        this.currentRevision = 'latest';
        this.revisions = [];
    }

    /**
     * Initialize the workflow manager
     */
    async initialize() {
        try {
            await this.loadAvailableWorkflows();
            await this.loadRevisions();
            this.setupEventListeners();
            this.initializeUI();
        } catch (error) {
            console.error('Failed to initialize workflow manager:', error);
            Utils.showToast('Failed to initialize workflow manager', 'danger');
        }
    }

    /**
     * Load available workflows from API or configuration
     */
    async loadAvailableWorkflows() {
        try {
            // For now, we'll use a mock list of workflows
            // In a real implementation, this would come from an API
            this.availableWorkflows = [
                {
                    id: 'bike-insights',
                    name: 'Bike Insights Analysis',
                    description: 'Analyze bike sales data and generate insights',
                    version: '1.0.0',
                    schemaUrl: '/api/v1/workflows/bike-insights/schema'
                },
                {
                    id: 'submission-evaluation',
                    name: 'Submission Evaluation',
                    description: 'Evaluate submissions against criteria',
                    version: '1.2.0',
                    schemaUrl: '/api/v1/workflows/submission-evaluation/schema'
                },
                {
                    id: 'custom-workflow',
                    name: 'Custom Workflow',
                    description: 'Load custom workflow schema',
                    version: 'dynamic',
                    schemaUrl: null
                }
            ];

            // Try to load from API if available
            try {
                const response = await Utils.apiRequest('/api/v1/workflows');
                if (response && Array.isArray(response)) {
                    this.availableWorkflows = response;
                }
            } catch (apiError) {
                console.log('API workflows not available, using defaults');
            }

        } catch (error) {
            console.error('Error loading workflows:', error);
            throw error;
        }
    }

    /**
     * Load available revisions
     */
    async loadRevisions() {
        try {
            const response = await Utils.apiRequest('/submission-evaluation/api/revisions');
            if (response && Array.isArray(response)) {
                this.revisions = response;
            } else {
                this.revisions = ['v1.2', 'v1.3', 'latest'];
            }
        } catch (error) {
            console.log('Using default revisions');
            this.revisions = ['v1.2', 'v1.3', 'latest'];
        }
    }

    /**
     * Select and load a workflow
     */
    async selectWorkflow(workflowId, options = {}) {
        try {
            LoadingManager.show('#workflow-content');

            const workflow = this.availableWorkflows.find(w => w.id === workflowId);
            if (!workflow) {
                throw new Error(`Workflow '${workflowId}' not found`);
            }

            this.selectedWorkflow = workflow;

            // Load schema
            if (workflow.id === 'custom-workflow') {
                await this.loadCustomSchema(options.customSchema);
            } else {
                await this.loadWorkflowSchema(workflow);
            }

            // Initialize components
            this.initializeComponents();

            // Update UI
            this.updateWorkflowUI();

            Utils.showToast(`Loaded workflow: ${workflow.name}`, 'success');

        } catch (error) {
            console.error('Error selecting workflow:', error);
            Utils.showToast(`Failed to load workflow: ${error.message}`, 'danger');
        } finally {
            LoadingManager.hide('#workflow-content');
        }
    }

    /**
     * Load workflow schema
     */
    async loadWorkflowSchema(workflow) {
        if (workflow.schemaUrl) {
            try {
                const schema = await Utils.apiRequest(workflow.schemaUrl);
                this.workflowSchema = schema;
            } catch (error) {
                console.log('Failed to load schema from API, using fallback');
                this.workflowSchema = this.getFallbackSchema(workflow.id);
            }
        } else {
            this.workflowSchema = this.getFallbackSchema(workflow.id);
        }
    }

    /**
     * Load custom schema from user input
     */
    async loadCustomSchema(schemaData) {
        if (typeof schemaData === 'string') {
            try {
                this.workflowSchema = JSON.parse(schemaData);
            } catch (error) {
                throw new Error('Invalid JSON schema format');
            }
        } else if (typeof schemaData === 'object') {
            this.workflowSchema = schemaData;
        } else {
            throw new Error('Schema data must be a JSON string or object');
        }
    }

    /**
     * Get fallback schema for known workflows
     */
    getFallbackSchema(workflowId) {
        const fallbackSchemas = {
            'bike-insights': this.getBikeInsightsSchema(),
            'submission-evaluation': this.getSubmissionEvaluationSchema()
        };

        return fallbackSchemas[workflowId] || this.getDefaultSchema();
    }

    /**
     * Get bike insights schema (from the provided schema.txt)
     */
    getBikeInsightsSchema() {
        return {
            "definitions": {
                "RootModel": {
                    "type": "object",
                    "properties": {
                        "stores": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/RootModel_Store"
                            },
                            "description": "List of bike stores"
                        }
                    },
                    "required": ["stores"]
                },
                "RootModel_Store": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Store name"
                        },
                        "location": {
                            "type": "string",
                            "description": "Store location"
                        },
                        "bike_sales": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/RootModel_BikeSale"
                            }
                        },
                        "bike_stock": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/RootModel_BikeStock"
                            }
                        }
                    },
                    "required": ["name", "location", "bike_sales", "bike_stock"]
                },
                "RootModel_BikeSale": {
                    "type": "object",
                    "properties": {
                        "product_code": {
                            "type": "string"
                        },
                        "quantity_sold": {
                            "type": "integer",
                            "minimum": 0
                        },
                        "sale_date": {
                            "type": "string",
                            "format": "date"
                        },
                        "year": {
                            "type": "integer"
                        },
                        "month": {
                            "type": "string"
                        },
                        "customer_review": {
                            "$ref": "#/definitions/RootModel_CustomerReview"
                        }
                    },
                    "required": ["product_code", "quantity_sold", "sale_date", "year", "month", "customer_review"]
                },
                "RootModel_CustomerReview": {
                    "type": "object",
                    "properties": {
                        "rating": {
                            "type": "number",
                            "minimum": 0,
                            "maximum": 5
                        },
                        "comment": {
                            "type": "string"
                        }
                    },
                    "required": ["rating", "comment"]
                },
                "RootModel_BikeStock": {
                    "type": "object",
                    "properties": {
                        "bike": {
                            "anyOf": [
                                {"$ref": "#/definitions/RootModel_MountainBike"},
                                {"$ref": "#/definitions/RootModel_RoadBike"},
                                {"$ref": "#/definitions/RootModel_ElectricBike"}
                            ]
                        },
                        "quantity": {
                            "type": "integer",
                            "minimum": 0
                        }
                    },
                    "required": ["bike", "quantity"]
                },
                "RootModel_MountainBike": {
                    "type": "object",
                    "properties": {
                        "brand": {"type": "string"},
                        "model": {"type": "string"},
                        "year": {"type": "integer"},
                        "price": {"type": "number"},
                        "suspension": {
                            "type": "string",
                            "description": "Type of suspension (e.g., full, hardtail)"
                        }
                    },
                    "required": ["brand", "model", "year", "price", "suspension"]
                },
                "RootModel_RoadBike": {
                    "type": "object",
                    "properties": {
                        "brand": {"type": "string"},
                        "model": {"type": "string"},
                        "year": {"type": "integer"},
                        "price": {"type": "number"},
                        "frame_material": {
                            "type": "string",
                            "description": "Material of the frame (e.g., carbon, aluminum)"
                        }
                    },
                    "required": ["brand", "model", "year", "price", "frame_material"]
                },
                "RootModel_ElectricBike": {
                    "type": "object",
                    "properties": {
                        "brand": {"type": "string"},
                        "model": {"type": "string"},
                        "year": {"type": "integer"},
                        "price": {"type": "number"},
                        "battery_capacity": {
                            "type": "number",
                            "description": "Battery capacity in kWh"
                        },
                        "motor_power": {
                            "type": "number",
                            "description": "Motor power in watts"
                        }
                    },
                    "required": ["brand", "model", "year", "price", "battery_capacity", "motor_power"]
                }
            }
        };
    }

    /**
     * Get submission evaluation schema
     */
    getSubmissionEvaluationSchema() {
        return {
            "definitions": {
                "RootModel": {
                    "type": "object",
                    "properties": {
                        "submissions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "title": {"type": "string"},
                                    "content": {"type": "string"},
                                    "author": {"type": "string"}
                                },
                                "required": ["id", "title", "content"]
                            },
                            "description": "List of submissions to evaluate"
                        },
                        "criteria": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "description": {"type": "string"},
                                    "weight": {"type": "number", "minimum": 0, "maximum": 1}
                                },
                                "required": ["name", "description"]
                            },
                            "description": "Evaluation criteria"
                        },
                        "additional_context": {
                            "type": "string",
                            "description": "Additional context for evaluation"
                        }
                    },
                    "required": ["submissions", "criteria"]
                }
            }
        };
    }

    /**
     * Get default schema for unknown workflows
     */
    getDefaultSchema() {
        return {
            "definitions": {
                "RootModel": {
                    "type": "object",
                    "properties": {
                        "input": {
                            "type": "string",
                            "description": "Input data"
                        }
                    },
                    "required": ["input"]
                }
            }
        };
    }

    /**
     * Initialize schema parser and UI components
     */
    initializeComponents() {
        if (!this.workflowSchema) {
            throw new Error('No schema loaded');
        }

        this.schemaParser = new SchemaParser(this.workflowSchema);
        this.formGenerator = new FormGenerator(this.schemaParser);
        this.outputRenderer = new OutputRenderer(this.schemaParser);
    }

    /**
     * Update the workflow UI
     */
    updateWorkflowUI() {
        // Update workflow info display
        this.updateWorkflowInfo();

        // Generate dynamic form
        this.generateInputForm();

        // Setup output area
        this.setupOutputArea();

        // Update navigation
        this.updateNavigation();
    }

    /**
     * Update workflow information display
     */
    updateWorkflowInfo() {
        const infoContainer = document.getElementById('workflow-info');
        if (infoContainer && this.selectedWorkflow) {
            infoContainer.innerHTML = `
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title mb-1">${this.selectedWorkflow.name}</h5>
                                <p class="card-text text-muted mb-2">${this.selectedWorkflow.description}</p>
                                <small class="text-muted">Version: ${this.selectedWorkflow.version}</small>
                            </div>
                            <div class="text-end">
                                <div class="mb-2">
                                    <label for="revision-select" class="form-label small">Revision:</label>
                                    <select id="revision-select" class="form-select form-select-sm" onchange="workflowManager.changeRevision(this.value)">
                                        ${this.revisions.map(rev => 
                                            `<option value="${rev}" ${rev === this.currentRevision ? 'selected' : ''}>${rev}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <button class="btn btn-outline-secondary btn-sm" onclick="workflowManager.showSchemaPreview()">
                                    <i class="bi bi-eye"></i> View Schema
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Generate dynamic input form
     */
    generateInputForm() {
        const formContainer = document.getElementById('dynamic-form-container');
        if (formContainer && this.formGenerator) {
            this.formGenerator.generateForm('dynamic-form-container', {
                formId: 'workflow-input-form',
                submitText: 'Process Workflow',
                showSubmit: true
            });

            // Add form submission handler
            const form = document.getElementById('workflow-input-form');
            if (form) {
                form.addEventListener('dynamicFormSubmit', (event) => {
                    this.handleWorkflowSubmission(event.detail.data);
                });
            }
        }
    }

    /**
     * Setup output area
     */
    setupOutputArea() {
        const outputContainer = document.getElementById('workflow-output');
        if (outputContainer) {
            outputContainer.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Workflow Results</h6>
                    </div>
                    <div class="card-body">
                        <div class="text-center text-muted py-4">
                            <i class="bi bi-play-circle fs-1"></i>
                            <p class="mt-2">Submit the form above to see results</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Update navigation to reflect current workflow
     */
    updateNavigation() {
        // Update page title
        if (this.selectedWorkflow) {
            document.title = `${this.selectedWorkflow.name} - Prompt Tuner`;
        }

        // Update breadcrumb or active nav items if needed
        const navItems = document.querySelectorAll('.nav-link');
        navItems.forEach(item => {
            item.classList.remove('active');
        });
    }

    /**
     * Handle workflow form submission
     */
    async handleWorkflowSubmission(formData) {
        try {
            LoadingManager.show('#workflow-output');

            // Process the workflow
            const result = await this.processWorkflow(formData);

            // Display results
            this.displayResults(result);

            Utils.showToast('Workflow processed successfully', 'success');

        } catch (error) {
            console.error('Workflow processing error:', error);
            Utils.showToast(`Workflow processing failed: ${error.message}`, 'danger');
        } finally {
            LoadingManager.hide('#workflow-output');
        }
    }

    /**
     * Process workflow with given data
     */
    async processWorkflow(formData) {
        if (!this.selectedWorkflow) {
            throw new Error('No workflow selected');
        }

        // For bike-insights workflow, simulate processing
        if (this.selectedWorkflow.id === 'bike-insights') {
            return this.processBikeInsights(formData);
        }

        // For submission evaluation, use existing API
        if (this.selectedWorkflow.id === 'submission-evaluation') {
            return this.processSubmissionEvaluation(formData);
        }

        // For custom workflows, try to call a generic API
        return this.processCustomWorkflow(formData);
    }

    /**
     * Process bike insights workflow
     */
    async processBikeInsights(formData) {
        // Simulate processing bike data
        const mockResult = this.generateMockBikeResults(formData);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return mockResult;
    }

    /**
     * Generate mock bike insights results
     */
    generateMockBikeResults(formData) {
        const salesData = "## Sales Analysis\n\n| Store | Location | Total Sales | Top Product | Revenue |\n|-------|----------|-------------|-------------|----------|\n| BikeWorld | Downtown | 150 | Mountain Pro | $45,000 |\n| CycleHub | Suburbs | 120 | Road Racer | $38,000 |\n| ElectricRide | Mall | 90 | E-Bike Max | $52,000 |\n\n## Key Insights\n\n- Electric bikes show highest revenue per unit\n- Mountain bikes have highest volume sales\n- Downtown location performs best overall";
        
        return {
            summary: "Bike sales analysis completed successfully",
            display_bike_sales_as_table: salesData,
            total_stores: formData.stores ? formData.stores.length : 3,
            processing_time: "1.2 seconds"
        };
    }

    /**
     * Process submission evaluation workflow
     */
    async processSubmissionEvaluation(formData) {
        const requestData = {
            revision_id: this.currentRevision,
            submissions: formData.submissions || [],
            criteria: formData.criteria || [],
            additional_context: formData.additional_context || '',
            timestamp: new Date().toISOString()
        };

        const response = await Utils.apiRequest('/submission-evaluation/api/evaluate', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        return response;
    }

    /**
     * Process custom workflow
     */
    async processCustomWorkflow(formData) {
        // Try to call a generic workflow API
        try {
            const response = await Utils.apiRequest(`/api/v1/workflows/${this.selectedWorkflow.id}/process`, {
                method: 'POST',
                body: JSON.stringify({
                    data: formData,
                    revision: this.currentRevision
                })
            });
            return response;
        } catch (error) {
            // If no API available, return the input data as mock result
            return {
                message: "Custom workflow processed (mock)",
                input_data: formData,
                processed_at: new Date().toISOString()
            };
        }
    }

    /**
     * Display workflow results
     */
    displayResults(result) {
        const outputContainer = document.getElementById('workflow-output');
        if (outputContainer && this.outputRenderer) {
            this.outputRenderer.renderOutput('workflow-output', result, {
                title: 'Workflow Results',
                showControls: true
            });

            // Store original data for view mode changes
            const outputElement = outputContainer.querySelector('.output-container');
            if (outputElement) {
                outputElement.originalData = result;
            }
        }
    }

    /**
     * Change revision
     */
    async changeRevision(newRevision) {
        if (newRevision !== this.currentRevision) {
            this.currentRevision = newRevision;
            Utils.showToast(`Switched to revision: ${newRevision}`, 'info');
            
            // Reload prompts or schema if needed
            if (this.selectedWorkflow) {
                await this.loadWorkflowSchema(this.selectedWorkflow);
                this.initializeComponents();
                this.generateInputForm();
            }
        }
    }

    /**
     * Show schema preview modal
     */
    showSchemaPreview() {
        if (!this.workflowSchema) return;

        const modalHtml = `
            <div class="modal fade" id="schemaPreviewModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Schema Preview</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <pre class="bg-light p-3 rounded" style="max-height: 400px; overflow-y: auto;"><code>${Utils.escapeHtml(JSON.stringify(this.workflowSchema, null, 2))}</code></pre>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-primary" onclick="Utils.copyToClipboard('${Utils.escapeHtml(JSON.stringify(this.workflowSchema))}')">
                                <i class="bi bi-clipboard"></i> Copy Schema
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('schemaPreviewModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('schemaPreviewModal'));
        modal.show();

        // Clean up when modal is hidden
        document.getElementById('schemaPreviewModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for workflow selection events
        document.addEventListener('workflowSelected', (event) => {
            this.selectWorkflow(event.detail.workflowId, event.detail.options);
        });

        // Listen for custom schema uploads
        document.addEventListener('customSchemaUploaded', (event) => {
            this.selectWorkflow('custom-workflow', { customSchema: event.detail.schema });
        });
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Create workflow selector if it doesn't exist
        this.createWorkflowSelector();
    }

    /**
     * Create workflow selector UI
     */
    createWorkflowSelector() {
        const selectorContainer = document.getElementById('workflow-selector');
        if (selectorContainer) {
            let html = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h5>Select Workflow</h5>
                        <div class="row">
            `;

            for (const workflow of this.availableWorkflows) {
                html += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 workflow-card" onclick="workflowManager.selectWorkflow('${workflow.id}')" style="cursor: pointer;">
                            <div class="card-body">
                                <h6 class="card-title">${workflow.name}</h6>
                                <p class="card-text small text-muted">${workflow.description}</p>
                                <small class="text-muted">v${workflow.version}</small>
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;

            selectorContainer.innerHTML = html;
        }
    }

    /**
     * Get current workflow state
     */
    getCurrentState() {
        return {
            selectedWorkflow: this.selectedWorkflow,
            currentRevision: this.currentRevision,
            schema: this.workflowSchema,
            formData: this.formGenerator ? this.formGenerator.getFormData() : null
        };
    }
}

// Create global instance
window.workflowManager = new WorkflowManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.workflowManager) {
        window.workflowManager.initialize();
    }
});

// Export for use in other modules
window.WorkflowManager = WorkflowManager;
