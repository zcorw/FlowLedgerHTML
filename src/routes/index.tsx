import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from '@/pages/dashboard';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import VerifyEmailPage from '@/pages/VerifyEmail';
import ResetPasswordPage from '@/pages/ResetPassword';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import ExpensesPage from '@/pages/Expenses';
import Deposits from '@/pages/Deposits';
import SchedulerPage from '@/pages/Scheduler';
import useAuthStore, { selectIsAuthenticated } from '@/store/auth';

const RequireAuth = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const PlaceholderPage = ({ title, description }: { title: string; description?: string }) => (
  <Box pt={6} pb={4}>
    <Stack spacing={2} alignItems="center" textAlign="center">
      <Typography variant="h4" fontWeight={700}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" maxWidth={520}>
          {description}
        </Typography>
      )}
      <Button variant="contained" component={Link} to="/" sx={{ mt: 1 }}>
        返回仪表盘
      </Button>
    </Stack>
  </Box>
);

const AppRoutes = () => (
  <Routes>
    <Route element={<RequireAuth />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/deposits" element={<Deposits />} />
      <Route path="/scheduler" element={<SchedulerPage />} />
    </Route>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="*" element={<PlaceholderPage title="未找到页面" description="请返回仪表盘查看主要数据。" />} />
  </Routes>
);

export default AppRoutes;
