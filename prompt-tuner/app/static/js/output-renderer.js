/**
 * Dynamic Output Renderer
 * Renders output data based on schema definitions and data structure
 */

class OutputRenderer {
    constructor(schemaParser) {
        this.schemaParser = schemaParser;
        this.viewModes = ['auto', 'table', 'card', 'json', 'custom'];
        this.currentViewMode = 'auto';
    }

    /**
     * Render output data in specified container
     */
    renderOutput(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        this.currentViewMode = options.viewMode || 'auto';
        const title = options.title || 'Results';
        const showControls = options.showControls !== false;

        let html = this.buildOutputHtml(data, title, showControls);
        container.innerHTML = html;
        
        this.initializeOutputBehavior(container);
    }

    /**
     * Build complete output HTML
     */
    buildOutputHtml(data, title, showControls) {
        const outputId = `output-${Date.now()}`;
        
        let html = `
            <div class="output-container" id="${outputId}">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="mb-0">${title}</h4>
                    ${showControls ? this.buildControlsHtml(outputId) : ''}
                </div>
                <div class="output-content">
                    ${this.renderData(data)}
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Build view controls HTML
     */
    buildControlsHtml(outputId) {
        return `
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="changeViewMode('${outputId}', 'auto')" data-view="auto">
                    <i class="bi bi-magic"></i> Auto
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="changeViewMode('${outputId}', 'table')" data-view="table">
                    <i class="bi bi-table"></i> Table
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="changeViewMode('${outputId}', 'card')" data-view="card">
                    <i class="bi bi-card-text"></i> Cards
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="changeViewMode('${outputId}', 'json')" data-view="json">
                    <i class="bi bi-code"></i> JSON
                </button>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="bi bi-download"></i> Export
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="exportData('${outputId}', 'json')">JSON</a></li>
                        <li><a class="dropdown-item" href="#" onclick="exportData('${outputId}', 'csv')">CSV</a></li>
                        <li><a class="dropdown-item" href="#" onclick="exportData('${outputId}', 'html')">HTML</a></li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Render data based on current view mode
     */
    renderData(data) {
        if (!data) {
            return '<div class="alert alert-info">No data to display</div>';
        }

        // Check for custom display methods first
        if (this.hasCustomDisplayMethod(data)) {
            return this.renderCustomDisplay(data);
        }

        switch (this.currentViewMode) {
            case 'table':
                return this.renderTableView(data);
            case 'card':
                return this.renderCardView(data);
            case 'json':
                return this.renderJsonView(data);
            case 'auto':
            default:
                return this.renderAutoView(data);
        }
    }

    /**
     * Check if data has custom display methods
     */
    hasCustomDisplayMethod(data) {
        // Check if the data contains markdown-formatted content (like from display_bike_sales_as_table)
        if (typeof data === 'string' && data.includes('##') && data.includes('|')) {
            return true;
        }
        
        // Check if data has methods that suggest custom display
        if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            return keys.some(key => key.includes('display') || key.includes('render') || key.includes('show'));
        }
        
        return false;
    }

    /**
     * Render custom display format
     */
    renderCustomDisplay(data) {
        if (typeof data === 'string' && data.includes('##')) {
            // Handle markdown-like content
            return this.renderMarkdownContent(data);
        }
        
        // Handle object with custom display methods
        let html = '';
        for (const [key, value] of Object.entries(data)) {
            if (key.includes('display') || key.includes('render') || key.includes('show')) {
                html += this.renderMarkdownContent(value);
            }
        }
        
        return html || this.renderAutoView(data);
    }

    /**
     * Render markdown-like content (especially tables)
     */
    renderMarkdownContent(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }

        let html = '';
        const lines = content.split('\n');
        let inTable = false;
        let tableHeaders = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Handle headers
            if (line.startsWith('##')) {
                if (inTable) {
                    html += '</tbody></table></div>';
                    inTable = false;
                }
                html += `<h5 class="mt-3 mb-2">${line.replace(/^##\s*/, '')}</h5>`;
                continue;
            }
            
