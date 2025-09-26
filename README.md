# HMCTS Task Manager

A modern task management system built for HMCTS caseworkers to efficiently track and manage their tasks.

## Features

- **Task Management**: Create, view, update, and delete tasks
- **Status Tracking**: Track task progress with statuses (Pending, In Progress, Completed, Cancelled)
- **Due Date Management**: Set and monitor task due dates with visual indicators
- **User-Friendly Interface**: Built with GOV.UK Design System for accessibility and usability
- **Real-time Updates**: Instant status updates and task modifications
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **API Documentation**: Comprehensive REST API with proper validation and error handling

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **Jest** - Testing framework
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **TypeScript** - Type-safe JavaScript
- **GOV.UK Design System** - UI components and styling
- **Vanilla JavaScript** - No framework dependencies for simplicity

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

##  Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

Or use the setup script:

```bash
npm run setup
```

### 2. Start the Application

#### Development Mode

Start the backend server:
```bash
npm run dev
```

In a separate terminal, start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

#### Production Mode

Build the frontend:
```bash
npm run build:frontend
```

Start the production server:
```bash
npm start
```

The application will be available at http://localhost:3000

## Testing

Run the backend test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Project Structure

```
task-manager/
├── src/                          # Backend source code
│   ├── database/
│   │   └── database.js          # Database connection and queries
│   ├── routes/
│   │   └── tasks.js             # Task API routes
│   ├── tests/
│   │   ├── setup.js             # Test configuration
│   │   └── tasks.test.js        # API tests
│   └── server.js                # Express server setup
├── frontend/                     # Frontend source code
│   ├── src/
│   │   ├── api/
│   │   │   └── taskApi.ts       # API client
│   │   ├── styles/
│   │   │   └── main.css         # Custom styles
│   │   ├── types/
│   │   │   └── task.ts          # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── dateUtils.ts     # Date utility functions
│   │   └── main.ts              # Main application logic
│   ├── index.html               # Main HTML file
│   ├── package.json             # Frontend dependencies
│   ├── tsconfig.json            # TypeScript configuration
├── data/                         # SQLite database (auto-created)
├── jest.config.js               # Jest configuration
├── package.json                 # Backend dependencies and scripts
├── API_DOCUMENTATION.md         # Detailed API documentation
└── README.md                    # This file
```

## Configuration

### Environment Variables

The application uses the following environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production/test)

### Database

The SQLite database is automatically created in the `data/` directory when the server starts. The database schema includes:

- **tasks** table with columns:
  - `id` (INTEGER PRIMARY KEY)
  - `title` (TEXT NOT NULL)
  - `description` (TEXT)
  - `status` (TEXT NOT NULL)
  - `due_date` (DATETIME NOT NULL)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

## API Usage

### Create a Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review case documents",
    "description": "Review all submitted documents for case #12345",
    "status": "pending",
    "due_date": "2024-12-31T23:59:59.000Z"
  }'
```

### Get All Tasks

```bash
curl http://localhost:3000/api/tasks
```

### Update Task Status

```bash
curl -X PATCH http://localhost:3000/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) or visit http://localhost:3000/api/docs when the server is running.

## UI Features

### Task Management
- **Create Tasks**: Simple form with validation
- **View Tasks**: layout with status indicators
- **Edit Tasks**: editing interface
- **Delete Tasks**: Confirmation dialogs for safety
- **Status Updates**: Quick status changes via dropdown

### Visual Indicators
- **Status Colors**: Color-coded task statuses
- **Progress Tracking**: Clear status progression

### Accessibility
- **GOV.UK Design System**: Follows government accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical tab order and focus indicators

## Security Features

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content sanitization
- **Security Headers**: Helmet.js security middleware
- **CORS Configuration**: Controlled cross-origin access

## Deployment

### Production Deployment

1. Build the frontend:
   ```bash
   npm run build:frontend
   ```

2. Set environment variables:
   ```bash
   export NODE_ENV=production
   export PORT=3000
   ```

3. Start the server:
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

*Not added to this code base. Please add the following code if docker deployment is getting considered*

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production

COPY . .
RUN npm run build:frontend

EXPOSE 3000

CMD ["npm", "start"]
```

##  Troubleshooting

### Common Issues

**Database Connection Errors**
- Ensure the `data/` directory has write permissions
- Check if SQLite is properly installed

**Frontend Build Issues**
- Clear node_modules and reinstall dependencies
- Check TypeScript compilation errors

**API Connection Issues**
- Verify the backend server is running on port 3000
- Check CORS configuration for cross-origin requests

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm run dev
```

##  License

This project is licensed under the MIT License - see the LICENSE file for details.

##  Support

For support and questions:
- Check the API documentation at `/api/docs`
- Review the troubleshooting section above
- Create an issue in the repository

##  Version History

- **v1.0.0** - Initial release with full CRUD functionality
  - Task management with status tracking
  - GOV.UK Design System integration
  - Comprehensive API with validation
  - Unit test coverage
  - Responsive design

---

