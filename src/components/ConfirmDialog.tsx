import type { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
};

const ConfirmDialog = ({
  open,
  title = '确认操作',
  description,
  onCancel,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
}: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel}>
      <DialogTitle>{title}</DialogTitle>
      {description ? (
        <DialogContent>
          {typeof description === 'string' ? <Typography>{description}</Typography> : description}
        </DialogContent>
      ) : null}
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button color="error" onClick={onConfirm} disabled={loading}>
          {loading ? '处理中...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
