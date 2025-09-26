import './styles/main.scss';
import { Task, CreateTaskRequest, UpdateTaskRequest } from './types/task';
import { taskApi } from './api/taskApi';
import { formatDateTimeForInput } from './utils/dateUtils';
import { Router, PageName } from './router';

// Initialize GOV.UK Frontend
declare global {
  interface Window {
    GOVUKFrontend: any;
  }
}

export class TaskManager {
  private tasks: Task[] = [];
  private router: Router;
  private showOverdueOnly: boolean = false;
  private currentEditingTask: Task | null = null;

  constructor() {
    this.router = new Router((page) => this.onPageChange(page));
    this.setupEventListeners();
    this.loadTasks();
  }

  private onPageChange(page: PageName): void {
    if (page === 'edit') {
      // Extract task ID from URL and populate edit form
      const path = window.location.pathname;
      const taskId = path.split('/')[2];
      if (taskId && this.currentEditingTask) {
        this.populateEditForm(this.currentEditingTask);
      }
    }
  }

  // private async initializeApp(): Promise<void> {
  //   // Initialize GOV.UK Frontend components
  //   if (window.GOVUKFrontend) {
  //     window.GOVUKFrontend.initAll();
  //   }

  //   this.setupEventListeners();
  //   await this.loadTasks();
    
  //   // Check API health
  //   this.checkApiHealth();
  // }

  // private handlePageChange(page: PageName): void {
  //   // Update task statistics when on home page
  //   if (page === 'home') {
  //     this.updateTaskStatistics();
  //   }
    
  //   // Clear form when navigating to create page
  //   if (page === 'create') {
  //     this.resetCreateForm();
  //     // Re-setup form event listeners when navigating to create page
  //     setTimeout(() => {
  //       console.log('Page changed to create, setting up form listeners');
  //       this.setupFormEventListeners();
  //     }, 100);
  //   }
  // }

