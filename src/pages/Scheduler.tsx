import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import dayjs from 'dayjs';
import ConfirmDialog from '@/components/ConfirmDialog';
import SchedulerJobDialog, { type SchedulerJobDialogPayload } from '@/components/Dialogs/SchedulerJobDialog';
import { createJob, listJobRuns, listJobs, type JobOut, type JobRunOut } from '@/api/scheduler';
import { enqueueSnackbar } from '@/store/snackbar';
import type { SchedulerJobFormValues } from '@/validation/scheduler';

const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value;
};

const toFormValues = (job: JobOut): SchedulerJobFormValues => ({
  name: job.name ?? '',
  description: job.description ?? '',
  rule: job.rule ?? '',
  firstRunAt: job.first_run_at ? dayjs(job.first_run_at).format('YYYY-MM-DDTHH:mm') : '',
  advanceMinutes: String(job.advance_minutes ?? 0),
  channel: job.channel ?? 'telegram',
  status: job.status ?? 'active',
});

const SchedulerPage = () => {
  const [jobs, setJobs] = useState<JobOut[]>([]);
  const [jobRuns, setJobRuns] = useState<JobRunOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOut | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; job?: JobOut }>({ open: false });
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const jobMap = useMemo(() => {
    return jobs.reduce<Record<number, JobOut>>((acc, job) => {
      acc[job.id] = job;
      return acc;
    }, {});
  }, [jobs]);

  const upcomingRuns = useMemo(() => {
    const now = dayjs();
    return jobRuns
      .filter((run) => run.scheduled_at && dayjs(run.scheduled_at).isAfter(now))
      .sort((a, b) => dayjs(a.scheduled_at).valueOf() - dayjs(b.scheduled_at).valueOf())
      .slice(0, 5);
  }, [jobRuns]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, runsRes] = await Promise.all([
          listJobs(),
          listJobRuns({ from: dayjs().startOf('day').toISOString() }),
        ]);
        setJobs(jobsRes ?? []);
        setJobRuns(runsRes ?? []);
      } catch (error: any) {
        const message = error?.response?.data?.error?.message || error?.message || '加载任务失败';
        enqueueSnackbar(message, { severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const handleOpenCreate = () => {
    setEditingJob(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (job: JobOut) => {
    setEditingJob(job);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmitJob = async (payload: SchedulerJobDialogPayload) => {
    if (editingJob) {
      const next = {
        ...editingJob,
        name: payload.name,
        description: payload.description,
        rule: payload.rule,
        first_run_at: payload.first_run_at,
        advance_minutes: payload.advance_minutes,
        channel: payload.channel,
        status: payload.status,
        updated_at: new Date().toISOString(),
      };
      setJobs((prev) => prev.map((job) => (job.id === editingJob.id ? next : job)));
      return;
    }
    await createJob(payload);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteRequest = (job: JobOut) => {
    setConfirmState({ open: true, job });
  };

  const handleCloseConfirm = () => {
    if (deleting) return;
    setConfirmState({ open: false, job: undefined });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.job) return;
    setDeleting(true);
    try {
      setJobs((prev) => prev.filter((job) => job.id !== confirmState.job?.id));
      enqueueSnackbar('任务已删除', { severity: 'success' });
      setConfirmState({ open: false, job: undefined });
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || '删除失败，请稍后重试';
      enqueueSnackbar(message, { severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box pt={6}>
      <Stack spacing={3}>
        <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" style={{ fontWeight: 700 }}>
            任务管理
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpenCreate}>
            创建任务
          </Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight={700}>
                    即将到来
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    接下来需要处理的任务提醒
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack spacing={1.5}>
                    {upcomingRuns.length ? (
                      upcomingRuns.map((run) => (
                        <Stack key={run.id} spacing={0.5}>
                          <Typography fontWeight={600}>
                            {jobMap[run.job_id]?.name || `任务 #${run.job_id}`}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {formatDateTime(run.scheduled_at)}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={run.status} />
                          </Stack>
                        </Stack>
                      ))
                    ) : (
                      <Typography color="text.secondary">暂无即将到来的任务</Typography>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6" fontWeight={700}>
                    任务列表
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {loading ? '加载中...' : `共 ${jobs.length} 条任务`}
                  </Typography>
                  <Divider />
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>任务</TableCell>
                        <TableCell>规则</TableCell>
                        <TableCell>首次执行</TableCell>
                        <TableCell>状态</TableCell>
                        <TableCell align="right">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.length ? (
                        jobs.map((job) => (
                          <TableRow key={job.id} hover>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography fontWeight={600}>{job.name}</Typography>
                                <Typography color="text.secondary" variant="caption">
                                  {job.channel} · 提前 {job.advance_minutes} 分钟
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{job.rule}</TableCell>
                            <TableCell>{formatDateTime(job.first_run_at)}</TableCell>
                            <TableCell>
                              <Chip size="small" label={job.status} />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="编辑">
                                <IconButton size="small" onClick={() => handleOpenEdit(job)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="删除">
                                <IconButton size="small" color="error" onClick={() => handleDeleteRequest(job)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography color="text.secondary">暂无任务，请先创建</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      <SchedulerJobDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitJob}
        initialValues={editingJob ? toFormValues(editingJob) : undefined}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="确认删除"
        description={confirmState.job ? `确认删除任务“${confirmState.job.name}”吗？` : '确认删除任务？'}
        onCancel={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        confirmText="确认删除"
        loading={deleting}
      />
    </Box>
  );
};

export default SchedulerPage;
