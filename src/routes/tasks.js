const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Database = require('../database/database');

const router = express.Router();

// Database instance will be provided by the server
let db;

// Validation middleware
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('status')
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
  body('due_date')
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
];

const validateTaskUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Middleware to get database instance
router.use((req, res, next) => {
  db = req.db;
  next();
});

// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await db.getAllTasks();
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: error.message
    });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    const task = await db.getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      message: error.message
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', validateTask, handleValidationErrors, async (req, res) => {
  try {
    const { title, description, status, due_date } = req.body;
    
    const task = await db.createTask({
      title,
      description,
      status,
      due_date
    });
    
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: error.message
    });
  }
});

// PUT /api/tasks/:id - Update entire task
router.put('/:id', validateId, validateTaskUpdate, handleValidationErrors, async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['title', 'description', 'status', 'due_date'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }
    
    const task = await db.updateTask(req.params.id, updates);
    
    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      message: error.message
    });
  }
});

// PATCH /api/tasks/:id/status - Update task status only
router.patch('/:id/status', validateId, handleValidationErrors, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (pending, in_progress, completed, cancelled)'
      });
    }
    
    const task = await db.updateTaskStatus(req.params.id, status);
    
    res.json({
      success: true,
      data: task,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    
    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update task status',
      message: error.message
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', validateId, handleValidationErrors, async (req, res) => {
  try {
    await db.deleteTask(req.params.id);
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    
    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      message: error.message
    });
  }
});

module.exports = router;
