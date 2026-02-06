import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  FormLabel,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { z } from 'zod';
import { LoginFormSchema, LoginFormValues } from '../validation/auth';
import { login } from '@/api/auth';
import { enqueueSnackbar } from '@/store/snackbar';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = LoginFormSchema.safeParse({ email: email.trim(), username: username.trim(), password });
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      parsed.error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path[0] as keyof LoginFormValues;
        nextErrors[path] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const values = parsed.data;
    login(values).then(() => (window.location.href = '/')).catch((err) => {
      enqueueSnackbar(err?.response?.data?.message || '登录失败，请稍后重试', { severity: 'error' });
    });
  };

  return (
    <Box pt={6} pb={6} display="flex" justifyContent="center" sx={{ maxWidth: '520px', margin: '0 auto' }}>
      <Stack spacing={4} sx={{ width: 'min(960px, 100%)' }}>
        <Stack spacing={1.5}>
          <Chip
            label="安全 · 自托管 · 多币种"
            sx={{ width: 'fit-content', background: 'rgba(255,255,255,0.08)' }}
          />
          <Typography variant="h4" fontWeight={700}>
            登录 Flow-Ledger
          </Typography>
          <Typography color="text.secondary">
            支持用户名密码登录，绑定后同步消费与存款数据。
          </Typography>
        </Stack>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                登录账号
              </Typography>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <FormControl fullWidth error={Boolean(errors.username)}>
                  <TextField
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    fullWidth
                    variant="outlined"
                  />
                  <FormHelperText>{errors.username}</FormHelperText>
                </FormControl>

                <FormControl fullWidth error={Boolean(errors.password)}>
                  <TextField
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="至少 8 位，推荐 12 位复杂密码"
                    fullWidth
                    variant="outlined"
                  />
                  <FormHelperText>{errors.password}</FormHelperText>
                </FormControl>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <MuiLink href="/forgot-password" underline="hover" sx={{ fontSize: 14 }}>
                    忘记密码
                  </MuiLink>
                  <MuiLink href="/register" underline="hover" sx={{ fontSize: 14 }}>
                    快速注册
                  </MuiLink>
                </Stack>

                <Button type="submit" variant="contained" color="primary" fullWidth size="large">
                  登录 / 绑定
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default AuthPage;
