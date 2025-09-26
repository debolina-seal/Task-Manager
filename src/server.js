const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const Database = require('./database/database');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Middleware to provide database instance to routes
app.use('/api/tasks', (req, res, next) => {
  req.db = db;
  next();
});

// API Routes
app.use('/api/tasks', tasksRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HMCTS Task Manager API is running',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      title: 'HMCTS Task Manager API',
      version: '1.0.0',
      endpoints: {
        'GET /api/health': 'Health check',
        'GET /api/tasks': 'Get all tasks',
        'GET /api/tasks/:id': 'Get task by ID',
        'POST /api/tasks': 'Create new task',
        'PUT /api/tasks/:id': 'Update entire task',
        'PATCH /api/tasks/:id/status': 'Update task status only',
        'DELETE /api/tasks/:id': 'Delete task'
      },
      taskSchema: {
        id: 'integer (auto-generated)',
        title: 'string (required, max 255 chars)',
        description: 'string (optional, max 1000 chars)',
        status: 'enum: pending|in_progress|completed|cancelled',
        due_date: 'ISO 8601 datetime string',
        created_at: 'datetime (auto-generated)',
        updated_at: 'datetime (auto-updated)'
      }
    }
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  const frontendPath = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.status(404).json({
      success: false,
      error: 'Frontend not built. Please run "npm run build:frontend" first.'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await db.close();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize database connection
    await db.connect();
    
    app.listen(PORT, () => {
      console.log(` HMCTS Task Manager API running on port ${PORT}`);
      console.log(` API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
