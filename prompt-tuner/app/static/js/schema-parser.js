/**
 * Schema Parser for FastAPI/Pydantic Schemas
 * Parses JSON schema definitions and extracts field information for dynamic form generation
 */

class SchemaParser {
    constructor(schema) {
        this.schema = schema;
        this.definitions = schema.definitions || schema.$defs || {};
        this.rootModel = this.findRootModel();
    }

    /**
     * Find the root model in the schema
     */
    findRootModel() {
        // Look for RootModel or the main model class
        if (this.definitions.RootModel) {
            return this.definitions.RootModel;
        }
        
        // Find the model with the most properties or the one that seems to be the main entry point
        const modelNames = Object.keys(this.definitions);
        const rootCandidates = modelNames.filter(name => 
            name.includes('Root') || name.includes('Main') || name === modelNames[0]
        );
        
        return this.definitions[rootCandidates[0]] || this.definitions[modelNames[0]];
    }

    /**
     * Extract input fields from the schema
     */
    getInputFields() {
        if (!this.rootModel || !this.rootModel.properties) {
            return [];
        }

        const fields = [];
        for (const [fieldName, fieldDef] of Object.entries(this.rootModel.properties)) {
            const field = this.parseField(fieldName, fieldDef);
            if (field) {
                fields.push(field);
            }
        }

        return fields;
    }

    /**
     * Parse individual field definition
     */
    parseField(fieldName, fieldDef, parentPath = '') {
        const fullPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
        
        // Handle $ref references
        if (fieldDef.$ref) {
            const refName = fieldDef.$ref.split('/').pop();
            const refDef = this.definitions[refName];
            if (refDef) {
                return this.parseField(fieldName, refDef, parentPath);
            }
        }

        // Handle anyOf/oneOf (Union types)
        if (fieldDef.anyOf || fieldDef.oneOf) {
            return this.parseUnionField(fieldName, fieldDef, fullPath);
        }

        // Handle arrays
        if (fieldDef.type === 'array') {
            return this.parseArrayField(fieldName, fieldDef, fullPath);
        }

        // Handle objects
        if (fieldDef.type === 'object' || fieldDef.properties) {
            return this.parseObjectField(fieldName, fieldDef, fullPath);
        }

        // Handle primitive types
        return this.parsePrimitiveField(fieldName, fieldDef, fullPath);
    }

    /**
     * Parse primitive field types (string, number, boolean, etc.)
     */
    parsePrimitiveField(fieldName, fieldDef, fullPath) {
        const field = {
            name: fieldName,
            path: fullPath,
            type: this.mapTypeToInputType(fieldDef.type),
            label: this.generateLabel(fieldName),
            description: fieldDef.description || '',
            required: this.isFieldRequired(fieldName),
            validation: this.extractValidation(fieldDef),
            default: fieldDef.default
        };

        // Handle enums
        if (fieldDef.enum) {
            field.type = 'select';
            field.options = fieldDef.enum.map(value => ({
                value: value,
                label: this.generateLabel(value.toString())
            }));
        }

        return field;
    }

    /**
     * Parse array field types
     */
    parseArrayField(fieldName, fieldDef, fullPath) {
        const itemsDef = fieldDef.items;
        let itemType = 'text';
        let itemFields = [];

        if (itemsDef) {
            if (itemsDef.$ref) {
                const refName = itemsDef.$ref.split('/').pop();
                const refDef = this.definitions[refName];
                if (refDef && refDef.properties) {
                    itemType = 'object';
                    itemFields = Object.entries(refDef.properties).map(([name, def]) => 
                        this.parseField(name, def, `${fullPath}[0]`)
                    );
                }
            } else {
                itemType = this.mapTypeToInputType(itemsDef.type);
            }
        }

        return {
            name: fieldName,
            path: fullPath,
            type: 'array',
            label: this.generateLabel(fieldName),
            description: fieldDef.description || '',
            required: this.isFieldRequired(fieldName),
            itemType: itemType,
            itemFields: itemFields,
            minItems: fieldDef.minItems,
            maxItems: fieldDef.maxItems,
            default: fieldDef.default || []
        };
    }

    /**
     * Parse object field types
     */
    parseObjectField(fieldName, fieldDef, fullPath) {
        const nestedFields = [];
        
        if (fieldDef.properties) {
            for (const [nestedName, nestedDef] of Object.entries(fieldDef.properties)) {
                const nestedField = this.parseField(nestedName, nestedDef, fullPath);
                if (nestedField) {
                    nestedFields.push(nestedField);
                }
            }
        }

        return {
            name: fieldName,
            path: fullPath,
            type: 'object',
            label: this.generateLabel(fieldName),
            description: fieldDef.description || '',
            required: this.isFieldRequired(fieldName),
            fields: nestedFields,
            default: fieldDef.default || {}
        };
    }

