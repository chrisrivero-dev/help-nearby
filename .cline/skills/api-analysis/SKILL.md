---
name: api-analysis
description: Analyze API frameworks and communication patterns across frontend and backend. Use when asked what an API endpoint does, how frontend communicates with backend, or to understand API architecture.
---

# API Analysis Skill

This skill analyzes API frameworks and communication patterns across the frontend and backend. When asked what an API endpoint does, it analyzes the code and explains the purpose, parameters, response structure, and data sources.

## When to Use

- User asks "what does X API do?" or "explain this endpoint"
- User wants to understand how frontend communicates with backend
- User asks about API architecture or patterns
- User wants to know how data flows through the application
- Before modifying or debugging an API endpoint

## Steps

### 1. Run the Discovery Script

Execute the updated discovery script to get the current API registry:

```bash
python backend/discover_stack.py
```

This outputs a structured markdown registry of all detected API endpoints.

### 2. Locate the Relevant API Files

The script will identify:

**Frontend APIs** (Next.js App Router):

- `frontend/src/app/api/*/route.ts` - API route handlers
- HTTP methods (GET, POST, PUT, DELETE)
- Request validation and parameters

**Backend APIs** (FastAPI):

- `backend/app/main.py` - Main application endpoints
- Decorator patterns (@app.get, @app.post, etc.)
- Pydantic models for request/response

### 3. Parse the API Endpoint

For each endpoint, analyze:

| Aspect           | Questions to Answer                                           |
| ---------------- | ------------------------------------------------------------- |
| **Purpose**      | What data does it return? What action does it perform?        |
| **HTTP Method**  | GET, POST, PUT, DELETE, PATCH?                                |
| **Parameters**   | Path params, query params, body params? Types and validation? |
| **Response**     | Structure of the response data? Status codes?                 |
| **Data Sources** | Database, file, external API, S3?                             |
| **Dependencies** | Auth, rate limiting, CORS, middleware?                        |

### 4. Explain the API

Provide a clear, concise explanation following this structure:

````
## /api/endpoint-name

**Location**: `path/to/file.ts` or `path/to/file.py`

### Purpose
[Brief description of what this endpoint does]

### HTTP Method
[GET/POST/PUT/DELETE] - [when to use]

### Request Parameters
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| x | string | Yes | Description |
| y | number | No | Description |

### Response Structure
```json
{
  "key": "value"
}
````

### Data Sources

- [Database/Table]
- [External API]
- [File/Location]

### Notes

[Any additional context: caching, authentication, error handling]

````

### 5. Map Communication Patterns (if asked)

When asked about frontend-backend communication:

1. Identify the frontend API client (`frontend/src/api/client.ts`)
2. Trace the request flow through the frontend
3. Map to the backend endpoint
4. Explain any transformations or validations

## Frontend API Patterns (Next.js)

### Location
- `frontend/src/app/api/*/route.ts` - App Router API routes

### Pattern
```typescript
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Parse query params
  const { searchParams } = request.nextUrl;
  const param = searchParams.get('key');

  // Validate inputs
  // Query database or external API
  // Return JSON response
}
````

### Key Features

- File-based routing (`/api/foo/route.ts` = `/api/foo` endpoint)
- Server-side only execution
- Native Next.js response handling

## Backend API Patterns (FastAPI)

### Location

- `backend/app/main.py` - Main application
- `backend/app/*/routes.py` - Route modules

### Pattern

```python
@app.get("/api/endpoint")
def get_endpoint(param: str = Query(...)):
    """Endpoint description."""
    # Validate inputs
    # Query database or external API
    # Return Pydantic model
```

### Key Features

- Automatic OpenAPI documentation
- Pydantic validation
- Type hints for request/response models

## Important Rules

- **Always run discovery first** - never rely on cached knowledge of API endpoints
- **Be concise** - focus on what the endpoint does, not implementation details
- **Be accurate** - verify HTTP methods and parameters from the actual code
- **Document dependencies** - note any external services, databases, or auth
- **Explain tradeoffs** - note caching, rate limiting, or design decisions
