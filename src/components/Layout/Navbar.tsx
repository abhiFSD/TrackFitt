import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
  Badge,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Chip,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  FitnessCenter as WorkoutIcon,
  EventNote as ScheduledHistoryIcon,
  History as HistoryIcon,
  EmojiEvents as TokensIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon,
  SupervisorAccount as AdminIcon,
  Add as AddIcon,
  FitnessCenter as FitnessCenterIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useToken } from '../../context/TokenContext';
import NotificationBell from '../Notification/NotificationBell';

const Navbar: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { tokenBalance, refreshTokenBalance } = useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Debug: Log token balance changes
  useEffect(() => {
    console.log("Current token balance:", tokenBalance);
    if (isAuthenticated) {
      refreshTokenBalance();
    }
  }, [tokenBalance, isAuthenticated, refreshTokenBalance]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Workouts', icon: <WorkoutIcon />, path: '/workouts' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
    { text: 'Exercises', icon: <FitnessCenterIcon />, path: '/exercises' },
    { text: 'Tokens', icon: <TokensIcon />, path: '/tokens' },
  ];

  // Add admin menu items if the user is an admin
  if (currentUser?.role === 'admin') {
    menuItems.push(
      { text: 'Token Management', icon: <TokensIcon />, path: '/admin/tokens' },
      { text: 'User Management', icon: <AdminIcon />, path: '/admin/users' },
      { text: 'Exercises', icon: <WorkoutIcon />, path: '/admin/exercises' }
    );
  }

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box 
        sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
          HappenAI Fitness
        </Typography>
        <IconButton 
          onClick={handleDrawerToggle} 
          edge="end"
          sx={{ display: { sm: 'none' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* Debug indicator for user role */}
      {currentUser && (
        <Box sx={{ 
          p: 1, 
          backgroundColor: currentUser.role === 'admin' ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="caption" color="textSecondary">
            User Role: <strong>{currentUser.role}</strong>
          </Typography>
        </Box>
      )}
      
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.path} 
            disablePadding 
            sx={{ mb: 0.5 }}
          >
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={handleDrawerToggle}
              sx={{
                borderRadius: 1.5,
                py: 1.25,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(58, 134, 255, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(58, 134, 255, 0.12)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: theme.palette.text.secondary }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontSize: '0.95rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {isAuthenticated && (
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            p: 2, 
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ py: 1.25 }}
          >
            Logout
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          zIndex: theme.zIndex.drawer + 1,
        }}
        elevation={0}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 70 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 700,
              color: theme.palette.primary.main,
              textDecoration: 'none',
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              '&:hover': {
                color: theme.palette.primary.dark,
              },
            }}
          >
            HappenAI Fitness
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                sx={{
                  color: location.pathname === item.path 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                  mx: 0.5,
                  px: 1.5,
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  position: 'relative',
                  '&::after': location.pathname === item.path 
                    ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 6,
                        left: 8,
                        right: 8,
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: theme.palette.primary.main,
                      }
                    : {},
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            {isAuthenticated && (
              <>
                <Chip
                  icon={<TokensIcon sx={{ fontSize: 16 }} />}
                  label={`${tokenBalance ?? 0} Tokens`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    mr: 2, 
                    height: 32,
                    borderRadius: 16,
                    px: 0.5,
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'flex' } 
                  }}
                />
                
                <NotificationBell />
                
                <IconButton
                  onClick={handleProfileMenuOpen}
                  size="small"
                  edge="end"
                  aria-label="account of current user"
                  aria-haspopup="true"
                  sx={{ 
                    p: 0.5,
                    mr: { xs: 1, sm: 2 },
                    border: `2px solid ${theme.palette.primary.light}`,
                    '&:hover': {
                      backgroundColor: 'rgba(58, 134, 255, 0.08)',
                    },
                  }}
                >
                  <Avatar 
                    alt={currentUser?.username || 'User'} 
                    src={currentUser?.profile?.profile_image_url || undefined}
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: theme.palette.primary.main, 
                      fontSize: '1rem' 
                    }}
                  >
                    {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </>
            )}
            
            {!isAuthenticated && (
              <Box sx={{ display: 'flex' }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1, display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Sign In
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  color="primary"
                  variant="contained"
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            boxShadow: 3,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* User profile menu */}
      <Menu
        anchorEl={anchorEl}
        id="profile-menu"
        keepMounted
        open={isMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            borderRadius: 2,
            minWidth: 180,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {currentUser && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {currentUser.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser.email}
            </Typography>
          </Box>
        )}
        
        <Divider />
        
        <MenuItem 
          component={RouterLink} 
          to="/profile"
          onClick={handleMenuClose}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        
        <MenuItem 
          component={RouterLink} 
          to="/tokens"
          onClick={handleMenuClose}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
            <TokensIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Tokens" />
        </MenuItem>
        
        <MenuItem 
          component={RouterLink} 
          to="/profile/ai-history"
          onClick={handleMenuClose}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="AI History" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ py: 1.5, px: 2, color: theme.palette.error.main }}
        >
          <ListItemIcon sx={{ color: theme.palette.error.main }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar; 