    /**
     * Parse union field types (anyOf/oneOf)
     */
    parseUnionField(fieldName, fieldDef, fullPath) {
        const options = [];
        const unionTypes = fieldDef.anyOf || fieldDef.oneOf || [];

        for (const unionType of unionTypes) {
            if (unionType.$ref) {
                const refName = unionType.$ref.split('/').pop();
                options.push({
                    value: refName,
                    label: this.generateLabel(refName),
                    schema: this.definitions[refName]
                });
            } else if (unionType.type) {
                options.push({
                    value: unionType.type,
                    label: this.generateLabel(unionType.type),
                    schema: unionType
                });
            }
        }

        return {
            name: fieldName,
            path: fullPath,
            type: 'union',
            label: this.generateLabel(fieldName),
            description: fieldDef.description || '',
            required: this.isFieldRequired(fieldName),
            options: options,
            default: fieldDef.default
        };
    }

    /**
     * Map schema types to HTML input types
     */
    mapTypeToInputType(schemaType) {
        const typeMap = {
            'string': 'text',
            'integer': 'number',
            'number': 'number',
            'boolean': 'checkbox',
            'array': 'array',
            'object': 'object'
        };

        return typeMap[schemaType] || 'text';
    }

    /**
     * Extract validation rules from field definition
     */
    extractValidation(fieldDef) {
        const validation = {};

        if (fieldDef.minLength !== undefined) validation.minLength = fieldDef.minLength;
        if (fieldDef.maxLength !== undefined) validation.maxLength = fieldDef.maxLength;
        if (fieldDef.minimum !== undefined) validation.min = fieldDef.minimum;
        if (fieldDef.maximum !== undefined) validation.max = fieldDef.maximum;
        if (fieldDef.pattern) validation.pattern = fieldDef.pattern;
        if (fieldDef.format) validation.format = fieldDef.format;

        return validation;
    }

    /**
     * Check if field is required
     */
    isFieldRequired(fieldName) {
        return this.rootModel.required && this.rootModel.required.includes(fieldName);
    }

    /**
     * Generate human-readable label from field name
     */
    generateLabel(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ')
            .trim();
    }

    /**
     * Get output schema information for result rendering
     */
    getOutputSchema() {
        // Look for methods that return displayable data
        const outputMethods = [];
        
        if (this.rootModel.methods) {
            for (const [methodName, methodDef] of Object.entries(this.rootModel.methods)) {
                if (methodName.includes('display') || methodName.includes('show') || methodName.includes('render')) {
                    outputMethods.push({
                        name: methodName,
                        description: methodDef.description || '',
                        returnType: methodDef.returns || 'string'
                    });
                }
            }
        }

        return {
            methods: outputMethods,
            properties: this.rootModel.properties || {}
        };
    }

    /**
     * Validate data against schema
     */
    validateData(data) {
        const errors = [];
        const fields = this.getInputFields();

        for (const field of fields) {
            const value = this.getValueByPath(data, field.path);
            const fieldErrors = this.validateField(field, value);
            errors.push(...fieldErrors);
        }

        return errors;
    }

    /**
     * Validate individual field
     */
    validateField(field, value) {
        const errors = [];
        const fieldPath = field.path;

        // Check required fields
        if (field.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field: fieldPath,
                message: `${field.label} is required`
            });
            return errors;
        }

        // Skip validation if field is empty and not required
        if (value === undefined || value === null || value === '') {
            return errors;
        }

        // Type-specific validation
        if (field.validation) {
            const validation = field.validation;

            if (validation.minLength && value.length < validation.minLength) {
                errors.push({
                    field: fieldPath,
                    message: `${field.label} must be at least ${validation.minLength} characters`
                });
            }

            if (validation.maxLength && value.length > validation.maxLength) {
                errors.push({
                    field: fieldPath,
                    message: `${field.label} must be no more than ${validation.maxLength} characters`
                });
            }

            if (validation.min !== undefined && value < validation.min) {
                errors.push({
                    field: fieldPath,
                    message: `${field.label} must be at least ${validation.min}`
                });
            }

            if (validation.max !== undefined && value > validation.max) {
                errors.push({
                    field: fieldPath,
                    message: `${field.label} must be no more than ${validation.max}`
                });
            }

            if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
                errors.push({
                    field: fieldPath,
                    message: `${field.label} format is invalid`
                });
            }
        }

        return errors;
    }

    /**
     * Get value from nested object by path
     */
    getValueByPath(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Set value in nested object by path
     */
    setValueByPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
}

// Export for use in other modules
window.SchemaParser = SchemaParser;
