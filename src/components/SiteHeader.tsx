import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore, { selectIsAuthenticated } from '@/store/auth'

type NavItem = { label: string; href: string };

type Props = {
  actions?: ReactNode;
};

const navItems: NavItem[] = [
  { label: '仪表盘', href: '/' },
  { label: '消费管理', href: '/expenses' },
  { label: '存款管理', href: '/deposits' },
];

const SiteHeader = ({ actions }: Props) => {
  const { pathname: currentPath } = useLocation();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <Container sx={{ width: 'min(1200px, 92vw)' }}>
        <Toolbar disableGutters sx={{ py: 1.5, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #64d8ce, #f2c14e)',
                display: 'grid',
                placeItems: 'center',
                color: '#0f172a',
                fontWeight: 700,
                boxShadow: '0 0 24px rgba(100,216,206,0.35)',
              }}
            >
              FL
            </Box>
            <Typography fontWeight={700}>Flow-Ledger</Typography>
          </Stack>
          {isAuthenticated && <>
            <Stack direction="row" spacing={1}>
              {navItems.map((item) => {
                const isActive = item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href);
                return (
                  <Button
                    key={item.href}
                    component={Link}
                    to={item.href}
                    color="inherit"
                    variant={isActive ? 'contained' : 'text'}
                    sx={(theme) => ({
                      borderRadius: 999,
                      ...(isActive && {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        color: 'background.default',
                        boxShadow: '0 10px 20px rgba(100, 216, 206, 0.35)',
                      }),
                    })}
                    size="large"
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>
            {actions && <Box>{actions}</Box>}
          </>}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default SiteHeader;
