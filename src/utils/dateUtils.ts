/**
 * Utility functions for date and time handling
 */

/**
 * Safely parse a UTC date string into a Date object
 * This helps ensure consistent parsing across the application
 * @param utcDateString - UTC date string from the database
 * @returns Date object
 */
export const parseUTCDate = (utcDateString: string): Date => {
  if (!utcDateString) {
    return new Date();
  }
  
  try {
    // Quick fix for the year 2025 notification bug
    if (utcDateString.includes('2025-')) {
      console.warn('Found a 2025 date, normalizing to current time', utcDateString);
      return new Date();
    }
    
    // Check if the string already includes timezone information
    const hasTimezoneInfo = 
      utcDateString.endsWith('Z') || 
      utcDateString.includes('+') || 
      utcDateString.includes('-');
    
    // If no timezone info, assume it's UTC and append 'Z'
    const dateString = hasTimezoneInfo ? utcDateString : `${utcDateString}Z`;
    
    // Create date and validate it's not in the future
    const date = new Date(dateString);
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${utcDateString}`);
      return new Date();
    }
    
    const now = new Date();
    
    // If date is more than 1 hour in the future, use current time
    if (date > now) {
      const diffMs = date.getTime() - now.getTime();
      if (diffMs > 60 * 60 * 1000) { // More than 1 hour
        return now;
      }
    }
    
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${utcDateString}`, error);
    return new Date();
  }
};

/**
 * Convert UTC date string to local date time string
 * @param utcDateString - UTC date string from the database
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted local date time string
 */
export const formatLocalDateTime = (
  utcDateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }
): string => {
  const date = parseUTCDate(utcDateString);
  return new Intl.DateTimeFormat(navigator.language, options).format(date);
};

/**
 * Convert UTC date string to local date string (without time)
 * @param utcDateString - UTC date string from the database
 * @returns Formatted local date string
 */
export const formatLocalDate = (utcDateString: string): string => {
  return formatLocalDateTime(utcDateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Convert UTC date string to local time string (without date)
 * @param utcDateString - UTC date string from the database
 * @returns Formatted local time string
 */
export const formatLocalTime = (utcDateString: string): string => {
  return formatLocalDateTime(utcDateString, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

/**
 * Format date as relative time (e.g., "5 minutes ago")
 * @param utcDateString - UTC date string from the database
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (utcDateString: string): string => {
  const date = parseUTCDate(utcDateString);
  const now = new Date();
  
  // Get the time difference in milliseconds
  const diffMs = now.getTime() - date.getTime();
  
  // Handle negative time differences (should not happen often with parseUTCDate protection)
  if (diffMs < 0) {
    const absDiffMs = Math.abs(diffMs);
    // If less than 1 minute in the future, call it "just now"
    if (absDiffMs < 60000) {
      return 'just now';
    }
    
    // Otherwise show as "just now" with console warning
    console.warn(`Date is in the future: ${utcDateString}`);
    return 'just now';
  }
  
  // Convert to appropriate units
  const diffInSeconds = Math.floor(diffMs / 1000);
  
  if (diffInSeconds < 30) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}; 