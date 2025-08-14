/**
 * Dynamic Form Generator
 * Generates HTML forms based on parsed schema definitions
 */

class FormGenerator {
    constructor(schemaParser) {
        this.schemaParser = schemaParser;
        this.formData = {};
        this.errors = {};
    }

    /**
     * Generate complete form HTML
     */
    generateForm(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        const fields = this.schemaParser.getInputFields();
        const formHtml = this.buildFormHtml(fields, options);
        
        container.innerHTML = formHtml;
        this.initializeFormBehavior(container);
        
        return this.formData;
    }

    /**
     * Build form HTML from field definitions
     */
    buildFormHtml(fields, options = {}) {
        const formId = options.formId || 'dynamic-form';
        const submitText = options.submitText || 'Submit';
        const showSubmit = options.showSubmit !== false;

        let html = `<form id="${formId}" class="dynamic-form" novalidate>`;
        
        for (const field of fields) {
            html += this.generateFieldHtml(field);
        }

        if (showSubmit) {
            html += `
                <div class="row mt-4">
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary btn-lg">
                            <i class="bi bi-check-circle me-2"></i>${submitText}
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-lg ms-2" onclick="this.closest('form').reset()">
                            <i class="bi bi-arrow-clockwise me-2"></i>Reset
                        </button>
                    </div>
                </div>
            `;
        }

        html += '</form>';
        return html;
    }

    /**
     * Generate HTML for individual field
     */
    generateFieldHtml(field, level = 0) {
        const indent = level > 0 ? 'ms-4' : '';
        const fieldId = `field-${field.path.replace(/\./g, '-')}`;
        
        switch (field.type) {
            case 'text':
            case 'number':
                return this.generateInputField(field, fieldId, indent);
            case 'checkbox':
                return this.generateCheckboxField(field, fieldId, indent);
            case 'select':
                return this.generateSelectField(field, fieldId, indent);
            case 'array':
                return this.generateArrayField(field, fieldId, indent);
            case 'object':
                return this.generateObjectField(field, fieldId, indent, level);
            case 'union':
                return this.generateUnionField(field, fieldId, indent);
            default:
                return this.generateInputField(field, fieldId, indent);
        }
    }

    /**
     * Generate input field (text, number, etc.)
     */
    generateInputField(field, fieldId, indent) {
        const required = field.required ? 'required' : '';
        const validation = this.buildValidationAttributes(field.validation);
        
        return `
            <div class="mb-3 ${indent}">
                <label for="${fieldId}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                <input 
                    type="${field.type}" 
                    class="form-control" 
                    id="${fieldId}" 
                    name="${field.path}"
                    ${required}
                    ${validation}
                    ${field.default !== undefined ? `value="${field.default}"` : ''}
                >
                ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                <div class="invalid-feedback" id="${fieldId}-error"></div>
            </div>
        `;
    }

    /**
     * Generate checkbox field
     */
    generateCheckboxField(field, fieldId, indent) {
        const checked = field.default ? 'checked' : '';
        
        return `
            <div class="mb-3 ${indent}">
                <div class="form-check">
                    <input 
                        class="form-check-input" 
                        type="checkbox" 
                        id="${fieldId}"
                        name="${field.path}"
                        ${checked}
                    >
                    <label class="form-check-label" for="${fieldId}">
                        ${field.label}
                        ${field.required ? '<span class="text-danger">*</span>' : ''}
                    </label>
                </div>
                ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                <div class="invalid-feedback" id="${fieldId}-error"></div>
            </div>
        `;
    }

    /**
     * Generate select field
     */
    generateSelectField(field, fieldId, indent) {
        const required = field.required ? 'required' : '';
        let options = '<option value="">Select an option</option>';
        
        if (field.options) {
            for (const option of field.options) {
                const selected = field.default === option.value ? 'selected' : '';
                options += `<option value="${option.value}" ${selected}>${option.label}</option>`;
            }
        }

        return `
            <div class="mb-3 ${indent}">
                <label for="${fieldId}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                <select class="form-select" id="${fieldId}" name="${field.path}" ${required}>
                    ${options}
                </select>
                ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                <div class="invalid-feedback" id="${fieldId}-error"></div>
            </div>
        `;
    }

    /**
     * Generate array field
     */
    generateArrayField(field, fieldId, indent) {
        const arrayId = `array-${fieldId}`;
        
        return `
            <div class="mb-3 ${indent}">
                <label class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                ${field.description ? `<div class="form-text mb-2">${field.description}</div>` : ''}
                
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Items</span>
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="addArrayItem('${arrayId}', '${field.path}')">
                            <i class="bi bi-plus"></i> Add Item
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="${arrayId}" class="array-container" data-field-path="${field.path}" data-item-type="${field.itemType}">
                            <!-- Array items will be added here -->
                        </div>
                    </div>
                </div>
                <div class="invalid-feedback" id="${fieldId}-error"></div>
            </div>
        `;
    }

