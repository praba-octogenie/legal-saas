import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Badge,
  CircularProgress,
  Button,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'unread' | 'read' | 'archived';
  link?: string;
  createdAt: string;
}

interface NotificationsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  anchorEl,
  open,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ notifications: Notification[]; total: number }>(
        '/api/communication/notifications'
      );
      setNotifications(response.data.notifications);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('/api/communication/notifications/read-all');
      // Update local state
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          status: 'read',
        }))
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (notification.status === 'unread') {
        await axios.patch(`/api/communication/notifications/${notification.id}/read`);
      }
      
      // Navigate to link if provided
      if (notification.link) {
        router.push(notification.link);
      }
      
      onClose();
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'success':
        return <SuccessIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const unreadCount = notifications.filter(
    (notification) => notification.status === 'unread'
  ).length;

  return (
    <Menu
      anchorEl={anchorEl}
      id="notifications-menu"
      keepMounted
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          maxHeight: 400,
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {t('notifications')}
          {unreadCount > 0 && (
            <Badge
              badgeContent={unreadCount}
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        {unreadCount > 0 && (
          <Button size="small" onClick={handleMarkAllAsRead}>
            {t('markAllAsRead')}
          </Button>
        )}
      </Box>
      
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>{t('noNotifications')}</Typography>
        </Box>
      ) : (
        notifications.map((notification) => (
          <MenuItem
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            sx={{
              opacity: notification.status === 'read' ? 0.7 : 1,
              backgroundColor: notification.status === 'unread' ? 'action.hover' : 'inherit',
            }}
          >
            <ListItemIcon>
              {getNotificationIcon(notification.type)}
            </ListItemIcon>
            <ListItemText
              primary={notification.title}
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {notification.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Typography>
                </React.Fragment>
              }
            />
          </MenuItem>
        ))
      )}
      
      <Divider />
      
      <Box sx={{ p: 1 }}>
        <Button
          fullWidth
          size="small"
          onClick={() => {
            router.push('/notifications');
            onClose();
          }}
        >
          {t('viewAllNotifications')}
        </Button>
      </Box>
    </Menu>
  );
};

export default NotificationsMenu;