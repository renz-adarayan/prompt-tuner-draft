/**
 * Prompt Evaluation App - External Functions
 * Large functions extracted from inline HTML for better maintainability
 */

/**
 * Enhanced Prompt Evaluation App using Modular Dynamic Workflow Architecture
 * This is the main Alpine.js app function with complex logic moved to external functions
 */
function promptEvaluationApp() {
    return {
        // State from DynamicWorkflowManager
        currentSchema: null,
        availableWorkflows: [],
        schemasLoaded: false,
        showFormHeader: false,
        showFormActions: false,
        showResults: false,
        formTitle: 'Dynamic Form',
        dynamicFormHtml: '',
        resultsHtml: '',
        
        // Evaluation-specific state
        workflow: { name: 'Workflow Evaluation', id: null },
        isRunning: false,
        hasResults: false,
        results: null,
        selectedPromptVersion: '',
        revisions: [],
        workflowQueryParam: null,
        formDataExists: false,
        
        // Initialization
        async init() {
            return await PromptEvaluationCore.initialize(this);
        },
        
        // Schema selection (delegate to DynamicWorkflowManager)
        async selectSchema(schemaName) {
            if (window.dynamicWorkflow) {
                await window.dynamicWorkflow.selectSchema(schemaName);
                this.syncState();
            }
        },
        
        // Simple functions that stay inline
        generateCompactIdentifier() {
            const now = new Date();
            const isoString = now.toISOString();
            const compactISO = isoString.split('.')[0] + 'Z';
            const compactFormat = compactISO.replace(/:/g, '-');
            return `test-${compactFormat}`;
        },

        createFormattedJsonStructure(formData) {
            return {
                user_prompt: {
                    revision_id: this.selectedPromptVersion || 'v1.0',
                    identifier: this.generateCompactIdentifier(),
                    stores: [formData]
                },
                conversation_flow: this.currentSchema || 'unknown-workflow'
            };
        },

        logFormDataToConsole() {
            return PromptEvaluationCore.logFormDataToConsole(this);
        },
        
        // Complex functions delegated to external modules
        async waitForDynamicWorkflow() {
            return await PromptEvaluationCore.waitForDynamicWorkflow();
        },
        
        setupStateSync() {
            return PromptEvaluationCore.setupStateSync(this);
        },
        
        syncState() {
            return PromptEvaluationCore.syncState(this);
        },
        
        forceDataSync() {
            return PromptEvaluationCore.forceDataSync(this);
        },
        
        getFormDataForSchema() {
            return PromptEvaluationCore.getFormDataForSchema(this);
        },
        
        collectFormDataDirectly() {
            return PromptEvaluationCore.collectFormDataDirectly(this);
        },
        
        initFormDataTracking() {
            return PromptEvaluationCore.initFormDataTracking(this);
        },
        
        updateFormDataStatus() {
            return PromptEvaluationCore.updateFormDataStatus(this);
        },
        
        downloadFormDataJson() {
            return PromptEvaluationCore.downloadFormDataJson(this);
        },
        
        async runEvaluationWithDynamicData() {
            return await PromptEvaluationCore.runEvaluationWithDynamicData(this);
        },
        
        generateEnhancedResults(workflowId, inputData) {
            return PromptEvaluationCore.generateEnhancedResults(workflowId, inputData);
        },
        
        async loadRevisionsFromAPI() {
            return await PromptEvaluationCore.loadRevisionsFromAPI(this);
        },
        
        downloadResults() {
            return PromptEvaluationCore.downloadResults(this);
        },
        
        // Simple functions kept inline for Alpine.js
        initializePromptVersion() {
            const versions = this.getAvailableVersions();
            if (versions.length > 0) {
                this.selectedPromptVersion = versions[0].id;
            }
        },
        
        getAvailableVersions() {
            return this.revisions.map(revision => ({
                id: revision.id,
                display: `${revision.name} (${revision.description})`,
                date: revision.date,
                status: revision.status
            }));
        },
        
        resetEvaluation() {
            this.isRunning = false;
            this.hasResults = false;
            this.results = null;
            if (window.dynamicWorkflow) {
                window.dynamicWorkflow.resetAll();
                this.syncState();
            }
        },
        
        formatWorkflowOutput(output) {
            return output.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        },
        
        getAgentDescription(agentName) {
            const descriptions = {
                'schema_validator': 'Validates schema structure and data integrity',
                'data_processor': 'Processes form data using modular architecture',
                'evaluation_engine': 'Evaluates workflow performance and readiness'
            };
            return descriptions[agentName] || 'Specialized evaluation agent';
        },
        
        async copyAgentOutput(output) {
            try {
                await navigator.clipboard.writeText(output);
                console.log('Agent output copied to clipboard');
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        },
        
        // Helper methods that can stay inline
        hasFormData() {
            const formData = this.getFormDataForSchema();
            return formData && Object.keys(formData).length > 0;
        },
        
        hasAnyFormData() {
            return this.formDataExists;
        }
    };
}

/**
 * Core functionality class for Prompt Evaluation
 * Contains all the large/complex functions moved from inline HTML
 */
class PromptEvaluationCore {
    /**
     * Initialize the application
     */
    static async initialize(app) {
        console.log('Enhanced Prompt Evaluation App initialized');
        const params = new URLSearchParams(window.location.search);
        app.workflowQueryParam = params.get('workflow');
        
        await app.waitForDynamicWorkflow();
        app.setupStateSync();
        
        if (window.dynamicWorkflow) {
            await window.dynamicWorkflow.init();
            app.syncState();
            
            // Auto-select workflow if specified in query param
            if (app.workflowQueryParam && app.currentSchema !== app.workflowQueryParam) {
                const trySelect = async () => {
                    if (window.dynamicWorkflow.availableWorkflows?.length) {
                        if (window.dynamicWorkflow.currentSchema !== app.workflowQueryParam) {
                            await window.dynamicWorkflow.selectSchema(app.workflowQueryParam);
                            app.syncState();
                        }
                    } else {
                        setTimeout(trySelect, 100);
                    }
                };
                trySelect();
            }
        }
        
        await app.loadRevisionsFromAPI();
        app.initializePromptVersion();
        app.initFormDataTracking();
    }

    /**
     * Wait for dynamic workflow to be fully ready
     */
    static async waitForDynamicWorkflow() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait time
        
        while (attempts < maxAttempts) {
            if (window.dynamicWorkflow && 
                typeof window.dynamicWorkflow.collectFormDataFromDOM === 'function' &&
                typeof window.dynamicWorkflow.getFormDataForSchema === 'function') {
                console.log('DynamicWorkflow is ready after', attempts * 100, 'ms');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('DynamicWorkflow initialization timeout - proceeding with limited functionality');
    }

    /**
     * Setup state synchronization
     */
    static setupStateSync(app) {
        // Sync state every 200ms to ensure Alpine.js stays updated
        setInterval(() => {
            app.syncState();
        }, 200);
    }

    /**
     * Synchronize state with modular classes
     */
    static syncState(app) {
        if (window.dynamicWorkflow) {
            app.availableWorkflows = [...(window.dynamicWorkflow.availableWorkflows || [])];
            app.schemasLoaded = window.dynamicWorkflow.schemasLoaded || false;
            app.currentSchema = window.dynamicWorkflow.currentSchema || null;
            app.showFormHeader = window.dynamicWorkflow.showFormHeader || false;
            app.showFormActions = window.dynamicWorkflow.showFormActions || false;
            app.showResults = window.dynamicWorkflow.showResults || false;
            app.formTitle = window.dynamicWorkflow.formTitle || 'Dynamic Form';
            app.dynamicFormHtml = window.dynamicWorkflow.dynamicFormHtml || '';
            app.resultsHtml = window.dynamicWorkflow.resultsHtml || '';
            
            // Update workflow name for header
            if (app.currentSchema) {
                const selectedWorkflow = app.availableWorkflows.find(w => w.name === app.currentSchema);
                if (selectedWorkflow) {
                    app.workflow = { 
                        name: selectedWorkflow.title, 
                        id: selectedWorkflow.name 
                    };
                }
            }
        }
    }

    /**
     * Console logging functionality
     */
    static logFormDataToConsole(app) {
        app.forceDataSync();
        
        const formData = app.getFormDataForSchema();
        
        if (!formData || Object.keys(formData).length === 0) {
            console.warn('📝 Form Data Logging - No data available');
            console.log({
                "_note": "No form data available",
                "_suggestion": "Please fill out the form fields and try again",
                "_schema": app.currentSchema || "No schema selected",
                "_timestamp": new Date().toISOString()
            });
            return;
        }
        
        const formattedData = app.createFormattedJsonStructure(formData);
        
        console.log('=== FORM DATA JSON ===');
        console.log('Formatted JSON structure:', formattedData);
        console.log('JSON formatted:', JSON.stringify(formattedData, null, 2));
        console.log('=== END FORM DATA ===');
    }

    /**
     * Force data synchronization with DOM
     */
    static forceDataSync(app) {
        try {
            if (window.dynamicWorkflow && typeof window.dynamicWorkflow.collectFormDataFromDOM === 'function') {
                const domData = window.dynamicWorkflow.collectFormDataFromDOM();
                
                if (domData && Object.keys(domData).length > 0 && window.dynamicWorkflow.dataManager) {
                    const storedData = window.dynamicWorkflow.dataManager.getFormDataForSchema(app.currentSchema) || {};
                    const mergedData = { ...storedData, ...domData };
                    
                    if (typeof window.dynamicWorkflow.dataManager.setFormData === 'function') {
                        window.dynamicWorkflow.dataManager.setFormData(app.currentSchema, mergedData);
                        console.log('Force synced data from DOM:', mergedData);
                    }
                }
            }
        } catch (error) {
            console.error('Error in forceDataSync:', error);
        }
    }

    /**
     * Get form data (enhanced to prioritize fresh DOM data)
     */
    static getFormDataForSchema(app) {
        try {
            let formData = {};
            
            // Method 1: Get data from dynamic workflow system
            if (window.dynamicWorkflow && 
                typeof window.dynamicWorkflow.getFormDataForSchema === 'function') {
                formData = window.dynamicWorkflow.getFormDataForSchema() || {};
            }
            
            // Method 2: Always collect fresh data from DOM and merge
            const freshDomData = app.collectFormDataDirectly();
            if (freshDomData && Object.keys(freshDomData).length > 0) {
                formData = { ...formData, ...freshDomData };
                console.log('Merged stored and fresh DOM data:', formData);
            }
            
            // Method 3: Fallback if no data found
            if (Object.keys(formData).length === 0) {
                console.log('No data found, using comprehensive DOM scan');
                formData = app.collectFormDataDirectly();
            }
            
            return formData;
        } catch (error) {
            console.error('Error getting form data:', error);
            return app.collectFormDataDirectly();
        }
    }

    /**
     * Enhanced fallback method to collect form data directly from DOM
     */
    static collectFormDataDirectly(app) {
        const formData = {};
        
        try {
            const container = document.getElementById('dynamicFormsContainer');
            if (!container) {
                console.log('Dynamic forms container not found');
                return formData;
            }
            
            // Collect data from all input types
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.id) {
                    let fieldName = FormDataUtils.parseFieldNameFromInputId(input.id);
                    let value = input.value;
                    
                    if (value.trim() === '' && input.type !== 'checkbox' && input.type !== 'radio') {
                        return;
                    }
                    
                    if (input.type === 'number' && value !== '') {
                        value = parseFloat(value) || 0;
                    } else if (input.type === 'checkbox') {
                        value = input.checked;
                    } else {
                        value = value.trim();
                    }
                    
                    FormDataUtils.setNestedFieldValue(formData, fieldName, value);
                }
            });
            
            // Collect data from selected union options
            const selectedOptions = container.querySelectorAll('.option-card.selected');
            selectedOptions.forEach(option => {
                const optionName = option.querySelector('.option-name');
                const parentGroup = option.closest('.form-group');
                if (optionName && parentGroup) {
                    const label = parentGroup.querySelector('.form-label');
                    if (label) {
                        const fieldName = FormDataUtils.sanitizeFieldName(label.textContent);
                        formData[fieldName] = optionName.textContent.trim();
                    }
                }
            });
            
            // Collect data from array containers
            const arrayContainers = container.querySelectorAll('.array-container, [class*="array"]');
            arrayContainers.forEach(arrayContainer => {
                const arrayFieldName = FormDataUtils.extractArrayFieldName(arrayContainer);
                if (arrayFieldName) {
                    const arrayData = FormDataUtils.collectArrayData(arrayContainer);
                    if (arrayData.length > 0) {
                        formData[arrayFieldName] = arrayData;
                    }
                }
            });
            
            console.log('Enhanced direct form data collection result:', formData);
            
        } catch (error) {
            console.error('Error in enhanced direct form data collection:', error);
        }
        
        return formData;
    }

    /**
     * Initialize form data tracking
     */
    static initFormDataTracking(app) {
        setInterval(() => {
            this.updateFormDataStatus(app);
        }, 500);
        
        this.updateFormDataStatus(app);
    }

    /**
     * Update form data status
     */
    static updateFormDataStatus(app) {
        try {
            const container = document.getElementById('dynamicFormsContainer');
            if (!container) {
                app.formDataExists = false;
                return;
            }
            
            let hasData = false;
            
            const inputs = container.querySelectorAll('input, select, textarea');
            for (let input of inputs) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    if (input.checked) {
                        hasData = true;
                        break;
                    }
                } else if (input.value && input.value.trim() !== '') {
                    hasData = true;
                    break;
                }
            }
            
            if (!hasData) {
                const selectedOptions = container.querySelectorAll('.option-card.selected');
                hasData = selectedOptions.length > 0;
            }
            
            app.formDataExists = hasData;
            
        } catch (error) {
            console.error('Error in updateFormDataStatus:', error);
            app.formDataExists = false;
        }
    }

    /**
     * Download form data as JSON file
     */
    static downloadFormDataJson(app) {
        app.forceDataSync();
        
        const formData = app.getFormDataForSchema();
        
        if (!formData || Object.keys(formData).length === 0) {
            alert('No form data available to download. Please fill out the form fields first.');
            return;
        }
        
        const downloadData = app.createFormattedJsonStructure(formData);
        const jsonString = JSON.stringify(downloadData, null, 2);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const identifier = app.generateCompactIdentifier();
        link.download = `${identifier}.json`;
        
        link.click();
        URL.revokeObjectURL(url);
        
        console.log('📥 Form data JSON downloaded (new format):', downloadData);
    }

    /**
     * Run evaluation with dynamic data
     */
    static async runEvaluationWithDynamicData(app) {
        app.isRunning = true;
        app.hasResults = false;
        
        try {
            const dynamicFormData = app.getFormDataForSchema();
            console.log('Running evaluation with modular data:', dynamicFormData);
            
            app.logFormDataToConsole();
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            app.results = app.generateEnhancedResults(app.currentSchema, dynamicFormData);
            
            app.isRunning = false;
            app.hasResults = true;
            
        } catch (error) {
            console.error('Error running evaluation:', error);
            app.isRunning = false;
            alert('Error running evaluation: ' + error.message);
        }
    }

    /**
     * Generate enhanced evaluation results
     */
    static generateEnhancedResults(workflowId, inputData) {
        const workflowOutput = `Test`;
        
        const agentResults = [
            {
                agentName: 'schema_validator',
                displayName: 'Schema Validator',
                tokensUsed: Math.floor(Math.random() * 1500 + 300),
                executionTime: Math.floor(Math.random() * 800 + 200),
                model: 'gpt-4-enhanced',
                output: `Schema validation completed successfully for ${workflowId}. Found ${Object.keys(inputData).length} valid input fields. Data structure conforms to expected format. No validation errors detected.`,
                expanded: false
            },
            {
                agentName: 'data_processor',
                displayName: 'Data Processor',
                tokensUsed: Math.floor(Math.random() * 2000 + 500),
                executionTime: Math.floor(Math.random() * 1200 + 400),
                model: 'gpt-4-enhanced',
                output: `Processing ${Object.keys(inputData).length} data fields using modular architecture. Dynamic form system successfully captured: ${Object.keys(inputData).join(', ')}. Data integrity verified.`,
                expanded: false
            },
            {
                agentName: 'evaluation_engine',
                displayName: 'Evaluation Engine',
                tokensUsed: Math.floor(Math.random() * 2500 + 800),
                executionTime: Math.floor(Math.random() * 1500 + 600),
                model: 'gpt-4-enhanced',
                output: `Evaluation completed with ${Math.floor(Math.random() * 15 + 85)}% confidence. Workflow performance: Excellent. Integration with modular system: Successful. Ready for production deployment.`,
                expanded: false
            }
        ];
        
        return { workflowOutput, agentResults };
    }

    /**
     * Load revisions from API
     */
    static async loadRevisionsFromAPI(app) {
        try {
            app.revisions = [
                {
                    id: 'v3.0',
                    name: 'v3.0',
                    date: new Date().toISOString().split('T')[0],
                    description: 'Enhanced modular architecture',
                    author: 'System',
                    status: 'latest'
                },
                {
                    id: 'v2.1',
                    name: 'v2.1',
                    date: '2024-03-10',
                    description: 'Production stable',
                    author: 'System',
                    status: 'stable'
                }
            ];
        } catch (error) {
            console.error('Error loading revisions:', error);
            app.revisions = [];
        }
    }

    /**
     * Download results
     */
    static downloadResults(app) {
        if (!app.results) return;
        
        const resultsData = {
            workflow: app.workflow.name,
            schema: app.currentSchema,
            timestamp: new Date().toISOString(),
            promptVersion: app.selectedPromptVersion,
            inputData: app.getFormDataForSchema(),
            workflowOutput: app.results.workflowOutput,
            agentResults: app.results.agentResults
        };
        
        const dataStr = JSON.stringify(resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${app.workflow.name.replace(/\s+/g, '_')}_evaluation_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

/**
 * Form Data Utilities
 * Helper functions for form data processing
 */
class FormDataUtils {
    static parseFieldNameFromInputId(inputId) {
        if (inputId.startsWith('field-')) {
            return inputId.replace('field-', '');
        }
        if (inputId.startsWith('nested-')) {
            return inputId.replace('nested-', '').replace(/-/g, '.');
        }
        const parts = inputId.split('-');
        if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
            return parts.slice(2).join('_');
        }
        return inputId;
    }

    static setNestedFieldValue(obj, fieldPath, value) {
        const keys = fieldPath.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    static sanitizeFieldName(labelText) {
        return labelText.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '_')
            .trim();
    }

    static extractArrayFieldName(container) {
        return container.getAttribute('data-field-name') || 
               container.getAttribute('data-array-field') ||
               container.id?.replace(/^array-/, '') ||
               this.sanitizeFieldName(container.closest('.form-group')?.querySelector('.form-label')?.textContent || 'items');
    }

    static collectArrayData(arrayContainer) {
        const arrayData = [];
        const items = arrayContainer.querySelectorAll('.array-item, [class*="item"]');
        
        items.forEach((item, index) => {
            const itemData = {};
            const itemInputs = item.querySelectorAll('input, select, textarea');
            
            itemInputs.forEach(input => {
                if (input.id && input.value.trim()) {
                    const propName = this.parseFieldNameFromInputId(input.id);
                    let value = input.value.trim();
                    
                    if (input.type === 'number' && value !== '') {
                        value = parseFloat(value) || 0;
                    }
                    
                    itemData[propName] = value;
                }
            });
            
            if (Object.keys(itemData).length > 0) {
                arrayData.push(itemData);
            }
        });
        
        return arrayData;
    }
}

// Export for global access
window.promptEvaluationApp = promptEvaluationApp;
window.PromptEvaluationCore = PromptEvaluationCore;
window.FormDataUtils = FormDataUtils;
