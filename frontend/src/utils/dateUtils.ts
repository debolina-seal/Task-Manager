export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  // Format as YYYY-MM-DD for date input
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Keep the old function for backward compatibility
export function formatDateTimeForInput(dateString: string): string {
  return formatDateForInput(dateString);
}

export function isOverdue(dueDateString: string): boolean {
  const dueDate = new Date(dueDateString);
  const now = new Date();
  return dueDate < now;
}

export function isDueSoon(dueDateString: string, hoursThreshold: number = 24): boolean {
  const dueDate = new Date(dueDateString);
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  return hoursDiff > 0 && hoursDiff <= hoursThreshold;
}

export function getRelativeTimeString(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.abs(diffMs) / (1000 * 60 * 60);
  const diffDays = Math.abs(diffMs) / (1000 * 60 * 60 * 24);

  if (diffMs < 0) {
    // Past due
    if (diffHours < 1) {
      return 'Overdue (less than 1 hour ago)';
    } else if (diffHours < 24) {
      return `Overdue (${Math.floor(diffHours)} hours ago)`;
    } else if (diffDays < 7) {
      return `Overdue (${Math.floor(diffDays)} days ago)`;
    } else {
      return `Overdue (${formatDate(dateString)})`;
    }
  } else {
    // Future
    if (diffHours < 1) {
      return 'Due in less than 1 hour';
    } else if (diffHours < 24) {
      return `Due in ${Math.floor(diffHours)} hours`;
    } else if (diffDays < 7) {
      return `Due in ${Math.floor(diffDays)} days`;
    } else {
      return `Due ${formatDate(dateString)}`;
    }
  }
}
