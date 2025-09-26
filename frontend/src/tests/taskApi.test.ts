import { taskApi } from '../api/taskApi';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task';

describe('TaskApi', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = fetch as jest.Mock;
    mockFetch.mockClear();
  });

  describe('getAllTasks', () => {
    test('should fetch all tasks successfully', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Test Task',
          description: 'Test description',
          status: 'pending',
          due_date: '2024-12-31T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      const mockResponse = {
        success: true,
        data: mockTasks,
        count: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await taskApi.getAllTasks();

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks', {
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
    });

    test('should handle API errors', async () => {
      const mockError = {
        success: false,
        error: 'Server error'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockError
      });

      await expect(taskApi.getAllTasks()).rejects.toThrow('Server error');
    });
  });

  describe('getTaskById', () => {
    test('should fetch task by ID successfully', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        status: 'pending',
        due_date: '2024-12-31T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        data: mockTask
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await taskApi.getTaskById(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', {
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result.data).toEqual(mockTask);
    });

    test('should handle task not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: 'Task not found' })
      });

      await expect(taskApi.getTaskById(999)).rejects.toThrow('Task not found');
    });
  });

  describe('createTask', () => {
    test('should create task successfully', async () => {
      const newTask: CreateTaskRequest = {
        title: 'New Task',
        description: 'New description',
        status: 'pending',
        due_date: '2024-12-31T00:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        data: { id: 1, ...newTask, created_at: '2024-01-01T00:00:00.000Z', updated_at: '2024-01-01T00:00:00.000Z' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await taskApi.createTask(newTask);

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe(newTask.title);
    });

    test('should handle validation errors', async () => {
      const invalidTask: CreateTaskRequest = {
        title: '',
        status: 'pending',
        due_date: '2024-12-31T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Validation failed' })
      });

      await expect(taskApi.createTask(invalidTask)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateTask', () => {
    test('should update task successfully', async () => {
      const updates: UpdateTaskRequest = {
        title: 'Updated Task',
        status: 'completed'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          title: 'Updated Task',
          status: 'completed',
          due_date: '2024-12-31T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T12:00:00.000Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await taskApi.updateTask(1, updates);

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      expect(result.data?.title).toBe('Updated Task');
    });
  });

  describe('updateTaskStatus', () => {
    test('should update task status successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          title: 'Test Task',
          status: 'completed',
          due_date: '2024-12-31T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T12:00:00.000Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await taskApi.updateTaskStatus(1, 'completed');

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      expect(result.data?.status).toBe('completed');
    });
  });

  describe('deleteTask', () => {
    test('should delete task successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Task deleted successfully'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await taskApi.deleteTask(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('healthCheck', () => {
    test('should perform health check successfully', async () => {
      const mockResponse = {
        success: true,
        data: { status: 'healthy' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await taskApi.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(taskApi.getAllTasks()).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith('API request failed:', expect.any(Error));
    });

    test('should handle HTTP errors without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      await expect(taskApi.getAllTasks()).rejects.toThrow('HTTP error! status: 500');
    });
  });
});
