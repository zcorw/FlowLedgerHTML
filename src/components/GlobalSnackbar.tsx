import { Alert, Snackbar } from '@mui/material';
import useSnackbarStore from '../store/snackbar';

const GlobalSnackbar = () => {
  const { open, message, severity, duration, hide } = useSnackbarStore();

  const handleClose = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    hide();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ minWidth: 320 }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
