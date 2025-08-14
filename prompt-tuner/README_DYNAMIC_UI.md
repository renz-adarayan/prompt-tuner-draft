# Dynamic UI System for Prompt Tuner

This document describes the new dynamic UI system that transforms the prompt-tuner into a schema-driven workflow platform capable of adapting to any Ingenious workflow.

## Overview

The dynamic UI system automatically generates forms and displays results based on FastAPI/Pydantic schema definitions. This allows the frontend to work with any custom workflow without requiring code changes.

## Architecture

### Core Components

1. **SchemaParser** (`schema-parser.js`)
   - Parses JSON schema definitions from FastAPI/Pydantic models
   - Extracts field definitions, types, constraints, and validation rules
   - Handles complex types: objects, arrays, unions, references

2. **FormGenerator** (`form-generator.js`)
   - Dynamically generates HTML forms based on parsed schema
   - Supports all common input types with validation
   - Handles nested objects, dynamic arrays, and union types

3. **OutputRenderer** (`output-renderer.js`)
   - Renders results in multiple formats (auto, table, cards, JSON)
   - Handles custom display methods (like `display_bike_sales_as_table`)
   - Provides export functionality (JSON, CSV, HTML)

4. **WorkflowManager** (`workflow-manager.js`)
   - Orchestrates workflow selection and schema loading
   - Manages revisions and prompt versioning
   - Coordinates form generation and result display

## Features

### Schema-Driven Form Generation

The system automatically creates forms based on schema definitions:

```javascript
// Example: Bike store schema generates dynamic form
{
  "definitions": {
    "RootModel": {
      "type": "object",
      "properties": {
        "stores": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {"type": "string", "description": "Store name"},
              "location": {"type": "string", "description": "Store location"}
            }
          }
        }
      }
    }
  }
}
```

This generates:
- Array field with add/remove functionality
- Nested object forms for each store
- Validation based on schema constraints
- Help text from field descriptions

### Supported Field Types

- **Primitive Types**: string, number, boolean
- **Complex Types**: objects, arrays
- **Union Types**: discriminated unions with type selection
- **Enums**: dropdown selections
- **Validation**: min/max, length, patterns, required fields

### Dynamic Output Rendering

Results are automatically rendered based on data structure:

- **Tables**: For array data with consistent structure
- **Cards**: For object data and mixed content
- **Custom Displays**: Markdown tables, formatted text
- **JSON**: Raw data view with syntax highlighting

### Export Capabilities

- **JSON**: Raw data export
- **CSV**: Tabular data export
- **HTML**: Formatted table export

## Usage

### 1. Basic Workflow Selection

```javascript
// Select a predefined workflow
workflowManager.selectWorkflow('bike-insights');
```

### 2. Custom Schema Upload

```javascript
// Load custom schema
const customSchema = {
  "definitions": {
    "RootModel": {
      // Your schema definition
    }
  }
};

workflowManager.selectWorkflow('custom-workflow', { 
  customSchema: customSchema 
});
```

### 3. Form Handling

```javascript
// Listen for form submissions
document.addEventListener('dynamicFormSubmit', (event) => {
  const formData = event.detail.data;
  // Process form data
});
```

## File Structure

```
prompt-tuner/
├── app/
│   ├── static/js/
│   │   ├── schema-parser.js      # Schema parsing logic
│   │   ├── form-generator.js     # Dynamic form generation
│   │   ├── output-renderer.js    # Result display rendering
│   │   └── workflow-manager.js   # Workflow orchestration
│   ├── templates/
│   │   └── workflows/
│   │       └── dynamic.html      # Main dynamic UI page
│   └── blueprints/
│       └── workflows.py          # Workflow routes
├── test_dynamic_ui.py            # Test server script
└── README_DYNAMIC_UI.md          # This documentation
```

## API Integration

The system integrates with existing APIs:

### Workflow Processing
```
POST /submission-evaluation/api/evaluate
POST /api/v1/workflows/{workflow_id}/process
```

