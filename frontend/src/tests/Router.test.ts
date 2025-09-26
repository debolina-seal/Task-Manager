import { Router } from '../router';

// Mock HTML structure for router testing
const createMockHTML = () => {
  document.body.innerHTML = `
    <div data-page="home" class="page" style="display: block;">Dashboard</div>
    <div data-page="create" class="page" style="display: none;">Create Task</div>
    <div data-page="edit" class="page" style="display: none;">Edit Task</div>
  `;
};

describe('Router', () => {
  let router: Router;
  let mockPageChangeHandler: jest.Mock;
  let mockPushState: jest.Mock;

  beforeEach(() => {
    createMockHTML();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/'
      },
      writable: true
    });
    
    // Mock window.history
    mockPushState = jest.fn();
    Object.defineProperty(window, 'history', {
      value: {
        pushState: mockPushState,
        replaceState: jest.fn()
      },
      writable: true
    });

    // Mock addEventListener to prevent actual event listeners
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = jest.fn();
    
    // Mock page change handler
    mockPageChangeHandler = jest.fn();
    router = new Router(mockPageChangeHandler);
    
    // Restore addEventListener
    window.addEventListener = originalAddEventListener;
  });

  describe('navigation', () => {
    test('should navigate to dashboard', () => {
      // First navigate away from home, then back to test the handler
      router.navigateTo('/create');
      mockPageChangeHandler.mockClear();
      
      router.navigateTo('/');

      const dashboardPage = document.querySelector('[data-page="home"]') as HTMLElement;
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;

      expect(dashboardPage?.style.display).toBe('block');
      expect(createPage?.style.display).toBe('none');
      expect(editPage?.style.display).toBe('none');
      expect(mockPageChangeHandler).toHaveBeenCalledWith('home');
    });

    test('should navigate to create task page', () => {
      router.navigateTo('/create');

      const dashboardPage = document.querySelector('[data-page="home"]') as HTMLElement;
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;

      expect(dashboardPage?.style.display).toBe('none');
      expect(createPage?.style.display).toBe('block');
      expect(editPage?.style.display).toBe('none');
      expect(mockPageChangeHandler).toHaveBeenCalledWith('create');
    });

    test('should navigate to edit task page', () => {
      router.navigateTo('/edit/123');

      const dashboardPage = document.querySelector('[data-page="home"]') as HTMLElement;
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      const editPage = document.querySelector('[data-page="edit"]') as HTMLElement;

      expect(dashboardPage?.style.display).toBe('none');
      expect(createPage?.style.display).toBe('none');
      expect(editPage?.style.display).toBe('block');
      expect(mockPageChangeHandler).toHaveBeenCalledWith('edit');
    });

    test('should handle unknown routes by redirecting to dashboard', () => {
      // First navigate away from home to ensure we can detect the redirect
      router.navigateTo('/create');
      mockPageChangeHandler.mockClear();
      
      router.navigateTo('/unknown-route');

      const dashboardPage = document.querySelector('[data-page="home"]') as HTMLElement;
      expect(dashboardPage?.style.display).toBe('block');
      expect(mockPageChangeHandler).toHaveBeenCalledWith('home');
    });

    test('should get current page', () => {
      router.navigateTo('/create');
      expect(router.getCurrentPage()).toBe('create');
    });
  });

  describe('URL management', () => {
    test('should update browser history on navigation', () => {
      router.navigateTo('/create');
      
      expect(mockPushState).toHaveBeenCalledWith({}, '', '/create');
    });

    test('should get current page after navigation', () => {
      router.navigateTo('/create');
      expect(router.getCurrentPage()).toBe('create');
      
      router.navigateTo('/edit/123');
      expect(router.getCurrentPage()).toBe('edit');
    });
  });

  describe('page visibility', () => {
    test('should show correct page after navigation', () => {
      // Navigate to create page
      router.navigateTo('/create');
      
      const dashboardPage = document.querySelector('[data-page="home"]') as HTMLElement;
      const createPage = document.querySelector('[data-page="create"]') as HTMLElement;
      
      expect(dashboardPage?.style.display).toBe('none');
      expect(createPage?.style.display).toBe('block');
    });

    test('should handle page transitions correctly', () => {
      // Start with dashboard
      router.navigateTo('/');
      expect((document.querySelector('[data-page="home"]') as HTMLElement)?.style.display).toBe('block');
      
      // Navigate to create
      router.navigateTo('/create');
      expect((document.querySelector('[data-page="home"]') as HTMLElement)?.style.display).toBe('none');
      expect((document.querySelector('[data-page="create"]') as HTMLElement)?.style.display).toBe('block');
      
      // Navigate to edit
      router.navigateTo('/edit/123');
      expect((document.querySelector('[data-page="create"]') as HTMLElement)?.style.display).toBe('none');
      expect((document.querySelector('[data-page="edit"]') as HTMLElement)?.style.display).toBe('block');
    });
  });
});
