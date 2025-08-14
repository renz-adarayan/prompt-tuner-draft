**Prompt for Improving Codebase Integration with Ingenious Workflows**
Please update this codebase to support dynamic integration with any custom workflow defined using the Ingenious library (e.g., bike-insights). The system should behave as follows:



**Schema-Driven UI & API Integration:** 
 The Flask backend and Alpine.js frontend must automatically adapt based on the FastAPI API schema generated by the selected custom Ingenious workflow. The frontend will only have access to the API schema (not the Ingenious or workflow code) and must use this schema to:

 - Render prompt input components that match the schema’s input requirement.
 - Display agent outputs in the UI in a way that accurately reflects the schema’s output definitions.
 - Support the tuning of prompts with each prompt versioned and tracked by revision.



- **Prompt Versioning & Revision Management:** 
 Allow users to tune and save different prompt versions, each identified by a revision name. The UI should surface all available revisions and enable switching between them.



**Persistence & Integration Requirements:** 
 - Continue to support blob integration as currently implemented.

 - Integrate a database layer for persistence—use SQLite for local development and Azure SQL for deployment.

 - Persist all data requiring durability, including (but not limited to) the names and details of prompt revisions. Audit the workflow to determine any additional entities or metadata that should be stored in the database beyond revisions (e.g., user preferences, prompt usage history, etc.).



- **General Expectations:** 

 - The system should be robust to changes in the workflow schema.

 - Document any assumptions or design decisions.

 - Ensure the codebase remains modular and maintainable.



---



# Place in .github/copilot-instructions.md



# Package Management: uv



This project uses uv for Python package and environment management.



## Common Commands

- **Run a command in the project environment:**

`uv run <command>` (e.g., `uv run app.py` instead of `uv run python app.py`)



- **Add a dependency:**

`uv add <package>` or `uv add <package> --dev` for dev dependencies



- **Remove a dependency:**

`uv remove <package>` or `uv remove <package> --group dev` for dev dependencies



- **Sync environment with pyproject.toml and lockfile:**

`uv sync`



- **Run tests (run after implementing changes to ensure nothing broke):**

`uv run pytest`



- **List out packages in environment in a tree structure**

`uv tree`



## Note



- Do **not** use `pip` or `pip-tools` directly; use `uv` commands above.



# Python Type Hinting



## Best Practices

- **Always type hint function parameters and return values.**

```python

 def process_data(items: list[str]) -> dict[str, int]:

     return {"count": len(items)}

 ```



- **Use modern union syntax** with `|` instead of `Union` (Python 3.10+).

```python

 # Good

 def get_user(user_id: int | str) -> User | None:

     pass



 # Avoid

 from typing import Union, Optional

 def get_user(user_id: Union[int, str]) -> Optional[User]:

     pass

 ```



- **Use `from __future__ import annotations`** for forward references and cleaner code.



# Flask Best Practices



## Response Handling

- **Return dictionaries directly** from Flask routes instead of using `jsonify()`. Flask automatically converts dictionaries to JSON responses.

```python

 # Good

 return {"message": "success", "data": data}



 # Avoid

 return jsonify({"message": "success", "data": data})

 ```



## Error Handling

- **Use try/abort pattern** instead of Flask's `_or_404` or similar convenience functions for better error control.

```python

 # Good

 try:

     user = User.query.filter_by(id=user_id).one()

 except NoResultFound:

     abort(404, description="User not found")



 # Avoid

 user = User.query.get_or_404(user_id)

 ```



 ## Static Files



 - **Store static files** such as CSS, JavaScript, and images in the `static` directory.

 - **Store HTML Jinja templates** in the `templates` directory.

 - **For small snippets** of CSS or JavaScript, consider inlining them directly into your templates if it simplifies the project structure. However, for maintainability, lengthy JS code should always be kept separate.



# Frontend Libraries

## Bootstrap

- Use Bootstrap for all styling and layout.

- Prefer Bootstrap utility classes (e.g., `d-flex`, `mb-3`, `text-primary`) over custom CSS.

- Write custom CSS only if Bootstrap utilities are insufficient.

- Include Bootstrap via CDN in your base template.



## Alpine.js

- Use Alpine.js for client-side interactivity.

- Prefer Alpine.js directives (`x-data`, `x-show`, `x-on:click`) over vanilla JS or jQuery.

- Keep Alpine.js logic simple and declarative in HTML attributes.

- Include Alpine.js via CDN in your base template.