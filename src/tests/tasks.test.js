const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('../database/database');
const tasksRouter = require('../routes/tasks');

//Set Node environment to test to ensure in-memory db is used
process.env.NODE_ENV = 'test';

// Create test app
const app = express();
app.use(express.json());

// Initialize database for tests
let db;

beforeAll(async () => {
  // Ensure test data directory exists
  const testDataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  db = new Database();
  await db.connect();
  
  // Make database available to routes
  app.use((req, res, next) => {
    req.db = db;
    next();
  });
  
  app.use('/api/tasks', tasksRouter);
});

afterAll(async () => {
  if (db) {
    await db.close();
  }
});

describe('Tasks API', () => {
  let testTaskId;

  beforeEach(async () => {
    // Clean up tasks table before each test
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM tasks', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('POST /api/tasks', () => {
    test('should create a new task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.status).toBe(taskData.status);
      expect(response.body.data.id).toBeDefined();

      testTaskId = response.body.data.id;
    });

    test('should create a task without description', async () => {
      const taskData = {
        title: 'Task Without Description',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBeNull();
    });

    test('should reject task with missing title', async () => {
      const taskData = {
        description: 'Test Description',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject task with invalid status', async () => {
      const taskData = {
        title: 'Test Task',
        status: 'invalid_status',
        due_date: '2024-12-31T23:59:59.000Z'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject task with invalid due_date', async () => {
      const taskData = {
        title: 'Test Task',
        status: 'pending',
        due_date: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await db.createTask({
        title: 'Task 1',
        description: 'Description 1',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      });
      await db.createTask({
        title: 'Task 2',
        status: 'in_progress',
        due_date: '2024-11-30T23:59:59.000Z'
      });
    });

    test('should return all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    beforeEach(async () => {
      const task = await db.createTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      });
      testTaskId = task.id;
    });

    test('should return task by valid ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTaskId);
      expect(response.body.data.title).toBe('Test Task');
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    beforeEach(async () => {
      const task = await db.createTask({
        title: 'Original Task',
        description: 'Original Description',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      });
      testTaskId = task.id;
    });

    test('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/99999')
        .send({ title: 'Updated Task' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    beforeEach(async () => {
      const task = await db.createTask({
        title: 'Test Task',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      });
      testTaskId = task.id;
    });

    test('should update task status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${testTaskId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    test('should reject invalid status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${testTaskId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    beforeEach(async () => {
      const task = await db.createTask({
        title: 'Task to Delete',
        status: 'pending',
        due_date: '2024-12-31T23:59:59.000Z'
      });
      testTaskId = task.id;
    });

    test('should delete existing task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');

      // Verify task is deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(404);
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });
});
