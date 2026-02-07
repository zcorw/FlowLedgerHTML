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
import { registerSchema, RegisterFormValues } from '../validation/auth';
import { register } from '../api/auth';
import { enqueueSnackbar } from '@/store/snackbar';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ email: email.trim(), username: username.trim(), password });
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      parsed.error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path[0] as keyof RegisterFormValues;
        nextErrors[path] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const values = parsed.data;
    register(values).then(() => {
      enqueueSnackbar('注册成功！', { severity: 'success' });
      window.location.href = '/';
    }).catch((err) => {
      enqueueSnackbar(err?.response?.data?.message || '注册失败，请稍后重试', { severity: 'error' });
    });
  };

  return (
    <Box pt={6} pb={6} display="flex" justifyContent="center" sx={{ maxWidth: '520px', margin: '0 auto' }}>
      <Stack spacing={4} sx={{ width: 'min(960px, 100%)' }}>
        <Stack spacing={1.5}>
          <Chip label="安全 · 自托管 · 多币种" sx={{ width: 'fit-content', background: 'rgba(255,255,255,0.08)' }} />
          <Typography variant="h4" fontWeight={700}>
            注册新账号
          </Typography>
          <Typography color="text.secondary">创建个人账户以同步消费与存款数据。</Typography>
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
                注册账号
              </Typography>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <FormControl fullWidth error={Boolean(errors.email)}>
                  <TextField
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hi@flow-ledger.io"
                    fullWidth
                    variant="outlined"
                    label="邮箱"
                  />
                  <FormHelperText>{errors.email || '用于登录与找回密码'}</FormHelperText>
                </FormControl>

                <FormControl fullWidth error={Boolean(errors.username)}>
                  <TextField
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    fullWidth
                    variant="outlined"
                    label="用户名"
                  />
                  <FormHelperText>{errors.username || '仅支持字母/数字/下划线'}</FormHelperText>
                </FormControl>

                <FormControl fullWidth error={Boolean(errors.password)}>
                  <TextField
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="至少 8 位，推荐 12 位复杂密码"
                    fullWidth
                    variant="outlined"
                    label="密码"
                  />
                  <FormHelperText>{errors.password || '建议 12 位及以上复杂密码'}</FormHelperText>
                </FormControl>

                <Button type="submit" variant="contained" color="primary" fullWidth size="large">
                  创建账号
                </Button>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <MuiLink href="/login" underline="hover" sx={{ fontSize: 14 }}>
                    已有账号？去登录
                  </MuiLink>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default RegisterPage;
