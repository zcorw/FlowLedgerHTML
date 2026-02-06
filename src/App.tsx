import { IconButton, Menu, MenuItem } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import SiteHeader from './components/SiteHeader';
import AppRoutes from './routes';
import GlobalSnackbar from './components/GlobalSnackbar';
import useAuthStore from './store/auth';

function App() {
  const [accountMenuAnchor, setAccountMenuAnchor] =
    useState<null | HTMLElement>(null);
  const { clearSession } = useAuthStore();
  const accountMenuOpen = Boolean(accountMenuAnchor);

  const handleAccountMenuOpen = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleLogout = () => {
    clearSession();
    handleAccountMenuClose();
  };

  return (
    <>
      <SiteHeader
        actions={
          <>
            <IconButton
              size='large'
              onClick={handleAccountMenuOpen}
              aria-controls={accountMenuOpen ? 'account-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={accountMenuOpen ? 'true' : undefined}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id='account-menu'
              anchorEl={accountMenuAnchor}
              open={accountMenuOpen}
              onClose={handleAccountMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
            >
              <MenuItem onClick={handleLogout}>退出账号</MenuItem>
            </Menu>
          </>
        }
      />
      <Layout>
        <AppRoutes />
      </Layout>
      <GlobalSnackbar />
    </>
  );
}

export default App;
