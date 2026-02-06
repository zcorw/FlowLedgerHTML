import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '@/api/auth';
import { enqueueSnackbar } from '@/store/snackbar';

type VerifyStatus = 'loading' | 'success' | 'error' | 'missing';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerifyStatus>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      return;
    }

    setStatus('loading');
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        enqueueSnackbar('邮箱验证成功', { severity: 'success' });
        navigate('/', { replace: true });
      })
      .catch((err) => {
        setStatus('error');
        enqueueSnackbar(err?.response?.data?.message || '邮箱验证失败，请稍后重试', {
          severity: 'error',
        });
      });
  }, [token]);

  const titleMap: Record<VerifyStatus, string> = {
    loading: '正在验证邮箱',
    success: '邮箱已验证',
    error: '邮箱验证失败',
    missing: '验证链接无效',
  };

  const descriptionMap: Record<VerifyStatus, string> = {
    loading: '请稍候，我们正在完成验证流程。',
    success: '你的邮箱已经验证成功，现在可以登录账户。',
    error: '验证过程中出现问题，请稍后再试或联系支持。',
    missing: '验证链接缺少必要的参数，请检查邮箱中的完整链接。',
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
            {titleMap[status]}
          </Typography>
          <Typography color="text.secondary">{descriptionMap[status]}</Typography>
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" component={RouterLink} to="/login">
              去登录
            </Button>
            <Button variant="outlined" component={RouterLink} to="/register">
              重新注册
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage;
