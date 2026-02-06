import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '@/api/auth';
import { enqueueSnackbar } from '@/store/snackbar';
import { ResetPasswordFormValues, ResetPasswordSchema } from '@/validation/auth';

type ResetStatus = 'idle' | 'submitting' | 'success' | 'error' | 'missing';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [status, setStatus] = useState<ResetStatus>('idle');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordFormValues, string>>>({});

  useEffect(() => {
    if (!token) {
      setStatus('missing');
    }
  }, [token]);

  const disabled = useMemo(() => status === 'submitting' || status === 'success', [status]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      setStatus('missing');
      enqueueSnackbar('重置链接无效，请检查邮箱中的完整链接', { severity: 'error' });
      return;
    }

    const parsed = ResetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      parsed.error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path[0] as keyof ResetPasswordFormValues;
        nextErrors[path] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStatus('submitting');
    confirmPasswordReset(token, parsed.data.password)
      .then(() => {
        setStatus('success');
        enqueueSnackbar('密码重置成功，即将跳转登录', { severity: 'success' });
        window.setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      })
      .catch((err) => {
        setStatus('error');
        enqueueSnackbar(err?.response?.data?.message || '密码重置失败，请稍后重试', {
          severity: 'error',
        });
      });
  };

  return (
    <Box pt={6} pb={6} display="flex" justifyContent="center" sx={{ maxWidth: '520px', margin: '0 auto' }}>
      <Paper
        sx={{
          width: '100%',
          p: 3,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            重置密码
          </Typography>
          <Typography color="text.secondary">
            请输入新的账户密码，完成后将自动跳转到登录页。
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl fullWidth error={Boolean(errors.password)}>
                <TextField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="请输入新密码"
                  disabled={disabled}
                  fullWidth
                  variant="outlined"
                  label="新密码"
                />
                <FormHelperText>{errors.password || '建议至少 8 位密码'}</FormHelperText>
              </FormControl>

              <FormControl fullWidth error={Boolean(errors.confirmPassword)}>
                <TextField
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="repassword"
                  placeholder="请再次输入新密码"
                  disabled={disabled}
                  fullWidth
                  variant="outlined"
                  label="重复密码"
                />
                <FormHelperText>{errors.confirmPassword || '确保两次输入一致'}</FormHelperText>
              </FormControl>

              <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={disabled}>
                {status === 'submitting' ? '提交中...' : '确认重置'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
