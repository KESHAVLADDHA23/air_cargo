// Date utility functions for consistent formatting across the application

export interface DateFormatOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
}

/**
 * Formats a datetime string to a user-friendly format
 * Handles both SQLite datetime format and ISO string format
 * 
 * @param datetime - The datetime string to format
 * @param options - Intl.DateTimeFormatOptions for customizing the format
 * @returns Formatted date string or fallback message if invalid
 */
export const formatDateTime = (
  datetime: string | undefined | null, 
  options?: DateFormatOptions
): string => {
  if (!datetime) {
    return 'Date not available';
  }
  
  try {
    // Handle SQLite datetime format or ISO string
    let dateObj: Date;
    
    // SQLite CURRENT_TIMESTAMP format: '2024-01-15 14:30:25'
    // ISO format: '2024-01-15T14:30:25.000Z'
    if (datetime.includes('T')) {
      // Already in ISO format
      dateObj = new Date(datetime);
    } else {
      // SQLite format, convert to ISO
      const isoString = datetime.replace(' ', 'T') + 'Z';
      dateObj = new Date(isoString);
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date format:', datetime);
      return 'Invalid date';
    }
    
    // Default format options
    const defaultOptions: DateFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    return dateObj.toLocaleString('en-US', formatOptions);
  } catch (error) {
    console.warn('Error formatting date:', datetime, error);
    return 'Invalid date';
  }
};

/**
 * Formats datetime with short format (no year, no seconds)
 * Useful for flight times and recent activities
 */
export const formatShortDateTime = (datetime: string | undefined | null): string => {
  return formatDateTime(datetime, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats datetime with full format including year
 * Useful for booking dates and detailed timeline events
 */
export const formatFullDateTime = (datetime: string | undefined | null): string => {
  return formatDateTime(datetime, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats date only (no time)
 * Useful for date pickers and summary displays
 */
export const formatDateOnly = (datetime: string | undefined | null): string => {
  return formatDateTime(datetime, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Checks if a datetime string is valid
 */
export const isValidDateTime = (datetime: string | undefined | null): boolean => {
  if (!datetime) return false;
  
  try {
    let dateObj: Date;
    
    if (datetime.includes('T')) {
      dateObj = new Date(datetime);
    } else {
      const isoString = datetime.replace(' ', 'T') + 'Z';
      dateObj = new Date(isoString);
    }
    
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
};

/**
 * Converts SQLite datetime format to ISO string
 */
export const sqliteToIso = (sqliteDateTime: string): string => {
  if (sqliteDateTime.includes('T')) {
    return sqliteDateTime; // Already ISO format
  }
  return sqliteDateTime.replace(' ', 'T') + 'Z';
};

/**
 * Formats datetime with fallback options when primary date is not available
 * 
 * @param primaryDate - Primary datetime string to format
 * @param fallbackDate - Fallback datetime string if primary is not available
 * @param fallbackLabel - Label to append to fallback date (e.g., "(Estimated)")
 * @param options - Format options for display
 * @returns Formatted date string with fallback handling
 */
export const formatDateTimeWithFallback = (
  primaryDate: string | undefined | null,
  fallbackDate: string | undefined | null,
  fallbackLabel?: string,
  options?: DateFormatOptions
): string => {
  // Try primary date first
  if (primaryDate && isValidDateTime(primaryDate)) {
    const formatted = formatDateTime(primaryDate, options);
    if (formatted !== 'Date not available' && formatted !== 'Invalid date') {
      return formatted;
    }
  }
  
  // Fall back to secondary date
  if (fallbackDate && isValidDateTime(fallbackDate)) {
    const formatted = formatDateTime(fallbackDate, options);
    if (formatted !== 'Date not available' && formatted !== 'Invalid date') {
      return formatted + (fallbackLabel ? ` ${fallbackLabel}` : '');
    }
  }
  
  return 'Date not available';
};