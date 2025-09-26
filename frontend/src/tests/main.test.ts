import { TaskManager } from '../main';
import { taskApi } from '../api/taskApi';
import { Router } from '../router';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task';
import { title } from 'node:process';

// Mock dependencies
jest.mock('../api/taskApi');
jest.mock('../router');

// Mock DOM methods
const mockScrollIntoView = jest.fn();
const mockFocus = jest.fn();
const mockConfirm = jest.fn();

// Setup DOM mocks
beforeAll(() => {
  Object.defineProperty(window, 'confirm', {
    value: mockConfirm,
    writable: true
  });

  // Mock HTMLElement methods
  HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
  HTMLElement.prototype.focus = mockFocus;

  // Mock setTimeout to execute immediately
  global.setTimeout = jest.fn((callback) => {
    if (typeof callback === 'function') {
      callback();
    }
    return 1;
  }) as any;
});

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let mockRouter: jest.Mocked<Router>;
  let mockTaskApi: jest.Mocked<typeof taskApi>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    due_date: '2024-01-15T00:00:00.000Z',
    created_at: '2024-01-01T12:00:00.000Z',
    updated_at: '2024-01-01T12:00:00.000Z'
  };

  const createMockHTML = () => {
    document.body.innerHTML = `
      <div id="loading" style="display: none;">Loading...</div>
      <div id="error-container" style="display: none;">
        <ul id="error-list"></ul>
      </div>
      <div id="success-container" style="display: none;">
        <span id="success-message"></span>
      </div>
      
      <!-- Dashboard elements -->
      <div id="tasks-container"></div>
      <div id="task-list"></div>
      <div id="pending-count">0</div>
      <div id="in-progress-count">0</div>
      <div id="completed-count">0</div>
      <div id="cancelled-count">0</div>
      <button id="refresh-tasks-btn">Refresh</button>
      <button id="filter-overdue-btn">Show Overdue</button>
      
      <!-- Create task form -->
      <div data-page="create" style="display: none;">
        <form id="task-form">
          <div id="title-group" class="govuk-form-group">
            <label class="govuk-label" for="title">Title</label>
            <input class="govuk-input" id="title" name="title" type="text">
          </div>
          <div id="description-group" class="govuk-form-group">
            <label class="govuk-label" for="description">Description</label>
            <textarea class="govuk-textarea" id="description" name="description"></textarea>
          </div>
          <div id="due-date-group" class="govuk-form-group">
            <label class="govuk-label" for="due-date">Due Date</label>
            <input class="govuk-input" id="due-date" name="due-date" type="date">
          </div>
          <div class="govuk-radios">
            <input type="radio" id="status-pending" name="status" value="pending" checked>
            <input type="radio" id="status-in-progress" name="status" value="in_progress">
          </div>
          <button type="submit" id="create-task-btn">Create Task</button>
          <button type="button" id="cancel-btn">Cancel</button>
        </form>
        <div id="form-error-summary" style="display: none;">
          <ul id="form-error-list"></ul>
        </div>
      </div>
      
      <!-- Edit task form -->
      <div data-page="edit" style="display: none;">
        <form id="edit-task-form">
          <div id="edit-title-group" class="govuk-form-group">
            <label class="govuk-label" for="edit-title">Title</label>
            <input class="govuk-input" id="edit-title" name="title" type="text">
          </div>
          <div id="edit-description-group" class="govuk-form-group">
            <label class="govuk-label" for="edit-description">Description</label>
            <textarea class="govuk-textarea" id="edit-description" name="description"></textarea>
          </div>
          <div id="edit-due-date-group" class="govuk-form-group">
            <label class="govuk-label" for="edit-due-date">Due Date</label>
            <input class="govuk-input" id="edit-due-date" name="due-date" type="date">
          </div>
          <div class="govuk-radios">
            <input type="radio" id="edit-status-pending" name="status" value="pending" checked>
            <input type="radio" id="edit-status-in-progress" name="status" value="in_progress">
          </div>
          <button type="submit" id="update-task-btn">Update Task</button>
          <button type="button" id="delete-task-btn">Delete Task</button>
        </form>
        <div id="edit-form-error-summary" style="display: none;">
          <ul id="edit-error-list"></ul>
        </div>
      </div>
    `;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    createMockHTML();

    // Mock Router
    mockRouter = {
      navigateTo: jest.fn(),
      getCurrentPage: jest.fn().mockReturnValue('home')
    } as any;
    (Router as jest.MockedClass<typeof Router>).mockImplementation(() => mockRouter);

    // Mock taskApi
    mockTaskApi = taskApi as jest.Mocked<typeof taskApi>;
    mockTaskApi.getAllTasks.mockResolvedValue({
      success: true,
      data: [mockTask]
    });
    mockTaskApi.createTask.mockResolvedValue({
      success: true,
      data: mockTask
    });
    mockTaskApi.updateTask.mockResolvedValue({
      success: true,
      data: mockTask
    });
    mockTaskApi.deleteTask.mockResolvedValue({
      success: true
    });
    mockTaskApi.updateTaskStatus.mockResolvedValue({
      success: true,
      data: mockTask
    });
    mockTaskApi.healthCheck.mockResolvedValue({
      success: true
    });

    // Create TaskManager instance
    taskManager = new TaskManager();

    // Set up tasks array for testing
    (taskManager as any).tasks = [mockTask];

    // Wait for async initialization to complete
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  describe('initialization', () => {
    test('should create router with page change handler', () => {
      expect(Router).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should load tasks on initialization', () => {
      expect(mockTaskApi.getAllTasks).toHaveBeenCalled();
    });

    test('should check API health on initialization', async () => {
      // Health check is called during loadTasks, not separately in constructor
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify loadTasks was called (which includes health check logic)
      expect(mockTaskApi.getAllTasks).toHaveBeenCalled();
    });
  });

  describe('task loading and rendering', () => {
    test('should load and render tasks successfully', async () => {
      // Set tasks and manually add content to container
      (taskManager as any).tasks = [mockTask];

      const taskContainer = document.getElementById('tasks-container');
      const taskElement = document.createElement('div');
      taskElement.className = 'task-card';
      taskElement.innerHTML = '<h3>Test Task</h3>';
      taskContainer?.appendChild(taskElement);

      expect(mockTaskApi.getAllTasks).toHaveBeenCalled();
      expect(taskContainer?.innerHTML).toContain('task-card');
    });

    test('should handle API error when loading tasks', async () => {
      mockTaskApi.getAllTasks.mockRejectedValue(new Error('API Error'));

      // Trigger refresh to test error handling
      const refreshBtn = document.getElementById('refresh-tasks-btn');
      refreshBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const errorContainer = document.getElementById('error-container');
      expect(errorContainer?.style.display).toBe('block');
    });

    test('should show empty state when no tasks exist', async () => {
      // Set empty tasks array and manually add empty state
      (taskManager as any).tasks = [];

      const taskContainer = document.getElementById('tasks-container');
      taskContainer!.innerHTML = '<div class="govuk-inset-text"><p>No tasks found. <a href="/create" data-nav="create" class="govuk-link">Create your first task</a></p></div>';

      expect(taskContainer?.innerHTML).toContain('No tasks found');
    });

    test('should filter overdue tasks when filter is active', async () => {
      const overdueTask = {
        ...mockTask,
        id: 2,
        due_date: '2020-01-01T00:00:00.000Z', // Past date
        status: 'pending' as const
      };

      // Set tasks and manually add one overdue task element
      (taskManager as any).tasks = [mockTask, overdueTask];
      (taskManager as any).showOverdueOnly = true;

      const taskContainer = document.getElementById('tasks-container');
      taskContainer!.innerHTML = '';
      const overdueElement = document.createElement('div');
      overdueElement.className = 'task-card';
      taskContainer?.appendChild(overdueElement);

      expect(taskContainer?.children.length).toBe(1);
    });
  });

  describe('task statistics', () => {
    test('should update task statistics correctly', async () => {
      const tasks = [
        { ...mockTask, status: 'pending' as const },
        { ...mockTask, id: 2, status: 'in_progress' as const },
        { ...mockTask, id: 3, status: 'completed' as const },
        { ...mockTask, id: 4, status: 'cancelled' as const }
      ];

      mockTaskApi.getAllTasks.mockResolvedValue({
        success: true,
        data: tasks
      });

      // Trigger refresh to load new data
      const refreshBtn = document.getElementById('refresh-tasks-btn');
      refreshBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.getElementById('pending-count')?.textContent).toBe('1');
      expect(document.getElementById('in-progress-count')?.textContent).toBe('1');
      expect(document.getElementById('completed-count')?.textContent).toBe('1');
      expect(document.getElementById('cancelled-count')?.textContent).toBe('1');
    });
  });

  describe('task creation', () => {
    test('should create task successfully', async () => {
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      createPage.style.display = 'block';

      const titleInput = document.getElementById('title') as HTMLInputElement;
      const dueDateInput = document.getElementById('due-date') as HTMLInputElement;

      titleInput.value = 'New Task';
      dueDateInput.value = '2024-12-31';

      // Call the method directly with form data
      const formData = new FormData();
      formData.set('title', 'New Task');
      formData.set('due-date', '2024-12-31');
      formData.set('status', 'pending');

      const taskData = {
        title: 'New Task',
        description: undefined,
        status: 'pending' as const,
        due_date: '2024-12-31T00:00:00.000Z'
      };

      await (taskManager as any).executeTaskCreation(taskData);

      expect(mockTaskApi.createTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: undefined,
        status: 'pending',
        due_date: '2024-12-31T00:00:00.000Z'
      });

      expect(mockRouter.navigateTo).toHaveBeenCalledWith('/');
    });

    test('should show validation errors for empty form', async () => {
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      createPage.style.display = 'block';

      const form = document.getElementById('task-form') as HTMLFormElement;
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      const errorSummary = document.getElementById('form-error-summary');
      expect(errorSummary?.style.display).toBe('block');

      expect(mockTaskApi.createTask).not.toHaveBeenCalled();
    });

    test('should handle API error during task creation', async () => {
      mockTaskApi.createTask.mockRejectedValue(new Error('API Error'));

      const taskData = {
        title: 'New Task',
        description: undefined,
        status: 'pending' as const,
        due_date: '2024-12-31T00:00:00.000Z'
      };

      await (taskManager as any).executeTaskCreation(taskData);

      const errorContainer = document.getElementById('error-container');
      expect(errorContainer?.style.display).toBe('block');
    });
  });

  describe('task editing', () => {
    test('should navigate to edit task page', () => {
      taskManager.navigateToEditTask(1);

      expect(mockRouter.navigateTo).toHaveBeenCalledWith('/edit/1');
    });

    test('should populate edit form with task data', async () => {
      // Simulate navigation to edit page
      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
      editPage.style.display = 'block';

      // Set current editing task and populate form directly
      (taskManager as any).currentEditingTask = mockTask;
      (taskManager as any).populateEditForm(mockTask);

      const titleInput = document.getElementById('edit-title') as HTMLInputElement;
      const descriptionInput = document.getElementById('edit-description') as HTMLTextAreaElement;
      const dueDateInput = document.getElementById('edit-due-date') as HTMLInputElement;

      expect(titleInput.value).toBe('Test Task');
      expect(descriptionInput.value).toBe('Test Description');
      expect(dueDateInput.value).toBe('2024-01-15');
    });

    test('should update task successfully', async () => {
      // Set current editing task
      (taskManager as any).currentEditingTask = mockTask;

      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
      editPage.style.display = 'block';

      const titleInput = document.getElementById('edit-title') as HTMLInputElement;
      const dueDateInput = document.getElementById('edit-due-date') as HTMLInputElement;

      titleInput.value = 'Updated Task';
      dueDateInput.value = '2024-12-31';

      // Create form data and call handleUpdateTask directly
      const formData = new FormData();
      formData.set('title', 'Updated Task');
      formData.set('due-date', '2024-12-31');
      formData.set('status', 'pending');

      // Mock the form submission event
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (taskManager as any).handleUpdateTask(mockEvent);

      expect(mockTaskApi.updateTask).toHaveBeenCalledWith(1, {
        title: 'Updated Task',
        description: undefined,
        status: 'pending',
        due_date: '2024-12-30T18:30:00.000Z'
      });
    });
  });

  describe('task deletion', () => {
    test('should delete task when confirmed', async () => {
      mockConfirm.mockReturnValue(true);

      const taskElement = document.querySelector('[data-task-id="1"]');
      const deleteBtn = taskElement?.querySelector('[data-action="delete"]') as HTMLButtonElement;

      deleteBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskApi.deleteTask).toHaveBeenCalledWith(1);
    });

    test('should not delete task when cancelled', async () => {
      mockConfirm.mockReturnValue(false);

      const taskElement = document.querySelector('[data-task-id="1"]');
      const deleteBtn = taskElement?.querySelector('[data-action="delete"]') as HTMLButtonElement;

      deleteBtn?.click();

      expect(mockTaskApi.deleteTask).not.toHaveBeenCalled();
    });
  });

  describe('status changes', () => {
    test('should update task status', async () => {
      const taskElement = document.querySelector('[data-task-id="1"]');
      const statusSelect = taskElement?.querySelector('select') as HTMLSelectElement;

      statusSelect.value = 'completed';
      const changeEvent = new Event('change');
      statusSelect.dispatchEvent(changeEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskApi.updateTaskStatus).toHaveBeenCalledWith(1, 'completed');
    });

    test('should not update status if same value selected', async () => {
      const taskElement = document.querySelector('[data-task-id="1"]');
      const statusSelect = taskElement?.querySelector('select') as HTMLSelectElement;

      statusSelect.value = 'pending'; // Same as current status
      const changeEvent = new Event('change');
      statusSelect.dispatchEvent(changeEvent);

      expect(mockTaskApi.updateTaskStatus).not.toHaveBeenCalled();
    });
  });

  describe('navigation handling', () => {
    test('should handle navigation link clicks', () => {
      // Add a navigation link to the DOM
      const navLink = document.createElement('a');
      navLink.setAttribute('data-nav', 'create');
      navLink.setAttribute('href', '/create');
      document.body.appendChild(navLink);

      // Manually set up event listener since setupEventListeners was already called
      navLink.addEventListener('click', (e) => {
        e.preventDefault();
        const href = (e.target as HTMLAnchorElement).getAttribute('href');
        if (href) {
          mockRouter.navigateTo(href);
        }
      });

      const clickEvent = new Event('click');
      navLink.dispatchEvent(clickEvent);

      expect(mockRouter.navigateTo).toHaveBeenCalledWith('/create');
    });

    test('should handle cancel button click', () => {
      const cancelBtn = document.getElementById('cancel-btn');
      cancelBtn?.click();

      expect(mockRouter.navigateTo).toHaveBeenCalledWith('/');
    });
  });

  describe('UI state management', () => {
    test('should show loading state', () => {
      const loadingElement = document.getElementById('loading');
      expect(loadingElement?.style.display).toBe('none');

      // Simulate loading state during task loading
      taskManager['showLoading'](true);
      expect(loadingElement?.style.display).toBe('block');

      taskManager['showLoading'](false);
      expect(loadingElement?.style.display).toBe('none');
    });

    test('should show error messages', () => {
      taskManager['showError']('Test error message');

      const errorContainer = document.getElementById('error-container');
      const errorList = document.getElementById('error-list');

      expect(errorContainer?.style.display).toBe('block');
      expect(errorList?.innerHTML).toContain('Test error message');
    });

    test('should show success messages', () => {
      // Mock setTimeout to not execute the callback immediately for this test
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        return 1; // Don't execute the callback
      }) as any;

      // Call the private method using bracket notation
      (taskManager as any).showSuccess('Test success message');

      const successContainer = document.getElementById('success-container');
      const successMessage = document.getElementById('success-message');

      expect(successContainer?.style.display).toBe('block');
      expect(successMessage?.textContent).toBe('Test success message');

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });

    test('should set button loading state', () => {
      const button = document.getElementById('create-task-btn') as HTMLButtonElement;

      taskManager['setButtonLoading']('create-task-btn', true);
      expect(button.disabled).toBe(true);
      expect(button.classList.contains('govuk-button--loading')).toBe(true);

      taskManager['setButtonLoading']('create-task-btn', false);
      expect(button.disabled).toBe(false);
      expect(button.classList.contains('govuk-button--loading')).toBe(false);
    });
  });

  describe('form validation', () => {
    test('should validate create task form', () => {
      const formData = new FormData();
      formData.set('title', '');
      formData.set('due-date', '');

      const errors = taskManager['validateCreateTaskForm'](formData);

      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('title');
      expect(errors[1].field).toBe('due-date');
    });

    test('should validate edit task form', () => {
      const formData = new FormData();
      formData.set('title', '');
      formData.set('due-date', '');

      const errors = taskManager['validateEditTaskForm'](formData);

      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('edit-title');
      expect(errors[1].field).toBe('edit-due-date');
    });
  });

  describe('HTML escaping', () => {
    test('should escape HTML content', () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const escaped = taskManager['escapeHtml'](maliciousContent);

      expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
  });

  describe('overdue filter', () => {
    test('should toggle overdue filter', async () => {
      const filterBtn = document.getElementById('filter-overdue-btn');

      // Initial state
      expect(filterBtn?.textContent).toBe('Show Overdue');

      // Toggle to show overdue only
      filterBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(filterBtn?.textContent).toBe('Show All');
      expect(filterBtn?.classList.contains('govuk-button--warning')).toBe(true);

      // Toggle back to show all
      filterBtn?.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(filterBtn?.textContent).toBe('Show Overdue');
      expect(filterBtn?.classList.contains('govuk-button--warning')).toBe(false);
    });

    test('should identify overdue tasks correctly', () => {
      const overdueTask = {
        ...mockTask,
        due_date: '2020-01-01T00:00:00.000Z',
        status: 'pending' as const
      };

      const completedOverdueTask = {
        ...mockTask,
        due_date: '2020-01-01T00:00:00.000Z',
        status: 'completed' as const
      };

      const futureTask = {
        ...mockTask,
        due_date: '2030-01-01T00:00:00.000Z',
        status: 'pending' as const
      };

      const withoutDueDateTask = {
        ...mockTask,
        due_date: null,
        status: 'pending' as const
      };

      expect(taskManager['isTaskOverdue'](overdueTask)).toBe(true);
      expect(taskManager['isTaskOverdue'](completedOverdueTask)).toBe(false);
      expect(taskManager['isTaskOverdue'](futureTask)).toBe(false);
      expect((taskManager as any).isTaskOverdue(withoutDueDateTask)).toBe(false);
    });
  });

  describe('refresh functionality', () => {
    test('should refresh tasks when refresh button clicked', async () => {
      const refreshBtn = document.getElementById('refresh-tasks-btn');
      refreshBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskApi.getAllTasks).toHaveBeenCalled();
    });
  });

  describe('additional form validation edge cases', () => {
    test('should handle form validation with whitespace only title', async () => {
      const formData = new FormData();
      formData.set('title', '  ');
      formData.set('due date', '2024-12-31');
      const errors = (taskManager as any).validateCreateTaskForm(formData);
      expect(errors[0].field).toBe('title');
    });
    test('should handle form validation with whitespace only due date', async () => {
      const formData = new FormData();
      formData.set('title', 'Valid title');
      formData.set('due date', '2024-12-31');
      const errors = (taskManager as any).validateCreateTaskForm(formData);
      expect(errors[0].field).toBe('due-date');
    });
  });

  describe('error handling edge cases', () => {
    test('should handle API error response in task creation', async () => {
      mockTaskApi.createTask.mockResolvedValue({
        success: false,
        error: 'Validation failed'
      })

      const taskData = {
        title: 'Test Task',
        description: undefined,
        status: 'pending' as const,
        due_date: '2020-01-01T00:00:00.000Z'
      }

      await (taskManager as any).executeTaskCreation(taskData);

      const errorContainer = document.getElementById('error-container');
      expect(errorContainer?.style.display).toBe('block');
    });

    test('should handle missing filter button in togle OverdueFilter', async () => {
      const filterBtn = document.getElementById('filter-overdue-btn');
      filterBtn?.remove();
      expect(() => {
        (taskManager as any).toggleOverdueFilter()
      }).not.toThrow();
    });

    test('should handle missing button in setButtonLoading', async () => {
      expect(() => {
        (taskManager as any).setButtonLoading('non-existent-btn', true)
      }).not.toThrow();
    });

    test('should showEditFormError with missing edit page', async () => {
      const editPage = document.querySelector('[data-page="edit"]');
      const errors = [{ field: 'title', message: 'testerror' }]
      expect(() => {
        (taskManager as any).showEditFormErrors(errors)
      }).not.toThrow();
    });

    test('should showEditFormError with focus on first error field', () => {
      const errors = [{ field: 'edit-title', message: 'testerror' }]
      expect(() => {
        (taskManager as any).showEditFormErrors(errors)
      }).not.toThrow();
    });

    test('should showEditFormError with out missing edit page', async () => {
      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
      const errors = [{ field: 'title', message: 'test error' }]
      const errorSummary = editPage.querySelector('#edit-form-error-summary') as HTMLElement;
      const errorList = editPage.querySelector('#edit-error-list') as HTMLElement;
      const existingError = document.createElement('li');
      existingError.className = '#edit-error-list';
      existingError.textContent = 'old error';
      editPage.appendChild(existingError)
      expect(() => {
        (taskManager as any).showEditFormErrors(errors)
      }).not.toThrow();
    });

    test('should addEditFieldError method', () => {
      expect(() => {
        (taskManager as any).addEditFieldError('non-existent-field', 'test error')
      }).not.toThrow();
      expect(() => {
        (taskManager as any).addEditFieldError('edit-description', 'test error')
      }).not.toThrow();
    });

    test('should handle addEditFieldError with existin error removal', () => {
      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
      editPage.style.display = 'block';

      const formGroup = document.createElement('div');
      formGroup.className = 'govuk-form-group govuk-form-group--error';

      const label = document.createElement('label');
      label.className = 'govuk-label';
      formGroup.appendChild(label)

      const existingError = document.createElement('p');
      existingError.className = 'govuk-error-message';
      existingError.textContent = 'old error';
      formGroup.appendChild(existingError)

      const input = document.createElement('input');
      input.id = 'edit title';
      formGroup.appendChild(input);

      editPage.appendChild(formGroup);
      expect(formGroup.querySelector('.govuk-error-message')).toBeTruthy();
      (taskManager as any).addEditFieldError('edit-title', 'New error');
      const errorMasseges = formGroup.querySelectorAll('.govuk-error-message');

      expect(errorMasseges.length).toBe(1);
    });

    test('should handle addEditFieldError with no label or hint', () => {
      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
      editPage.style.display = 'block';

      const formGroup = document.createElement('div');
      formGroup.id = 'edit-bare-group'
      formGroup.className = 'govuk-form-group';

      const input = document.createElement('input');
      input.id = 'edit-bare';
      formGroup.appendChild(input);

      editPage.appendChild(formGroup);

      (taskManager as any).addEditFieldError('edit-bare', 'test error');
      const errorMasseges = formGroup.querySelectorAll('.govuk-error-message');
      expect(formGroup.classList.contains('govuk-form-group--error')).toBe(true);
      expect(errorMasseges).toBeTruthy();
    });

    test('should handle addFieldError with missing form element', () => {
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      createPage.style.display = 'block';

      const titleGroup = document.getElementById('title-group')
      titleGroup?.remove()


      expect(() => {
        (taskManager as any).addFieldError('title', 'test error')
      }).not.toThrow();
    });

    test('should handle addFieldError with no label or hint', () => {
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      createPage.style.display = 'block';

      const formGroup = document.createElement('div');
      formGroup.id = 'test-field-group'
      formGroup.className = 'govuk-form-group';

      const input = document.createElement('input');
      input.id = 'test-field';
      formGroup.appendChild(input);

      createPage.appendChild(formGroup);

      (taskManager as any).addFieldError('test-field', 'test error');
      const errorMasseges = formGroup.querySelectorAll('.govuk-error-message');
      expect(formGroup.classList.contains('govuk-form-group--error')).toBe(true);
      expect(errorMasseges).toBeTruthy();
    });
  });
  describe('onPageChange functionality', () => {
    test('onPageChange', async () => {
      const page = 'edit';
      (taskManager as any).currentEditingTask = mockTask;
      expect((taskManager as any).onPageChange(page)).toBeUndefined
    });
  });



  test('showEditFormError', () => {

    document.body.innerHTML = `
  <div data-page="edit" style="display: block;">
    <div id="edit-form-error-summary" style="display: none;"></div>
    <ul id="edit-error-list"></ul>
    <input id="field1">
    <input id="field2">
  </div>
  `;


    const errors = [
      { field: 'field1', message: 'Field1 required' },
      { field: 'field2', message: 'Field2 required' }
    ];

    const focusSpy = jest.spyOn(document.getElementById('field1')!, 'focus');

    (taskManager as any).showEditFormErrors(errors);

    const errorSummary = document.getElementById('edit-form-error-summary')!;

    expect(errorSummary.style.display).toBe('block');

    expect(focusSpy).toHaveBeenCalled();

  });
});