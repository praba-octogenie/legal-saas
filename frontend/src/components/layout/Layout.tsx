import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Container,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  AccountCircle,
  Brightness4,
  Brightness7,
  Translate,
  Notifications,
} from '@mui/icons-material';

import { selectUser } from '@/store/slices/authSlice';
import { selectSidebarOpen, setSidebarOpen, toggleDarkMode, setLanguage } from '@/store/slices/uiSlice';
import { mainListItems, secondaryListItems } from './listItems';
import NotificationsMenu from './NotificationsMenu';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const user = useSelector(selectUser);
  const sidebarOpen = useSelector(selectSidebarOpen);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  
  const isMenuOpen = Boolean(anchorEl);
  const isLangMenuOpen = Boolean(langAnchorEl);
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);
  
  useEffect(() => {
    // Close drawer on mobile when route changes
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  }, [router.pathname, isMobile, dispatch]);
  
  const handleDrawerOpen = () => {
    dispatch(setSidebarOpen(true));
  };
  
  const handleDrawerClose = () => {
    dispatch(setSidebarOpen(false));
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };
  
  const handleLangMenuClose = () => {
    setLangAnchorEl(null);
  };
  
  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
    handleLangMenuClose();
  };
  
  const handleLogout = () => {
    router.push('/auth/logout');
    handleMenuClose();
  };
  
  const handleProfile = () => {
    router.push('/profile');
    handleMenuClose();
  };
  
  const handleSettings = () => {
    router.push('/settings');
    handleMenuClose();
  };
  
  const handleThemeToggle = () => {
    dispatch(toggleDarkMode());
  };
  
  const menuId = 'primary-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      id={menuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleProfile}>
        <ListItemIcon>
          <AccountCircle fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('profile')} />
      </MenuItem>
      <MenuItem onClick={handleSettings}>
        <ListItemIcon>
          <AccountCircle fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('settings')} />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemText primary={t('logout')} />
      </MenuItem>
    </Menu>
  );
  
  const langMenuId = 'language-menu';
  const renderLangMenu = (
    <Menu
      anchorEl={langAnchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      id={langMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isLangMenuOpen}
      onClose={handleLangMenuClose}
    >
      <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('hi')}>हिन्दी</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('bn')}>বাংলা</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('te')}>తెలుగు</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('ta')}>தமிழ்</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('mr')}>मराठी</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('gu')}>ગુજરાતી</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('kn')}>ಕನ್ನಡ</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('ml')}>മലയാളം</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('pa')}>ਪੰਜਾਬੀ</MenuItem>
      <MenuItem onClick={() => handleLanguageChange('ur')}>اردو</MenuItem>
    </Menu>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(sidebarOpen && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            sx={{
              marginRight: '36px',
              ...(sidebarOpen && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            {process.env.NEXT_PUBLIC_APP_NAME || 'Legal CRM'}
          </Typography>
          
          <IconButton color="inherit" onClick={handleThemeToggle}>
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          <IconButton
            color="inherit"
            aria-label="change language"
            aria-controls={langMenuId}
            aria-haspopup="true"
            onClick={handleLangMenuOpen}
          >
            <Translate />
          </IconButton>
          
          <IconButton
            color="inherit"
            aria-label="show notifications"
            aria-controls="notifications-menu"
            aria-haspopup="true"
            onClick={handleNotificationsMenuOpen}
          >
            <Notifications />
          </IconButton>
          
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-controls={menuId}
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              alt={user?.name || 'User'}
              src="/static/images/avatar/1.jpg"
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={sidebarOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          ...(sidebarOpen && {
            ...{
              width: drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }),
          ...(!sidebarOpen && {
            ...{
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              overflowX: 'hidden',
              width: theme.spacing(7),
              [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
              },
            },
          }),
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {mainListItems}
          <Divider sx={{ my: 1 }} />
          {secondaryListItems}
        </List>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          pt: 8,
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {children}
        </Container>
      </Box>
      
      {renderMenu}
      {renderLangMenu}
      <NotificationsMenu
        anchorEl={notificationsAnchorEl}
        open={isNotificationsMenuOpen}
        onClose={handleNotificationsMenuClose}
      />
    </Box>
  );
};

export default Layout;