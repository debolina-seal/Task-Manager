import {
  formatDate,
  formatDateTime,
  formatDateForInput,
  formatDateTimeForInput,
  isOverdue,
  isDueSoon,
  getRelativeTimeString
} from '../utils/dateUtils';

describe('Date Utilities', () => {
  // Mock Date to ensure consistent test results
  const mockDate = new Date('2024-01-15T12:00:00.000Z');
  
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('formatDate', () => {
    test('should format date in DD/MM/YYYY format', () => {
      const dateString = '2024-12-31T00:00:00.000Z';
      const result = formatDate(dateString);
      expect(result).toBe('31/12/2024');
    });

    test('should handle different date formats', () => {
      const dateString = '2024-01-01T15:30:00.000Z';
      const result = formatDate(dateString);
      expect(result).toBe('01/01/2024');
    });
  });

  describe('formatDateTime', () => {
    test('should format date and time', () => {
      const dateString = '2024-12-31T14:30:00.000Z';
      const result = formatDateTime(dateString);
      // Note: This will vary based on timezone, so we check for presence of key components
      expect(result).toMatch(/31\/12\/2024/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatDateForInput', () => {
    test('should format date for HTML input (YYYY-MM-DD)', () => {
      const dateString = '2024-12-31T00:00:00.000Z';
      const result = formatDateForInput(dateString);
      expect(result).toBe('2024-12-31');
    });

    test('should handle single digit months and days', () => {
      const dateString = '2024-01-05T00:00:00.000Z';
      const result = formatDateForInput(dateString);
      expect(result).toBe('2024-01-05');
    });
  });

  describe('formatDateTimeForInput', () => {
    test('should be alias for formatDateForInput', () => {
      const dateString = '2024-12-31T00:00:00.000Z';
      const result1 = formatDateForInput(dateString);
      const result2 = formatDateTimeForInput(dateString);
      expect(result1).toBe(result2);
    });
  });

  describe('isOverdue', () => {
    test('should return true for past dates', () => {
      const pastDate = '2024-01-14T12:00:00.000Z'; // 1 day ago
      expect(isOverdue(pastDate)).toBe(true);
    });

    test('should return false for future dates', () => {
      const futureDate = '2024-01-16T12:00:00.000Z'; // 1 day from now
      expect(isOverdue(futureDate)).toBe(false);
    });

    test('should return false for current time', () => {
      const currentDate = '2024-01-15T12:00:00.000Z';
      expect(isOverdue(currentDate)).toBe(false);
    });
  });

  describe('isDueSoon', () => {
    test('should return true for dates within default threshold (24 hours)', () => {
      const soonDate = '2024-01-16T11:00:00.000Z'; // 23 hours from now
      expect(isDueSoon(soonDate)).toBe(true);
    });

    test('should return false for dates beyond threshold', () => {
      const farDate = '2024-01-17T12:00:00.000Z'; // 2 days from now
      expect(isDueSoon(farDate)).toBe(false);
    });

    test('should return false for past dates', () => {
      const pastDate = '2024-01-14T12:00:00.000Z';
      expect(isDueSoon(pastDate)).toBe(false);
    });

    test('should respect custom threshold', () => {
      const date = '2024-01-16T11:00:00.000Z'; // 23 hours from now
      expect(isDueSoon(date, 12)).toBe(false); // 12 hour threshold
      expect(isDueSoon(date, 48)).toBe(true);  // 48 hour threshold
    });
  });

  describe('getRelativeTimeString', () => {
    test('should return correct string for overdue tasks (hours)', () => {
      const overdueDate = '2024-01-15T10:00:00.000Z'; // 2 hours ago
      const result = getRelativeTimeString(overdueDate);
      expect(result).toBe('Overdue (2 hours ago)');
    });

    test('should return correct string for overdue tasks (days)', () => {
      const overdueDate = '2024-01-13T12:00:00.000Z'; // 2 days ago
      const result = getRelativeTimeString(overdueDate);
      expect(result).toBe('Overdue (2 days ago)');
    });

    test('should return correct string for overdue tasks (less than 1 hour)', () => {
      const overdueDate = '2024-01-15T11:30:00.000Z'; // 30 minutes ago
      const result = getRelativeTimeString(overdueDate);
      expect(result).toBe('Overdue (less than 1 hour ago)');
    });

    test('should return correct string for overdue tasks (more than 7 days)', () => {
      const overdueDate = '2024-01-01T12:00:00.000Z'; // 14 days ago
      const result = getRelativeTimeString(overdueDate);
      expect(result).toBe('Overdue (01/01/2024)');
    });

    test('should return correct string for future tasks (hours)', () => {
      const futureDate = '2024-01-15T14:00:00.000Z'; // 2 hours from now
      const result = getRelativeTimeString(futureDate);
      expect(result).toBe('Due in 2 hours');
    });

    test('should return correct string for future tasks (days)', () => {
      const futureDate = '2024-01-17T12:00:00.000Z'; // 2 days from now
      const result = getRelativeTimeString(futureDate);
      expect(result).toBe('Due in 2 days');
    });

    test('should return correct string for future tasks (less than 1 hour)', () => {
      const futureDate = '2024-01-15T12:30:00.000Z'; // 30 minutes from now
      const result = getRelativeTimeString(futureDate);
      expect(result).toBe('Due in less than 1 hour');
    });

    test('should return correct string for future tasks (more than 7 days)', () => {
      const futureDate = '2024-02-01T12:00:00.000Z'; // 17 days from now
      const result = getRelativeTimeString(futureDate);
      expect(result).toBe('Due 01/02/2024');
    });
  });
});
