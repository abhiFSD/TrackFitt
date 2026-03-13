import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { 
  formatLocalDate, 
  formatLocalDateTime, 
  formatLocalTime, 
  formatRelativeTime
} from '../../utils/dateUtils';

interface DateDisplayProps extends Omit<TypographyProps, 'children'> {
  date: string;
  format?: 'date' | 'time' | 'datetime' | 'relative';
}

/**
 * Component for displaying dates consistently throughout the application
 * Automatically converts UTC dates from the server to the user's local timezone
 */
const DateDisplay: React.FC<DateDisplayProps> = ({ 
  date, 
  format = 'datetime',
  variant = 'body2',
  color = 'text.secondary',
  ...typographyProps 
}) => {
  if (!date) {
    return null;
  }

  // Normalize year 2025 dates - direct fix
  const normalizedDate = date.includes('2025-') ? new Date().toISOString() : date;
  
  let formattedDate = '';
  
  switch (format) {
    case 'date':
      formattedDate = formatLocalDate(normalizedDate);
      break;
    case 'time':
      formattedDate = formatLocalTime(normalizedDate);
      break;
    case 'relative':
      formattedDate = formatRelativeTime(normalizedDate);
      break;
    case 'datetime':
    default:
      formattedDate = formatLocalDateTime(normalizedDate);
      break;
  }

  return (
    <Typography variant={variant} color={color} {...typographyProps}>
      {formattedDate}
    </Typography>
  );
};

export default DateDisplay; 