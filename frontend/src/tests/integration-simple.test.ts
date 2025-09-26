import { Router } from '../router';
import { Task } from '../types/task';
import { TaskManager } from '../main';

// Simple integration tests focusing on API integration
describe('API Integration Tests', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = fetch as jest.Mock;
    mockFetch.mockClear();
  });

  describe('Task Creation Integration', () => {
    test('should create task via API', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        status: 'pending',
        due_date: '2024-12-31T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTask })
      });

      const { taskApi } = await import('../api/taskApi');
      const result = await taskApi.createTask({
        title: 'Test Task',
        description: 'Test description',
        status: 'pending',
        due_date: '2024-12-31T00:00:00.000Z'
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Task');
    });
  });

  describe('Task Update Integration', () => {
    test('should update task via API', async () => {
      const updatedTask: Task = {
        id: 1,
        title: 'Updated Task',
        description: 'Updated description',
        status: 'completed',
        due_date: '2024-12-31T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedTask })
      });

      const { taskApi } = await import('../api/taskApi');
      const result = await taskApi.updateTask(1, {
        title: 'Updated Task',
        status: 'completed'
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Task');
    });
  });

  describe('Task Deletion Integration', () => {
    test('should delete task via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Task deleted' })
      });

      const { taskApi } = await import('../api/taskApi');
      const result = await taskApi.deleteTask(1);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Validation failed' })
      });

      const { taskApi } = await import('../api/taskApi');
      
      await expect(taskApi.createTask({
        title: '',
        status: 'pending',
        due_date: '2024-12-31T00:00:00.000Z'
      })).rejects.toThrow('Validation failed');
    });
  });
});

describe('Router Integration Tests', () => {
  let router: Router;
  let mockPageHandler: jest.Mock;

  beforeEach(() => {
    mockPageHandler = jest.fn();
    router = new Router(mockPageHandler);
  });

  test('should handle basic navigation', () => {
    // Router starts on home page, so navigate away first then back
    router.navigateTo('/create');
    expect(mockPageHandler).toHaveBeenCalledWith('create');

    router.navigateTo('/');
    expect(mockPageHandler).toHaveBeenCalledWith('home');
  });
});
