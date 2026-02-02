import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { enqueueSnackbar } from '@/store/snackbar';
import { schedulerJobSchema, type SchedulerJobFormValues } from '@/validation/scheduler';
import useDatePicker from '@/hooks/useDatePicker';

export type SchedulerJobDialogPayload = {
  name: string;
  description: string | null;
  rule: string;
  first_run_at: string;
  advance_minutes: number;
  channel: string;
  status: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SchedulerJobDialogPayload) => Promise<void> | void;
  initialValues?: Partial<SchedulerJobFormValues>;
  title?: string;
};

const buildDefaultForm = (initial?: Partial<SchedulerJobFormValues>): SchedulerJobFormValues => ({
  name: initial?.name ?? '',
  description: initial?.description ?? '',
  rule: initial?.rule ?? '',
  firstRunAt: initial?.firstRunAt ?? dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
  advanceMinutes: initial?.advanceMinutes ?? '0',
  channel: initial?.channel ?? 'telegram',
  status: initial?.status ?? 'active',
});

const SchedulerJobDialog = ({ open, onClose, onSubmit, initialValues, title }: Props) => {
  const [form, setForm] = useState<SchedulerJobFormValues>(() => buildDefaultForm(initialValues));
  const [errors, setErrors] = useState<Partial<Record<keyof SchedulerJobFormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [dateInputRef, openDatePicker] = useDatePicker();

  const resolvedTitle = useMemo(() => title ?? (initialValues ? '编辑任务' : '创建任务'), [title, initialValues]);

  useEffect(() => {
    if (open) {
      setForm(buildDefaultForm(initialValues));
      setErrors({});
      setIsSaving(false);
    }
  }, [open, initialValues]);

  const handleChange = (key: keyof SchedulerJobFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const parsed = schedulerJobSchema.safeParse({
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      rule: form.rule.trim(),
      firstRunAt: form.firstRunAt,
      advanceMinutes: form.advanceMinutes?.trim() || undefined,
      channel: form.channel.trim(),
      status: form.status.trim(),
    });
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof SchedulerJobFormValues, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SchedulerJobFormValues;
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      });
      setErrors(nextErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!validate()) return;

    const payload: SchedulerJobDialogPayload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      rule: form.rule.trim(),
      first_run_at: dayjs(form.firstRunAt).toISOString(),
      advance_minutes: form.advanceMinutes ? Number(form.advanceMinutes) : 0,
      channel: form.channel.trim(),
      status: form.status.trim(),
    };

    setIsSaving(true);
    try {
      await onSubmit(payload);
      enqueueSnackbar(initialValues ? '任务已更新' : '任务已创建', { severity: 'success' });
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || '提交失败，请稍后重试';
      enqueueSnackbar(message, { severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{resolvedTitle}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} pt={1}>
          <TextField
            label="任务名称"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />
          <TextField
            label="描述"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="规则"
            value={form.rule}
            onChange={(e) => handleChange('rule', e.target.value)}
            required
            error={!!errors.rule}
            helperText={errors.rule}
            fullWidth
          />
          <TextField
            label="首次执行时间"
            type="datetime-local"
            value={form.firstRunAt}
            onChange={(e) => handleChange('firstRunAt', e.target.value)}
            required
            error={!!errors.firstRunAt}
            helperText={errors.firstRunAt}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputRef={dateInputRef}
            inputProps={{
              onClick: openDatePicker,
              onFocus: openDatePicker,
            }}
          />
          <TextField
            label="提前分钟"
            value={form.advanceMinutes}
            onChange={(e) => handleChange('advanceMinutes', e.target.value)}
            error={!!errors.advanceMinutes}
            helperText={errors.advanceMinutes}
            fullWidth
          />
          <TextField
            label="通知渠道"
            value={form.channel}
            onChange={(e) => handleChange('channel', e.target.value)}
            required
            error={!!errors.channel}
            helperText={errors.channel}
            fullWidth
          />
          <TextField
            label="状态"
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            required
            error={!!errors.status}
            helperText={errors.status}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          取消
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchedulerJobDialog;
