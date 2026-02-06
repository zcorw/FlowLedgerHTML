import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '@/api/auth';
import { enqueueSnackbar } from '@/store/snackbar';
import { ForgotPasswordFormValues, ForgotPasswordSchema } from '@/validation/auth';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = ForgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      parsed.error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path[0] as keyof ForgotPasswordFormValues;
        nextErrors[path] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    requestPasswordReset(parsed.data.email)
      .then(() => {
        enqueueSnackbar('邮件发送成功，请检查邮箱中的重置链接', { severity: 'success' });
        navigate('/login', { replace: true });
      })
      .catch((err) => {
        enqueueSnackbar(err?.response?.data?.message || '发送失败，请稍后重试', { severity: 'error' });
      })
      .finally(() => {
        setSubmitting(false);
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
            忘记密码
          </Typography>
          <Typography color="text.secondary">
            输入你的邮箱，我们会发送一封重置密码的邮件。
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl fullWidth error={Boolean(errors.email)}>
                <TextField
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hi@flow-ledger.io"
                  disabled={submitting}
                  fullWidth
                  variant="outlined"
                  label="邮箱"
                />
                <FormHelperText>{errors.email || '用于接收重置密码邮件'}</FormHelperText>
              </FormControl>

              <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={submitting}>
                {submitting ? '发送中...' : '发送重置邮件'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
