export type PageName = 'home' | 'create' | 'edit';

export interface Route {
  path: string;
  page: PageName;
  title: string;
  params?: { [key: string]: string };
}

export class Router {
  private routes: Route[] = [
    { path: '/', page: 'home', title: 'Task Dashboard' },
    { path: '/create', page: 'create', title: 'Create Task' },
    { path: '/edit/:id', page: 'edit', title: 'Edit Task' }
  ];

  private currentPage: PageName = 'home';
  private onPageChange?: (page: PageName) => void;

  constructor(onPageChange?: (page: PageName) => void) {
    this.onPageChange = onPageChange;
    this.init();
  }

  private init(): void {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // Handle initial route
    this.handleRouteChange();
  }

  private handleRouteChange(): void {
    const path = window.location.pathname;
    const route = this.matchRoute(path);
    
    // Ensure the page exists before navigating
    const pageExists = document.querySelector(`[data-page="${route.page}"]`);
    if (pageExists) {
      this.navigateToPage(route.page, false, route.params);
      document.title = `${route.title} - HMCTS Task Manager`;
    } else {
      // Fallback to home page if route page doesn't exist
      this.navigateToPage('home', false);
      document.title = `Task Dashboard - HMCTS Task Manager`;
    }
  }

  private matchRoute(path: string): Route {
    for (const route of this.routes) {
      if (route.path.includes(':')) {
        // Handle parameterized routes
        const routeParts = route.path.split('/');
        const pathParts = path.split('/');
        
        if (routeParts.length === pathParts.length) {
          const params: { [key: string]: string } = {};
          let matches = true;
          
          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
              // Parameter segment
              const paramName = routeParts[i].substring(1);
              params[paramName] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
              matches = false;
              break;
            }
          }
          
          if (matches) {
            return { ...route, params };
          }
        }
      } else if (route.path === path) {
        return route;
      }
    }
    
    return this.routes[0]; // Default to home
  }

  public navigateTo(path: string): void {
    window.history.pushState({}, '', path);
    const route = this.matchRoute(path);
    this.navigateToPage(route.page, true, route.params);
    document.title = `${route.title} - HMCTS Task Manager`;
  }

  private navigateToPage(page: PageName, updateHistory: boolean = true, params?: { [key: string]: string }): void {
    if (this.currentPage !== page) {
      this.currentPage = page;
      this.showPage(page);
      
      if (this.onPageChange) {
        this.onPageChange(page);
      }
    }
  }

  private showPage(page: PageName): void {
    // Hide all pages
    const pages = document.querySelectorAll('[data-page]');
    pages.forEach(pageEl => {
      (pageEl as HTMLElement).style.display = 'none';
    });

    // Show current page
    const currentPageEl = document.querySelector(`[data-page="${page}"]`);
    if (currentPageEl) {
      (currentPageEl as HTMLElement).style.display = 'block';
    } else {
      // If page not found, show home page as fallback
      const homePage = document.querySelector('[data-page="home"]');
      if (homePage) {
        (homePage as HTMLElement).style.display = 'block';
        this.currentPage = 'home';
      }
    }

    // Update navigation
    this.updateNavigation(page);
  }

  private updateNavigation(currentPage: PageName): void {
    // No navigation menu items to update since we removed the header navigation
    // The logo link will always navigate to home page
  }

  public getCurrentPage(): PageName {
    return this.currentPage;
  }
}