### Schema Loading
```
GET /api/v1/workflows/{workflow_id}/schema
GET /api/v1/workflows
```

### Revision Management
```
GET /submission-evaluation/api/revisions
```

## Testing

Run the test server:

```bash
cd prompt-tuner
python test_dynamic_ui.py
```

Navigate to `http://localhost:5000/workflows/dynamic` to test:

1. **Bike Insights Workflow**: Pre-configured with bike sales schema
2. **Submission Evaluation**: Existing workflow with dynamic form
3. **Custom Schema Upload**: Test with your own JSON schema

## Schema Examples

### Simple Input Schema
```json
{
  "definitions": {
    "RootModel": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "User name"
        },
        "age": {
          "type": "integer",
          "minimum": 0,
          "maximum": 120
        }
      },
      "required": ["name"]
    }
  }
}
```

### Complex Nested Schema
```json
{
  "definitions": {
    "RootModel": {
      "type": "object",
      "properties": {
        "users": {
          "type": "array",
          "items": {"$ref": "#/definitions/User"}
        }
      }
    },
    "User": {
      "type": "object",
      "properties": {
        "profile": {"$ref": "#/definitions/Profile"},
        "preferences": {
          "type": "object",
          "properties": {
            "theme": {
              "type": "string",
              "enum": ["light", "dark"]
            }
          }
        }
      }
    }
  }
}
```

## Customization

### Adding New Field Types

Extend the `FormGenerator` class:

```javascript
// In form-generator.js
generateCustomField(field, fieldId, indent) {
  // Custom field generation logic
}
```

### Custom Output Renderers

Extend the `OutputRenderer` class:

```javascript
// In output-renderer.js
renderCustomFormat(data) {
  // Custom rendering logic
}
```

### New Workflow Types

Add to `WorkflowManager`:

```javascript
// In workflow-manager.js
processCustomWorkflow(formData) {
  // Custom processing logic
}
```

## Error Handling

The system includes comprehensive error handling:

- **Schema Validation**: Invalid JSON schemas are caught and reported
- **Form Validation**: Real-time validation with user feedback
- **API Errors**: Network and server errors are handled gracefully
- **Type Mismatches**: Automatic type coercion where possible

## Performance Considerations

- **Schema Caching**: Schemas are cached to reduce API calls
- **Lazy Loading**: Components are initialized only when needed
- **Debounced Validation**: Form validation is debounced to improve performance
- **Memory Management**: Event listeners are properly cleaned up

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript Features**: ES6+ features used throughout
- **CSS Features**: CSS Grid and Flexbox for layouts
- **Bootstrap 5**: For consistent styling and components

## Security Considerations

- **XSS Prevention**: All user input is properly escaped
- **Schema Validation**: Schemas are validated before processing
- **CORS**: Proper CORS configuration for API calls
- **Input Sanitization**: Form inputs are sanitized and validated

## Future Enhancements

1. **Schema Versioning**: Support for schema evolution and migration
2. **Advanced Validation**: Custom validation rules and async validation
3. **Conditional Fields**: Show/hide fields based on other field values
4. **Drag & Drop**: Reorderable array items and form sections
5. **Real-time Collaboration**: Multiple users editing the same workflow
6. **Schema Editor**: Visual schema editor for creating custom workflows
7. **Template Library**: Pre-built templates for common workflow patterns
8. **Performance Monitoring**: Built-in performance metrics and optimization

## Troubleshooting

### Common Issues

1. **Schema Not Loading**
   - Check network connectivity
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Form Not Generating**
   - Ensure schema has valid `definitions` structure
   - Check for circular references in schema
   - Verify `RootModel` exists in definitions

3. **Validation Errors**
   - Check field constraints in schema
   - Ensure required fields are marked correctly
   - Verify data types match schema expectations

4. **Output Not Rendering**
   - Check data structure matches expected format
   - Verify custom display methods are properly formatted
   - Check browser console for JavaScript errors

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
location.reload();
```

This enables detailed logging for troubleshooting.
