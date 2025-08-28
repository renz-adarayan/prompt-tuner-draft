/**
 * ApiService - Centralized API communication service
 * Handles all API calls for workflows, schemas, and prompts
 */
class ApiService {
    constructor() {
        this.baseUrl = window.location.origin;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get cached data if available and not expired
     * @param {string} key - Cache key
     * @returns {*} Cached data or null
     */
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set cached data
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    setCached(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Make HTTP request with error handling
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<*>} Response data
     */
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            BaseManager.log(`API request failed: ${url} - ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Fetch available workflows from API
     * @returns {Promise<Array>} Array of workflows
     */
    async fetchWorkflows() {
        const cacheKey = 'workflows';
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const data = await this.makeRequest('/api/workflows');
            const workflows = data.workflows || [];
            this.setCached(cacheKey, workflows);
            return workflows;
        } catch (error) {
            // Return fallback data on API failure
            const fallbackWorkflows = this.getFallbackWorkflows();
            BaseManager.log('Using fallback workflows due to API failure', 'warn');
            return fallbackWorkflows;
        }
    }

    /**
     * Get workflow info by ID
     * @param {string} workflowId - Workflow ID
     * @returns {Promise<Object>} Workflow information
     */
    async getWorkflowInfo(workflowId) {
        if (!workflowId) {
            throw new Error('Workflow ID is required');
        }

        const cacheKey = `workflow_${workflowId}`;
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const data = await this.makeRequest(`/api/workflows/${workflowId}`);
            this.setCached(cacheKey, data);
            return data;
        } catch (error) {
            // Return fallback data
            const fallbackData = this.getFallbackWorkflowInfo(workflowId);
            BaseManager.log(`Using fallback data for workflow ${workflowId}`, 'warn');
            return fallbackData;
        }
    }

    /**
     * Fetch schema from API
     * @param {string} schemaUrl - Schema URL or workflow ID
     * @returns {Promise<Object>} Schema data
     */
    async fetchSchema(schemaUrl) {
        if (!schemaUrl) {
            throw new Error('Schema URL is required');
        }

        const cacheKey = `schema_${schemaUrl}`;
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const data = await this.makeRequest(`/api/schemas/${encodeURIComponent(schemaUrl)}`);
            this.setCached(cacheKey, data);
            return data;
        } catch (error) {
            BaseManager.log(`Failed to fetch schema: ${schemaUrl}`, 'error');
            throw error;
        }
    }

    /**
     * Load prompt content from API
     * @param {string} workflowId - Workflow ID
     * @param {string} promptId - Prompt ID (optional)
     * @returns {Promise<Array>} Array of prompt data
     */
    async loadPromptContent(workflowId, promptId = null) {
        if (!workflowId) {
            throw new Error('Workflow ID is required');
        }

        const cacheKey = `prompts_${workflowId}${promptId ? '_' + promptId : ''}`;
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = promptId 
                ? `/api/workflows/${workflowId}/prompts/${promptId}`
                : `/api/workflows/${workflowId}/prompts`;
            
            const data = await this.makeRequest(url);
            const prompts = data.prompts || [];
            this.setCached(cacheKey, prompts);
            return prompts;
        } catch (error) {
            BaseManager.log(`Failed to load prompts for workflow ${workflowId}`, 'error');
            return [];
        }
    }

    /**
     * Load revisions from API
     * @param {string} workflowId - Workflow ID
     * @returns {Promise<Array>} Array of revisions
     */
    async loadRevisions(workflowId) {
        if (!workflowId) {
            throw new Error('Workflow ID is required');
        }

        const cacheKey = `revisions_${workflowId}`;
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const data = await this.makeRequest(`/api/workflows/${workflowId}/revisions`);
            const revisions = data.revisions || [];
            this.setCached(cacheKey, revisions);
            return revisions;
        } catch (error) {
            BaseManager.log(`Failed to load revisions for workflow ${workflowId}`, 'error');
            return this.getFallbackRevisions();
        }
    }

    /**
     * Process workflow data with input
     * @param {string} workflowId - Workflow ID
     * @param {Object} inputData - Input data
     * @param {string} version - Version to use
     * @returns {Promise<Object>} Processing results
     */
    async processWorkflowData(workflowId, inputData, version = 'latest') {
        if (!workflowId || !inputData) {
            throw new Error('Workflow ID and input data are required');
        }

        try {
            const data = await this.makeRequest(`/api/workflows/${workflowId}/process`, {
                method: 'POST',
                body: JSON.stringify({
                    input: inputData,
                    version: version
                })
            });
            return data;
        } catch (error) {
            BaseManager.log(`Failed to process workflow ${workflowId}`, 'error');
            throw error;
        }
    }

    /**
     * Get fallback workflows when API is unavailable
     * @returns {Array} Fallback workflow data
     */
    getFallbackWorkflows() {
        return [
            {
                id: 'placeholder-workflow',
                name: 'placeholder-workflow',
                description: 'Placeholder workflow (API unavailable)',
                status: 'unknown',
                agents: ['placeholder-agent'],
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            }
        ];
    }

    /**
     * Get fallback workflow info
     * @param {string} workflowId - Workflow ID
     * @returns {Object} Fallback workflow info
     */
    getFallbackWorkflowInfo(workflowId) {
        return {
            id: workflowId,
            name: BaseManager.formatFieldName(workflowId),
            description: 'Workflow details unavailable',
            status: 'unknown',
            agents: ['placeholder-agent'],
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
    }

    /**
     * Get fallback revisions
     * @returns {Array} Fallback revision data
     */
    getFallbackRevisions() {
        return [
            {
                id: 'latest',
                name: 'Latest',
                version: '1.0.0',
                created: new Date().toISOString(),
                is_production: false
            },
            {
                id: 'production',
                name: 'Production',
                version: '0.9.0',
                created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                is_production: true
            }
        ];
    }

    /**
     * Clear cache
     * @param {string} pattern - Optional pattern to match keys (regex string)
     */
    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const [key] of this.cache) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
        BaseManager.log('Cache cleared' + (pattern ? ` (pattern: ${pattern})` : ''), 'info');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            timeout: this.cacheTimeout
        };
    }
}

// Create singleton instance
const apiService = new ApiService();

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiService;
} else if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
    window.apiService = apiService;
}
