# HMCTS Task Manager API Documentation

## Overview

The Task Manager API provides endpoints for managing caseworker tasks. It supports creating, reading, updating, and deleting tasks with proper validation and error handling.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for this API. In a production environment, appropriate authentication and authorization mechanisms should be implemented.

## Data Models

### Task Object

```json
{
  "id": 1,
  "title": "Review case documents",
  "description": "Review all submitted documents for case #12345",
  "status": "pending",
  "due_date": "2024-12-31T23:59:59.000Z",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Task Status Values

- `pending` - Task has been created but not started
- `in_progress` - Task is currently being worked on
- `completed` - Task has been finished
- `cancelled` - Task has been cancelled

## API Endpoints

### Health Check

#### GET /api/health

Check if the API is running and accessible.

**Response:**
```json
{
  "success": true,
  "message": "HMCTS Task Manager API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get All Tasks

#### GET /api/tasks

Retrieve all tasks, ordered by due date (ascending).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Review case documents",
      "description": "Review all submitted documents for case #12345",
      "status": "pending",
      "due_date": "2024-12-31T23:59:59.000Z",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Task by ID

#### GET /api/tasks/:id

Retrieve a specific task by its ID.

**Parameters:**
- `id` (path parameter) - Integer, required. The task ID.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Review case documents",
    "description": "Review all submitted documents for case #12345",
    "status": "pending",
    "due_date": "2024-12-31T23:59:59.000Z",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "Task not found"
}
```

### Create New Task

#### POST /api/tasks

Create a new task.

**Request Body:**
```json
{
  "title": "Review case documents",
  "description": "Review all submitted documents for case #12345",
  "status": "pending",
  "due_date": "2024-12-31T23:59:59.000Z"
}
```

**Required Fields:**
- `title` - String (1-255 characters)
- `status` - String (must be one of: pending, in_progress, completed, cancelled)
- `due_date` - ISO 8601 datetime string

**Optional Fields:**
- `description` - String (max 1000 characters)

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Review case documents",
    "description": "Review all submitted documents for case #12345",
    "status": "pending",
    "due_date": "2024-12-31T23:59:59.000Z"
  },
  "message": "Task created successfully"
}
```

### Update Task

#### PUT /api/tasks/:id

Update an entire task. All fields that should be preserved must be included.

**Parameters:**
- `id` (path parameter) - Integer, required. The task ID.

**Request Body:**
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress",
  "due_date": "2024-12-31T23:59:59.000Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated task title",
    "description": "Updated description",
    "status": "in_progress",
    "due_date": "2024-12-31T23:59:59.000Z",
    "updated": true
  },
  "message": "Task updated successfully"
}
```

### Update Task Status

#### PATCH /api/tasks/:id/status

Update only the status of a task.

**Parameters:**
- `id` (path parameter) - Integer, required. The task ID.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    "updated": true
  },
  "message": "Task status updated successfully"
}
```

### Delete Task

#### DELETE /api/tasks/:id

Delete a task permanently.

**Parameters:**
- `id` (path parameter) - Integer, required. The task ID.

**Response (Success):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Error Responses

### Validation Errors

When request validation fails:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "type": "field",
      "value": "",
      "msg": "Title is required and must be between 1 and 255 characters",
      "path": "title",
      "location": "body"
    }
  ]
}
```

### Not Found Errors

When a resource is not found:

```json
{
  "success": false,
  "error": "Task not found"
}
```

### Server Errors

When an internal server error occurs:

```json
{
  "success": false,
  "error": "Failed to create task",
  "message": "Database connection failed"
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

Currently, no rate limiting is implemented. In a production environment, appropriate rate limiting should be added to prevent abuse.

## CORS

The API includes CORS headers to allow cross-origin requests from web applications.

## Security Headers

The API uses Helmet.js to set various HTTP security headers:
- Content Security Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- And more

## Database

The API uses SQLite for data storage. The database file is created automatically at `data/tasks.db` when the server starts.

## Testing

Run the test suite with:

```bash
npm test
```

The tests cover all API endpoints and include validation testing, error handling, and edge cases.