  private setupEventListeners(): void {
    // Navigation links (including logo and buttons)
    const navLinks = document.querySelectorAll('[data-nav]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = (e.target as HTMLAnchorElement).getAttribute('href');
        if (href) {
          this.router.navigateTo(href);
        }
      });
    });

    // Set up form event listeners with a slight delay to ensure DOM is ready
    setTimeout(() => {
      this.setupFormEventListeners();
    }, 100);
    
    // Use event delegation for form submission to catch dynamically loaded forms
    document.addEventListener('submit', (e) => {
      const target = e.target as HTMLElement;
      console.log('Submit event detected on:', target.id, target.tagName);
      if (target.id === 'task-form') {
        console.log('Task form submission caught via delegation');
        e.preventDefault();
        this.handleCreateTask(e);
      }
    });

    // Also listen for button clicks on the submit button
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      console.log('Click detected on:', target.id, target.tagName, target.className);
      
      // Handle create task button
      if (target.id === 'submit-task-btn' || target.id === 'create-task-btn' || (target as HTMLInputElement).type === 'submit') {
        console.log('Submit button clicked:', target.id);
        const form = target.closest('form');
        if (form && form.id === 'task-form') {
          console.log('Found task form, preventing default and handling submission');
          e.preventDefault();
          // Get form data and validate directly
          const form = document.getElementById('task-form') as HTMLFormElement;
          if (form) {
            const formData = new FormData(form);
            this.clearFormErrors();
            const errors = this.validateCreateTaskForm(formData);
            if (errors.length > 0) {
              this.showFormErrors(errors);
            } else {
              // No errors, proceed with task creation
              const taskData: CreateTaskRequest = {
                title: formData.get('title') as string,
                description: formData.get('description') as string || undefined,
                status: formData.get('status') as Task['status'],
                due_date: new Date(formData.get('due-date') as string + 'T00:00:00').toISOString(),
              };
              this.executeTaskCreation(taskData);
            }
          }
        }
      }
      
      // Handle update task button
      if (target.id === 'update-task-btn') {
        console.log('Update task button clicked');
        const form = target.closest('form');
        if (form && form.id === 'edit-task-form') {
          e.preventDefault();
          this.handleUpdateTask(e);
        }
      }
      
      // Handle delete task button
      if (target.id === 'delete-task-btn') {
        console.log('Delete task button clicked');
        e.preventDefault();
        if (this.currentEditingTask && confirm(`Are you sure you want to delete the task "${this.currentEditingTask.title}"?`)) {
          this.handleDeleteTask(this.currentEditingTask.id);
        }
      }
    });
  }

  private setupFormEventListeners(): void {
    // Create task form
    const taskForm = document.getElementById('task-form') as HTMLFormElement;
    console.log('Setting up form listeners, form found:', !!taskForm);
    if (taskForm) {
      // Remove existing listeners to avoid duplicates
      taskForm.removeEventListener('submit', this.handleCreateTask.bind(this));
      taskForm.addEventListener('submit', this.handleCreateTask.bind(this));
      console.log('Form submit listener attached');
    } else {
      console.log('Task form not found in DOM');
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.router.navigateTo('/');
      });
    }

    // Refresh tasks button
    const refreshBtn = document.getElementById('refresh-tasks-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', this.loadTasks.bind(this));
    }

    // Filter overdue button
    const filterOverdueBtn = document.getElementById('filter-overdue-btn');
    if (filterOverdueBtn) {
      filterOverdueBtn.addEventListener('click', this.toggleOverdueFilter.bind(this));
    }

    // Edit task form
    const editTaskForm = document.getElementById('edit-task-form') as HTMLFormElement;
    if (editTaskForm) {
      editTaskForm.addEventListener('submit', this.handleUpdateTask.bind(this));
    }

  }

  // private async checkApiHealth(): Promise<void> {
  //   try {
  //     await taskApi.healthCheck();
  //     console.log('API health check passed');
  //   } catch (error) {
  //     console.error('API health check failed:', error);
  //     this.showError('Unable to connect to the API. Please check if the server is running.');
  //   }
  // }

  private async loadTasks(): Promise<void> {
    try {
      this.showLoading(true);
      const response = await taskApi.getAllTasks();
      
      if (response.success && response.data) {
        this.tasks = response.data;
        this.renderTasks();
        this.hideError();
      } else {
        throw new Error(response.error || 'Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.showError('Failed to load tasks. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  private renderTasks(): void {
    const taskList = document.getElementById('task-list');
    const tasksContainer = document.getElementById('tasks-container');
    
    // Use tasks-container if task-list is not found (for dashboard)
    const container = taskList || tasksContainer;
    if (!container) return;

    // Filter tasks based on overdue filter
    let tasksToShow = this.tasks;
    if (this.showOverdueOnly) {
      tasksToShow = this.tasks.filter(task => this.isTaskOverdue(task));
    }

    if (tasksToShow.length === 0) {
      const message = this.showOverdueOnly 
        ? 'No overdue tasks found.' 
        : 'No tasks found. <a href="/create" data-nav="create" class="govuk-link">Create your first task</a>';
      
      container.innerHTML = `
        <div class="govuk-inset-text">
          <p>${message}</p>
        </div>
      `;
      return;
    }

    // Clear container first
    container.innerHTML = '';
    
    // Append each task element directly instead of using innerHTML with join
    tasksToShow.forEach(task => {
      const taskElement = this.createTaskElement(task);
      container.appendChild(taskElement);
    });

    // Update statistics after rendering
    this.updateTaskStatistics();
  }

  private updateTaskStatistics(): void {
    const stats = {
      pending: this.tasks.filter(t => t.status === 'pending').length,
      in_progress: this.tasks.filter(t => t.status === 'in_progress').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      cancelled: this.tasks.filter(t => t.status === 'cancelled').length
    };

    // Update stat cards
    const pendingCount = document.getElementById('pending-count');
    const inProgressCount = document.getElementById('in-progress-count');
    const completedCount = document.getElementById('completed-count');
    const cancelledCount = document.getElementById('cancelled-count');

    if (pendingCount) pendingCount.textContent = stats.pending.toString();
    if (inProgressCount) inProgressCount.textContent = stats.in_progress.toString();
    if (completedCount) completedCount.textContent = stats.completed.toString();
    if (cancelledCount) cancelledCount.textContent = stats.cancelled.toString();
  }

  private createTaskElement(task: Task): HTMLElement {
    const taskCard = document.createElement('div');
    taskCard.className = `task-card task-card--${task.status}`;
    taskCard.setAttribute('data-task-id', task.id.toString());
    
    const statusDisplay = task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    taskCard.innerHTML = `
      <div class="task-card__header">
        <h3 class="task-card__title">${this.escapeHtml(task.title)}</h3>
        <span class="task-card__status task-card__status--${task.status}">
          ${statusDisplay}
        </span>
      </div>
      
      ${task.description ? `
        <div class="task-card__description">
          <p class="govuk-body">${this.escapeHtml(task.description)}</p>
        </div>
      ` : ''}
      
      <div class="task-card__meta">
        <div class="task-card__meta-item">
          <strong>Due:</strong>
          <span>${new Date(task.due_date).toLocaleDateString()}</span>
        </div>
        <div class="task-card__meta-item">
          <strong>Created:</strong>
          <span>${new Date(task.created_at).toLocaleDateString()}</span>
        </div>
        ${task.updated_at !== task.created_at ? `
          <div class="task-card__meta-item">
            <strong>Updated:</strong>
            <span>${new Date(task.updated_at).toLocaleDateString()}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="task-card__actions">
        <div class="govuk-form-group" style="margin: 0; margin-right: 1rem;">
          <label class="govuk-label govuk-visually-hidden" for="status-select-${task.id}">
            Change status
          </label>
          <select class="govuk-select" id="status-select-${task.id}" data-task-id="${task.id}">
            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${task.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
        <button class="govuk-button govuk-button--secondary" data-module="govuk-button" type="button" data-action="edit" data-task-id="${task.id}">
          Edit
        </button>
        <button class="govuk-button govuk-button--warning" data-module="govuk-button" type="button" data-action="delete" data-task-id="${task.id}">
          Delete
        </button>
      </div>
    `;
    
    // Add event listeners
    const statusSelect = taskCard.querySelector('select');
    const editBtn = taskCard.querySelector('[data-action="edit"]');
    const deleteBtn = taskCard.querySelector('[data-action="delete"]');
    
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const newStatus = target.value as Task['status'];
        if (newStatus !== task.status) {
          this.handleStatusChange(task.id, newStatus);
        }
      });
    }
    
    if (editBtn) {
      editBtn.addEventListener('click', () => this.navigateToEditTask(task.id));
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
          this.handleDeleteTask(task.id);
        }
      });
    }
    
    return taskCard;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private async handleCreateTask(event: Event): Promise<void> {
    console.log('Form submitted!');
    event.preventDefault();
    
    // Get the form element - it might be the event target or we need to find it
    let form = event.target as HTMLFormElement;
    if (!form || form.tagName !== 'FORM') {
      form = document.getElementById('task-form') as HTMLFormElement;
      console.log('Form found via getElementById:', !!form);
    }
    
    if (!form) {
      console.error('No form found!');
      return;
    }
    
    const formData = new FormData(form);
    
    console.log('Form data:', Array.from(formData.entries()));
    
    // Clear any existing errors
    this.clearFormErrors();
    
    // Validate required fields
    const errors = this.validateCreateTaskForm(formData);
    console.log('Validation errors:', errors);
    if (errors.length > 0) {
      console.log('Showing errors...');
      this.showFormErrors(errors);
      // Focus on the first error field
      if (errors[0]) {
        const firstErrorField = document.getElementById(errors[0].field);
        if (firstErrorField) {
          firstErrorField.focus();
        }
      }
      return;
    }

    console.log('No validation errors, proceeding with task creation...');
    
    const taskData: CreateTaskRequest = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      status: formData.get('status') as Task['status'],
      due_date: new Date(formData.get('due-date') as string + 'T00:00:00').toISOString(),
    };

    try {
      console.log('Setting button loading state...');
      this.setButtonLoading('create-task-btn', true);
      
      console.log('Calling API with task data:', taskData);
      const response = await taskApi.createTask(taskData);
      console.log('API response:', response);
      
      if (response.success && response.data) {
        console.log('Task created successfully, showing success message');
        this.showSuccess('Task created successfully');
        this.resetCreateForm();
        await this.loadTasks();
        // Navigate back to home page after successful creation
        this.router.navigateTo('/');
      } else {
        console.error('API returned error:', response.error);
        throw new Error(response.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      this.showError('Failed to create task. Please check your input and try again.');
    } finally {
      console.log('Removing button loading state...');
      this.setButtonLoading('create-task-btn', false);
    }
  }

  public navigateToEditTask(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      this.currentEditingTask = task;
      this.router.navigateTo(`/edit/${taskId}`);
    }
  }

  private populateEditForm(task: Task): void {
    const form = document.getElementById('edit-task-form') as HTMLFormElement;
    if (!form) return;

    (form.querySelector('#edit-title') as HTMLInputElement).value = task.title;
    (form.querySelector('#edit-description') as HTMLTextAreaElement).value = task.description || '';
    
    // Format date for date input (YYYY-MM-DD) - avoid timezone issues
    const dueDate = new Date(task.due_date);
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    (form.querySelector('#edit-due-date') as HTMLInputElement).value = formattedDate;
    
    // Set status radio button
    const statusRadio = form.querySelector(`#edit-status-${task.status}`) as HTMLInputElement;
    if (statusRadio) {
      statusRadio.checked = true;
    }
  }

  private async handleUpdateTask(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.currentEditingTask) return;
    
    const editForm = document.getElementById('edit-task-form') as HTMLFormElement;
    if (!editForm) return;
    
    const editFormData = new FormData(editForm);
    
    // Clear any existing errors for edit form
    this.clearEditFormErrors();
    
    // Validate required fields (reuse existing validation but adapt field names)
    const errors = this.validateEditTaskForm(editFormData);
    if (errors.length > 0) {
      this.showEditFormErrors(errors);
      return;
    }
    
    const taskData = {
      title: editFormData.get('title') as string,
      description: editFormData.get('description') as string || undefined,
      status: editFormData.get('status') as Task['status'],
      due_date: new Date(editFormData.get('due-date') as string + 'T00:00:00').toISOString(),
    };

    try {
      this.setButtonLoading('update-task-btn', true);
      const response = await taskApi.updateTask(this.currentEditingTask.id, taskData);
      
      if (response.success && response.data) {
        this.showSuccess('Task updated successfully');
        await this.loadTasks();
        this.router.navigateTo('/');
      } else {
        throw new Error(response.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      this.showError('Failed to update task. Please try again.');
    } finally {
      this.setButtonLoading('update-task-btn', false);
    }
  }

  private async handleDeleteTask(id: number): Promise<void> {
    try {
      const response = await taskApi.deleteTask(id);
      
      if (response.success) {
        this.showSuccess('Task deleted successfully');
        await this.loadTasks();
      } else {
        throw new Error(response.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      this.showError('Failed to delete task. Please try again.');
    }
  }

  private async handleStatusChange(id: number, status: Task['status']): Promise<void> {
    try {
      const response = await taskApi.updateTaskStatus(id, status);
      
      if (response.success) {
        this.showSuccess('Task status updated successfully');
        await this.loadTasks();
      } else {
        throw new Error(response.error || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      this.showError('Failed to update task status. Please try again.');
      // Reload tasks to reset the UI
      await this.loadTasks();
    }
  }


  private resetCreateForm(): void {
    const form = document.getElementById('task-form') as HTMLFormElement;
    if (form) {
      form.reset();
      
      // Reset to default status
      const pendingRadio = form.querySelector('#status-pending') as HTMLInputElement;
      if (pendingRadio) {
        pendingRadio.checked = true;
      }
      
      // Clear any error states
      this.clearFormErrors();
    }
  }

  private clearFormErrors(): void {
    // Ensure we're on the create page
    const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
    if (!createPage) {
      return;
    }
    
    // Clear error summary
    const errorSummary = createPage.querySelector('#form-error-summary') as HTMLElement;
    if (errorSummary) {
      errorSummary.style.display = 'none';
    }
    
    // Clear form field errors within the create page
    const errorGroups = createPage.querySelectorAll('.govuk-form-group--error');
    errorGroups.forEach(group => {
      group.classList.remove('govuk-form-group--error');
    });
    
    const errorMessages = createPage.querySelectorAll('.govuk-error-message');
    errorMessages.forEach(message => message.remove());
    
    const errorInputs = createPage.querySelectorAll('.govuk-input--error, .govuk-textarea--error, .govuk-select--error');
    errorInputs.forEach(input => {
      input.classList.remove('govuk-input--error', 'govuk-textarea--error', 'govuk-select--error');
    });
  }

  private clearEditFormErrors(): void {
    // Ensure we're on the edit page
    const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
    if (!editPage) {
      return;
    }
    
    // Clear error summary
    const errorSummary = editPage.querySelector('#edit-form-error-summary') as HTMLElement;
    if (errorSummary) {
      errorSummary.style.display = 'none';
    }
    
    // Clear form field errors within the edit page
    const errorGroups = editPage.querySelectorAll('.govuk-form-group--error');
    errorGroups.forEach(group => {
      group.classList.remove('govuk-form-group--error');
    });
    
    const errorMessages = editPage.querySelectorAll('.govuk-error-message');
    errorMessages.forEach(message => message.remove());
    
    const errorInputs = editPage.querySelectorAll('.govuk-input--error, .govuk-textarea--error, .govuk-select--error');
    errorInputs.forEach(input => {
      input.classList.remove('govuk-input--error', 'govuk-textarea--error', 'govuk-select--error');
    });
  }

  private validateEditTaskForm(formData: FormData): Array<{field: string, message: string}> {
    const errors: Array<{field: string, message: string}> = [];
    
    const title = formData.get('title') as string;
    const dueDate = formData.get('due-date') as string;
    
    if (!title || title.trim() === '') {
      errors.push({
        field: 'edit-title',
        message: 'Enter a task title'
      });
    }
    
    if (!dueDate || dueDate.trim() === '') {
      errors.push({
        field: 'edit-due-date',
        message: 'Enter a due date'
      });
    }
    
    return errors;
  }

  private showEditFormErrors(errors: Array<{field: string, message: string}>): void {
    // Ensure we're on the edit page
    const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
    if (!editPage || editPage.style.display === 'none') {
      return;
    }
    
    // Show error summary
    const errorSummary = editPage.querySelector('#edit-form-error-summary') as HTMLElement;
    const errorList = editPage.querySelector('#edit-error-list') as HTMLElement;
    
    if (errorSummary && errorList) {
      // Build error list
      const errorItems = errors.map(error => 
        `<li><a href="#${error.field}">${error.message}</a></li>`
      ).join('');
      
      errorList.innerHTML = errorItems;
      errorSummary.style.display = 'block';
      errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Add field-level errors
    errors.forEach(error => {
      this.addEditFieldError(error.field, error.message);
    });
    
    // Focus on first error field
    if (errors[0]) {
      const firstErrorField = document.getElementById(errors[0].field);
      if (firstErrorField) firstErrorField.focus();
    }
  }

  private addEditFieldError(fieldId: string, message: string): void {
    const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;
    if (!editPage) {
      return;
    }
    
    const formGroup = editPage.querySelector(`#${fieldId}-group`) as HTMLElement;
    const input = editPage.querySelector(`#${fieldId}`) as HTMLElement;
    
    if (formGroup && input) {
      // Remove any existing error message first
      const existingError = formGroup.querySelector('.govuk-error-message');
      if (existingError) {
        existingError.remove();
      }
      
      // Add error styling
      formGroup.classList.add('govuk-form-group--error');
      input.classList.add('govuk-input--error');
      
      // Create error message
      const errorMessage = document.createElement('p');
      errorMessage.className = 'govuk-error-message';
      errorMessage.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${message}`;
      
      // Insert error message after label/legend but before input
      const label = formGroup.querySelector('label, legend');
      const hint = formGroup.querySelector('.govuk-hint');
      const insertAfter = hint || label;
      
      if (insertAfter && insertAfter.nextSibling) {
        insertAfter.parentNode?.insertBefore(errorMessage, insertAfter.nextSibling);
      } else if (insertAfter) {
        insertAfter.parentNode?.appendChild(errorMessage);
      } else {
        formGroup.insertBefore(errorMessage, formGroup.firstChild);
      }
    }
  }

  private validateCreateTaskForm(formData: FormData): Array<{field: string, message: string}> {
    const errors: Array<{field: string, message: string}> = [];
    
    const title = formData.get('title') as string;
    const dueDate = formData.get('due-date') as string;
    
    console.log('Validating - title:', `"${title}"`, 'dueDate:', `"${dueDate}"`);
    
    if (!title || title.trim() === '') {
      console.log('Title validation failed');
      errors.push({
        field: 'title',
        message: 'Enter a task title'
      });
    }
    
    if (!dueDate || dueDate.trim() === '') {
      console.log('Due date validation failed');
      errors.push({
        field: 'due-date',
        message: 'Enter a due date'
      });
    }
    
    console.log('Validation complete, errors:', errors);
    return errors;
  }

  private showFormErrors(errors: Array<{field: string, message: string}>): void {
    console.log('showFormErrors called with:', errors);
    
    // Ensure we're on the create page
    const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
    console.log('Create page found:', !!createPage);
    console.log('Create page visible:', createPage?.style.display !== 'none');
    
    if (!createPage || createPage.style.display === 'none') {
      console.error('Create page is not visible');
      return;
    }
    
    // Show error summary - look within the create page
    const errorSummary = createPage.querySelector('#form-error-summary') as HTMLElement;
    const errorList = createPage.querySelector('#form-error-list') as HTMLElement;
    
    console.log('Error summary found:', !!errorSummary);
    console.log('Error list found:', !!errorList);
    
    
    
    if (errorSummary && errorList) {
      errorList.innerHTML = '';
      
      errors.forEach(error => {
        
        // Add to error summary
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${error.field}`;
        link.textContent = error.message;
        listItem.appendChild(link);
        errorList.appendChild(listItem);
        
        // Add field-level error
        this.addFieldError(error.field, error.message);
      });
      
      errorSummary.style.display = 'block';
      console.log('Error summary made visible, scrolling to it');
      errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Force a repaint to ensure visibility
      errorSummary.offsetHeight;
      
      console.log('Error summary final state - display:', errorSummary.style.display);
      console.log('Error summary content:', errorSummary.innerHTML);
      
      // Force visibility with !important
      errorSummary.style.setProperty('display', 'block', 'important');
      errorSummary.style.setProperty('visibility', 'visible', 'important');
      errorSummary.style.setProperty('opacity', '1', 'important');
      
      console.log('Forced error summary visibility');
    } else {
      console.error('Could not find error summary elements');
      console.log('Create page HTML:', createPage.innerHTML.substring(0, 1000));
    }
  }

  private addFieldError(fieldId: string, message: string): void {
    
    // Look within the create page for form elements
    const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
    if (!createPage) {
      console.error('Create page not found');
      return;
    }
    
    const formGroup = createPage.querySelector(`#${fieldId}-group`) as HTMLElement;
    const input = createPage.querySelector(`#${fieldId}`) as HTMLElement;
    
    
    
    if (formGroup && input) {
      // Remove any existing error message first
      const existingError = formGroup.querySelector('.govuk-error-message');
      if (existingError) {
        existingError.remove();
      }
      
      // Add error class to form group
      formGroup.classList.add('govuk-form-group--error');
      
      // Add error class to input
      if (input.tagName === 'INPUT') {
        input.classList.add('govuk-input--error');
      } else if (input.tagName === 'TEXTAREA') {
        input.classList.add('govuk-textarea--error');
      }
      
      // Create and insert error message
      const errorMessage = document.createElement('p');
      errorMessage.className = 'govuk-error-message';
      errorMessage.id = `${fieldId}-error`;
      errorMessage.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${message}`;
      
      // Insert error message after label/hint but before input
      const label = formGroup.querySelector('.govuk-label');
      const hint = formGroup.querySelector('.govuk-hint');
      const insertAfter = hint || label;
      
      
      if (insertAfter && insertAfter.nextSibling) {
        insertAfter.parentNode?.insertBefore(errorMessage, insertAfter.nextSibling);
      } else if (insertAfter) {
        // If no next sibling, append after the insertAfter element
        insertAfter.parentNode?.appendChild(errorMessage);
      } else {
        // Fallback: insert at the beginning of the form group
        formGroup.insertBefore(errorMessage, formGroup.firstChild);
      }
    } else {
      console.error(`Could not find form elements for ${fieldId}`);
    }
  }

  private toggleOverdueFilter(): void {
    this.showOverdueOnly = !this.showOverdueOnly;
    
    const filterBtn = document.getElementById('filter-overdue-btn');
    if (filterBtn) {
      if (this.showOverdueOnly) {
        filterBtn.textContent = 'Show All';
        filterBtn.classList.add('govuk-button--warning');
      } else {
        filterBtn.textContent = 'Show Overdue';
        filterBtn.classList.remove('govuk-button--warning');
      }
    }
    
    this.renderTasks();
  }

  private isTaskOverdue(task: Task): boolean {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    return dueDate < now && task.status !== 'completed';
  }

  private async executeTaskCreation(taskData: CreateTaskRequest): Promise<void> {
    try {
      console.log('Setting button loading state...');
      this.setButtonLoading('create-task-btn', true);
      
      console.log('Calling API with task data:', taskData);
      const response = await taskApi.createTask(taskData);
      console.log('API response:', response);
      
      if (response.success && response.data) {
        console.log('Task created successfully, showing success message');
        this.showSuccess('Task created successfully');
        this.resetCreateForm();
        await this.loadTasks();
        // Navigate back to home page after successful creation
        this.router.navigateTo('/');
      } else {
        console.error('API returned error:', response.error);
        throw new Error(response.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      this.showError('Failed to create task. Please check your input and try again.');
    } finally {
      console.log('Removing button loading state...');
      this.setButtonLoading('create-task-btn', false);
    }
  }

  private showLoading(show: boolean): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'block' : 'none';
    }
  }

  private setButtonLoading(buttonId: string, loading: boolean): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (button) {
      if (loading) {
        button.classList.add('govuk-button--loading');
        button.disabled = true;
      } else {
        button.classList.remove('govuk-button--loading');
        button.disabled = false;
      }
    }
  }

  private showError(message: string): void {
    const errorContainer = document.getElementById('error-container');
    const errorList = document.getElementById('error-list');
    const successContainer = document.getElementById('success-container');
    
    if (errorContainer && errorList) {
      errorList.innerHTML = `<li><a href="#main-content">${message}</a></li>`;
      errorContainer.style.display = 'block';
      errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (successContainer) {
      successContainer.style.display = 'none';
    }
  }

  private showSuccess(message: string): void {
    const successContainer = document.getElementById('success-container');
    const successMessage = document.getElementById('success-message');
    const errorContainer = document.getElementById('error-container');
    
    if (successContainer && successMessage) {
      successMessage.textContent = message;
      successContainer.style.display = 'block';
      successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        successContainer.style.display = 'none';
      }, 5000);
    }
    
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
  }

  private hideError(): void {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TaskManager();
});