            // Handle table rows
            if (line.includes('|')) {
                if (!inTable) {
                    // Start new table
                    html += '<div class="table-responsive"><table class="table table-striped table-hover">';
                    
                    // Parse headers
                    tableHeaders = line.split('|').map(h => h.trim()).filter(h => h);
                    html += '<thead class="table-dark"><tr>';
                    for (const header of tableHeaders) {
                        html += `<th>${header}</th>`;
                    }
                    html += '</tr></thead><tbody>';
                    inTable = true;
                } else {
                    // Regular table row
                    const cells = line.split('|').map(c => c.trim()).filter(c => c);
                    if (cells.length > 0 && !cells[0].includes('-')) {
                        html += '<tr>';
                        for (const cell of cells) {
                            html += `<td>${cell}</td>`;
                        }
                        html += '</tr>';
                    }
                }
            } else if (line && !line.includes('-') && inTable) {
                // End table if we hit non-table content
                html += '</tbody></table></div>';
                inTable = false;
                html += `<p>${line}</p>`;
            } else if (line && !inTable) {
                html += `<p>${line}</p>`;
            }
        }
        
        // Close any open table
        if (inTable) {
            html += '</tbody></table></div>';
        }
        
        return html;
    }

    /**
     * Auto-detect best view mode and render
     */
    renderAutoView(data) {
        if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'object') {
                return this.renderTableView(data);
            } else {
                return this.renderListView(data);
            }
        } else if (typeof data === 'object' && data !== null) {
            // Check if it looks like tabular data
            const keys = Object.keys(data);
            if (keys.some(key => Array.isArray(data[key]) && data[key].length > 0)) {
                return this.renderCardView(data);
            } else {
                return this.renderObjectView(data);
            }
        } else {
            return this.renderPrimitiveView(data);
        }
    }

    /**
     * Render table view for array data
     */
    renderTableView(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '<div class="alert alert-info">No tabular data available</div>';
        }

        const firstItem = data[0];
        if (typeof firstItem !== 'object') {
            return this.renderListView(data);
        }

        const headers = Object.keys(firstItem);
        
        let html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
        `;
        
        for (const header of headers) {
            html += `<th>${this.formatHeader(header)}</th>`;
        }
        
        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        for (const item of data) {
            html += '<tr>';
            for (const header of headers) {
                const value = item[header];
                html += `<td>${this.formatCellValue(value)}</td>`;
            }
            html += '</tr>';
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }

    /**
     * Render card view for object data
     */
    renderCardView(data) {
        if (Array.isArray(data)) {
            let html = '<div class="row">';
            
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                html += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="card-title mb-0">Item ${i + 1}</h6>
                            </div>
                            <div class="card-body">
                                ${this.renderObjectContent(item)}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
            return html;
        } else if (typeof data === 'object' && data !== null) {
            return `
                <div class="card">
                    <div class="card-body">
                        ${this.renderObjectContent(data)}
                    </div>
                </div>
            `;
        }
        
        return this.renderPrimitiveView(data);
    }

    /**
     * Render object content
     */
    renderObjectContent(obj) {
        let html = '';
        
        for (const [key, value] of Object.entries(obj)) {
            html += `
                <div class="mb-2">
                    <strong>${this.formatHeader(key)}:</strong>
                    <span class="ms-2">${this.formatValue(value)}</span>
                </div>
            `;
        }
        
        return html;
    }

    /**
     * Render simple object view
     */
    renderObjectView(data) {
        return `
            <div class="card">
                <div class="card-body">
                    ${this.renderObjectContent(data)}
                </div>
            </div>
        `;
    }

    /**
     * Render list view for simple arrays
     */
    renderListView(data) {
        if (!Array.isArray(data)) {
            return this.renderPrimitiveView(data);
        }

        let html = '<ul class="list-group">';
        
        for (const item of data) {
            html += `<li class="list-group-item">${this.formatValue(item)}</li>`;
        }
        
        html += '</ul>';
        return html;
    }

    /**
     * Render JSON view
     */
    renderJsonView(data) {
        const jsonString = JSON.stringify(data, null, 2);
        return `
            <div class="position-relative">
                <button class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2" onclick="copyToClipboard(this)" data-content="${Utils.escapeHtml(jsonString)}">
                    <i class="bi bi-clipboard"></i> Copy
                </button>
                <pre class="bg-light p-3 rounded"><code>${Utils.escapeHtml(jsonString)}</code></pre>
            </div>
        `;
    }

    /**
     * Render primitive values
     */
    renderPrimitiveView(data) {
        return `
            <div class="alert alert-secondary">
                <strong>Value:</strong> ${this.formatValue(data)}
            </div>
        `;
    }

    /**
     * Format header text
     */
    formatHeader(header) {
        return header
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ')
            .trim();
    }

    /**
     * Format cell value for table display
     */
    formatCellValue(value) {
        if (value === null || value === undefined) {
            return '<span class="text-muted">—</span>';
        }
        
        if (typeof value === 'boolean') {
            return value ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>';
        }
        
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        
        if (typeof value === 'object') {
            return '<span class="text-muted">[Object]</span>';
        }
        
        if (Array.isArray(value)) {
            return `<span class="text-muted">[${value.length} items]</span>`;
        }
        
        // Truncate long strings
        const str = String(value);
        if (str.length > 50) {
            return `<span title="${Utils.escapeHtml(str)}">${Utils.escapeHtml(str.substring(0, 47))}...</span>`;
        }
        
        return Utils.escapeHtml(str);
    }

    /**
     * Format value for general display
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return '<span class="text-muted">—</span>';
        }
        
        if (typeof value === 'boolean') {
            return value ? '<span class="badge bg-success">True</span>' : '<span class="badge bg-secondary">False</span>';
        }
        
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return `<span class="badge bg-info">${value.length} items</span>`;
            } else {
                return '<span class="badge bg-warning">Object</span>';
            }
        }
        
        return Utils.escapeHtml(String(value));
    }

    /**
     * Initialize output behavior and controls
     */
    initializeOutputBehavior(container) {
        // Store reference to current data for view mode changes
        const outputContainer = container.querySelector('.output-container');
        if (outputContainer) {
            outputContainer.outputRenderer = this;
        }

        // Initialize global functions for controls
        window.changeViewMode = (outputId, viewMode) => {
            const container = document.getElementById(outputId);
            if (container && container.outputRenderer) {
                container.outputRenderer.currentViewMode = viewMode;
                
                // Update button states
                const buttons = container.querySelectorAll('[data-view]');
                buttons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.view === viewMode) {
                        btn.classList.add('active');
                    }
                });
                
                // Re-render content
                const contentContainer = container.querySelector('.output-content');
                if (contentContainer && container.originalData) {
                    contentContainer.innerHTML = container.outputRenderer.renderData(container.originalData);
                }
            }
        };

        window.exportData = (outputId, format) => {
            const container = document.getElementById(outputId);
            if (container && container.originalData) {
                this.exportData(container.originalData, format);
            }
        };

        window.copyToClipboard = (button) => {
            const content = button.dataset.content;
            if (content) {
                Utils.copyToClipboard(content);
            }
        };

        // Set initial active button
        const autoButton = container.querySelector('[data-view="auto"]');
        if (autoButton) {
            autoButton.classList.add('active');
        }
    }

    /**
     * Export data in specified format
     */
    exportData(data, format) {
        let content = '';
        let filename = `export_${new Date().toISOString().split('T')[0]}`;
        let mimeType = 'text/plain';

        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                filename += '.json';
                mimeType = 'application/json';
                break;
            case 'csv':
                content = this.convertToCSV(data);
                filename += '.csv';
                mimeType = 'text/csv';
                break;
            case 'html':
                content = this.convertToHTML(data);
                filename += '.html';
                mimeType = 'text/html';
                break;
        }

        this.downloadFile(content, filename, mimeType);
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const firstItem = data[0];
        if (typeof firstItem !== 'object') {
            return data.join('\n');
        }

        const headers = Object.keys(firstItem);
        let csv = headers.join(',') + '\n';

        for (const item of data) {
            const row = headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value).replace(/"/g, '""');
            });
            csv += '"' + row.join('","') + '"\n';
        }

        return csv;
    }

    /**
     * Convert data to HTML format
     */
    convertToHTML(data) {
        const tableHtml = this.renderTableView(data);
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Exported Data</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container mt-4">
                    <h1>Exported Data</h1>
                    ${tableHtml}
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Download file with given content
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Update output with new data
     */
    updateOutput(containerId, data) {
        const container = document.getElementById(containerId);
        if (container) {
            const outputContainer = container.querySelector('.output-container');
            if (outputContainer) {
                outputContainer.originalData = data;
                const contentContainer = container.querySelector('.output-content');
                if (contentContainer) {
                    contentContainer.innerHTML = this.renderData(data);
                }
            }
        }
    }
}

// Export for use in other modules
window.OutputRenderer = OutputRenderer;
