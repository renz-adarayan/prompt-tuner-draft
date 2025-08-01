/**
 * Main JavaScript for Submission over Criteria Platform
 * Handles common functionality across all pages
 */

// Global configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:80',
    TIMEOUT: 30000,
    RETRY_COUNT: 3
};

// Utility functions
const Utils = {
    /**
     * Make an API request with error handling
     */
    async apiRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: CONFIG.TIMEOUT
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    },

    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Add to toast container or create one
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove from DOM after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy text:', err);
            this.showToast('Failed to copy text', 'danger');
        }
    },

    /**
     * Validate JSON string
     */
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Format JSON for display
     */
    formatJSON(obj) {
        return JSON.stringify(obj, null, 2);
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Truncate text with ellipsis
     */
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Count words in text
     */
    wordCount(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Local storage helper
     */
    storage: {
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error writing to localStorage:', e);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        }
    }
};

// Global state management
const AppState = {
    currentUser: null,
    apiStatus: 'unknown',

    setApiStatus(status) {
        this.apiStatus = status;
        this.updateStatusIndicators();
    },

    updateStatusIndicators() {
        const indicators = document.querySelectorAll('.api-status-indicator');
        indicators.forEach(indicator => {
            indicator.className = `status-indicator ${this.apiStatus === 'online' ? 'status-online' : 'status-offline'}`;
        });
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Check API status on page load
    checkApiStatus();

    // Set up periodic API status checks
    setInterval(checkApiStatus, 60000); // Check every minute

    // Set up global error handling
    window.addEventListener('unhandledrejection', function (event) {
        console.error('Unhandled promise rejection:', event.reason);
        Utils.showToast('An unexpected error occurred', 'danger');
    });

    // Initialize Alpine.js stores if available
    if (typeof Alpine !== 'undefined') {
        initializeAlpineStores();
    }
});

// API Status Check
async function checkApiStatus() {
    try {
        // Simple health check - we'll just check if we can reach the API
        const response = await fetch(CONFIG.API_BASE_URL + '/api/v1/chat', {
            method: 'OPTIONS',
            timeout: 5000
        });
        AppState.setApiStatus('online');
    } catch (error) {
        AppState.setApiStatus('offline');
    }
}

// Loading state management
const LoadingManager = {
    show(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.classList.add('position-relative');

            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;

            element.appendChild(overlay);
        }
    },

    hide(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            const overlay = element.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    }
};

// Initialize Alpine.js stores
function initializeAlpineStores() {
    // Alpine.js stores can be initialized here if needed
}

// Export globals for use in other scripts
window.Utils = Utils;
window.AppState = AppState;
window.LoadingManager = LoadingManager;
window.CONFIG = CONFIG;