    /**
     * Generate object field
     */
    generateObjectField(field, fieldId, indent, level) {
        let html = `
            <div class="mb-3 ${indent}">
                <label class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                ${field.description ? `<div class="form-text mb-2">${field.description}</div>` : ''}
                
                <div class="card">
                    <div class="card-body">
        `;

        if (field.fields) {
            for (const nestedField of field.fields) {
                html += this.generateFieldHtml(nestedField, level + 1);
            }
        }

        html += `
                    </div>
                </div>
                <div class="invalid-feedback" id="${fieldId}-error"></div>
            </div>
        `;

        return html;
    }

    /**
     * Generate union field (discriminated union)
     */
    generateUnionField(field, fieldId, indent) {
        const selectorId = `${fieldId}-selector`;
        const contentId = `${fieldId}-content`;
        
        let options = '<option value="">Select type</option>';
        if (field.options) {
            for (const option of field.options) {
                options += `<option value="${option.value}">${option.label}</option>`;
            }
        }

        return `
            <div class="mb-3 ${indent}">
                <label for="${selectorId}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="text-danger">*</span>' : ''}
                </label>
                ${field.description ? `<div class="form-text mb-2">${field.description}</div>` : ''}
                
                <select class="form-select mb-3" id="${selectorId}" name="${field.path}_type" onchange="handleUnionTypeChange('${contentId}', '${field.path}', this.value)">
                    ${options}
                </select>
                
                <div id="${contentId}" class="union-content">
                    <!-- Union type content will be loaded here -->
                </div>
                <div class="invalid-feedback" id="${fieldId}-error"></div>
            </div>
        `;
    }

    /**
     * Build validation attributes for HTML5 validation
     */
    buildValidationAttributes(validation) {
        if (!validation) return '';
        
        let attrs = '';
        if (validation.minLength) attrs += ` minlength="${validation.minLength}"`;
        if (validation.maxLength) attrs += ` maxlength="${validation.maxLength}"`;
        if (validation.min !== undefined) attrs += ` min="${validation.min}"`;
        if (validation.max !== undefined) attrs += ` max="${validation.max}"`;
        if (validation.pattern) attrs += ` pattern="${validation.pattern}"`;
        
        return attrs;
    }

