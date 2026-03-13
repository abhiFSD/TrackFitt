import React, { useState, useMemo } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as ReadIcon,
  Delete as DeleteIcon,
  TokenOutlined as TokenIcon,
  Assignment as WorkoutIcon,
  Info as SystemIcon,
  FitnessCenter as ExerciseIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNotification } from '../../context/NotificationContext';
import { NotificationType } from '../../interfaces';
import DateDisplay from '../common/DateDisplay';
import { parseUTCDate } from '../../utils/dateUtils';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Sanitize notification timestamps to handle future dates
  // This uses the parseUTCDate function which has improved handling
  const sanitizedNotifications = useMemo(() => {
    return notifications.map(notification => {
      // Direct fix for the 2025 issue
      if (notification.created_at.includes('2025-')) {
        return {
          ...notification,
          created_at: new Date().toISOString()
        };
      }
      
      const now = new Date();
      
      // Use our more comprehensive date parser
      const parsedDate = parseUTCDate(notification.created_at);
      
      // If the date is still in the future, use current time
      if (parsedDate > now) {
        return {
          ...notification,
          created_at: now.toISOString()
        };
      }
      
      return notification;
    });
  }, [notifications]);
  
  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleReadAll = () => {
    markAllAsRead();
  };
  
  const handleReadNotification = (id: number) => {
    markAsRead(id);
  };
  
  const handleDeleteNotification = (id: number) => {
    deleteNotification(id);
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TOKEN_REQUEST:
      case NotificationType.TOKEN_APPROVED:
      case NotificationType.TOKEN_REJECTED:
        return <TokenIcon color="primary" />;
      case NotificationType.WORKOUT_COMPLETED:
        return <WorkoutIcon color="success" />;
      case NotificationType.NEW_EXERCISE:
        return <ExerciseIcon color="secondary" />;
      case NotificationType.ADMIN_NOTIFICATION:
        return <AdminIcon color="warning" />;
      case NotificationType.SYSTEM_NOTIFICATION:
      default:
        return <SystemIcon color="info" />;
    }
  };
  
  return (
    <>
      <IconButton
        color="inherit"
        aria-label="notifications"
        onClick={handleBellClick}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          overlap="circular"
          invisible={unreadCount === 0}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 350,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              onClick={handleReadAll}
              startIcon={<ReadIcon />}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {sanitizedNotifications.length === 0 ? (
          <MenuItem sx={{ py: 2 }}>
            <Typography color="text.secondary" align="center" sx={{ width: '100%' }}>
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {sanitizedNotifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.is_read ? 'transparent' : 'rgba(63, 81, 181, 0.08)',
                  '&:hover': {
                    bgcolor: notification.is_read 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(63, 81, 181, 0.12)',
                  },
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.is_read ? 'normal' : 'bold',
                          mr: 1
                        }}
                      >
                        {notification.title}
                      </Typography>
                      {!notification.is_read && (
                        <IconButton 
                          size="small" 
                          onClick={() => handleReadNotification(notification.id)}
                          sx={{ p: 0, ml: 1 }}
                        >
                          <ReadIcon fontSize="small" color="primary" />
                        </IconButton>
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {notification.message}
                      </Typography>
                      
                      <DateDisplay 
                        date={notification.created_at} 
                        format="relative" 
                        variant="caption" 
                        display="block"
                        sx={{ mt: 0.5 }}
                      />
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 