    /**
     * Initialize form behavior and event listeners
     */
    initializeFormBehavior(container) {
        const form = container.querySelector('form');
        if (!form) return;

        // Form submission handler
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(form);
        });

        // Real-time validation
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });

        // Initialize array fields
        this.initializeArrayFields(container);
        
        // Initialize union fields
        this.initializeUnionFields(container);
    }

    /**
     * Initialize array field functionality
     */
    initializeArrayFields(container) {
        // Add global functions for array manipulation
        window.addArrayItem = (arrayId, fieldPath) => {
            const arrayContainer = document.getElementById(arrayId);
            const itemType = arrayContainer.dataset.itemType;
            const itemCount = arrayContainer.children.length;
            
            const itemHtml = this.generateArrayItemHtml(fieldPath, itemType, itemCount);
            arrayContainer.insertAdjacentHTML('beforeend', itemHtml);
        };

        window.removeArrayItem = (button) => {
            button.closest('.array-item').remove();
        };
    }

    /**
     * Generate HTML for array item
     */
    generateArrayItemHtml(fieldPath, itemType, index) {
        const itemId = `${fieldPath}-${index}`;
        const itemPath = `${fieldPath}[${index}]`;
        
        let itemContent = '';
        if (itemType === 'object') {
            // For object items, we'd need the field definition
            itemContent = `<input type="text" class="form-control" name="${itemPath}" placeholder="Object item ${index + 1}">`;
        } else {
            itemContent = `<input type="${itemType}" class="form-control" name="${itemPath}" placeholder="Item ${index + 1}">`;
        }

        return `
            <div class="array-item mb-2">
                <div class="input-group">
                    ${itemContent}
                    <button type="button" class="btn btn-outline-danger" onclick="removeArrayItem(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Initialize union field functionality
     */
    initializeUnionFields(container) {
        window.handleUnionTypeChange = (contentId, fieldPath, selectedType) => {
            const contentContainer = document.getElementById(contentId);
            
            if (!selectedType) {
                contentContainer.innerHTML = '';
                return;
            }

            // Find the schema for the selected type
            const field = this.findFieldByPath(fieldPath);
            if (field && field.options) {
                const selectedOption = field.options.find(opt => opt.value === selectedType);
                if (selectedOption && selectedOption.schema) {
                    // Generate form for the selected union type
                    const unionParser = new SchemaParser({ definitions: { [selectedType]: selectedOption.schema } });
                    const unionFields = unionParser.getInputFields();
                    
                    let unionHtml = '';
                    for (const unionField of unionFields) {
                        unionField.path = `${fieldPath}.${unionField.name}`;
                        unionHtml += this.generateFieldHtml(unionField, 1);
                    }
                    
                    contentContainer.innerHTML = unionHtml;
                }
            }
        };
    }

    /**
     * Find field definition by path
     */
    findFieldByPath(path) {
        const fields = this.schemaParser.getInputFields();
        return this.findFieldInList(fields, path);
    }

    /**
     * Recursively find field in field list
     */
    findFieldInList(fields, path) {
        for (const field of fields) {
            if (field.path === path) {
                return field;
            }
            if (field.fields) {
                const found = this.findFieldInList(field.fields, path);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(form) {
        const formData = new FormData(form);
        const data = this.formDataToObject(formData);
        
        // Validate the data
        const errors = this.schemaParser.validateData(data);
        
        if (errors.length > 0) {
            this.displayErrors(errors);
            return false;
        }

        // Clear any previous errors
        this.clearErrors();
        
        // Store form data
        this.formData = data;
        
        // Trigger custom event
        const submitEvent = new CustomEvent('dynamicFormSubmit', {
            detail: { data: data, form: form }
        });
        form.dispatchEvent(submitEvent);
        
        return true;
    }

    /**
     * Convert FormData to nested object
     */
    formDataToObject(formData) {
        const obj = {};
        
        for (const [key, value] of formData.entries()) {
            // Handle array notation
            if (key.includes('[') && key.includes(']')) {
                this.setNestedArrayValue(obj, key, value);
            } else {
                this.schemaParser.setValueByPath(obj, key, value);
            }
        }
        
        return obj;
    }

    /**
     * Set nested array value
     */
    setNestedArrayValue(obj, key, value) {
        const arrayMatch = key.match(/^([^[]+)\[(\d+)\](.*)$/);
        if (arrayMatch) {
            const [, arrayPath, index, remaining] = arrayMatch;
            
            if (!this.schemaParser.getValueByPath(obj, arrayPath)) {
                this.schemaParser.setValueByPath(obj, arrayPath, []);
            }
            
            const array = this.schemaParser.getValueByPath(obj, arrayPath);
            const idx = parseInt(index);
            
            if (remaining) {
                // Nested object in array
                if (!array[idx]) array[idx] = {};
                this.schemaParser.setValueByPath(array[idx], remaining.substring(1), value);
            } else {
                // Simple array item
                array[idx] = value;
            }
        }
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const fieldDef = this.findFieldByPath(field.name);
        if (!fieldDef) return;

        const errors = this.schemaParser.validateField(fieldDef, field.value);
        const errorElement = document.getElementById(`${field.id}-error`);
        
        if (errors.length > 0) {
            field.classList.add('is-invalid');
            if (errorElement) {
                errorElement.textContent = errors[0].message;
            }
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (errorElement) {
                errorElement.textContent = '';
            }
        }
    }

    /**
     * Display validation errors
     */
    displayErrors(errors) {
        this.clearErrors();
        
        for (const error of errors) {
            const fieldId = `field-${error.field.replace(/\./g, '-')}`;
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}-error`);
            
            if (field) {
                field.classList.add('is-invalid');
            }
            
            if (errorElement) {
                errorElement.textContent = error.message;
            }
        }
    }

    /**
     * Clear all validation errors
     */
    clearErrors() {
        const form = document.querySelector('.dynamic-form');
        if (!form) return;
        
        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        const errorElements = form.querySelectorAll('.invalid-feedback');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    /**
     * Get current form data
     */
    getFormData() {
        return this.formData;
    }

    /**
     * Set form data
     */
    setFormData(data) {
        this.formData = data;
        this.populateForm(data);
    }

    /**
     * Populate form with data
     */
    populateForm(data) {
        const form = document.querySelector('.dynamic-form');
        if (!form) return;

        for (const [path, value] of Object.entries(this.flattenObject(data))) {
            const field = form.querySelector(`[name="${path}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                } else {
                    field.value = value;
                }
            }
        }
    }

    /**
     * Flatten nested object for form population
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object') {
                        Object.assign(flattened, this.flattenObject(item, `${newKey}[${index}]`));
                    } else {
                        flattened[`${newKey}[${index}]`] = item;
                    }
                });
            } else {
                flattened[newKey] = value;
            }
        }
        
        return flattened;
    }
}

// Export for use in other modules
window.FormGenerator = FormGenerator;
