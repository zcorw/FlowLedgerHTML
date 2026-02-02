import { get, post } from './client';

export type JobCreate = {
  name: string;
  description?: string | null;
  rule: string;
  first_run_at: string; // ISO date-time
  advance_minutes?: number; // default: 0
  channel?: string; // default: telegram
  status?: string; // default: active
};

export type JobOut = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  rule: string;
  first_run_at: string; // ISO date-time
  advance_minutes: number;
  channel: string;
  status: string;
  created_at: string; // ISO date-time
  updated_at: string; // ISO date-time
};

export type JobRunOut = {
  id: number;
  job_id: number;
  period_key: string;
  scheduled_at: string; // ISO date-time
  sent_at: string | null; // ISO date-time
  status: string;
  created_at: string; // ISO date-time
  updated_at: string; // ISO date-time
};

export type ConfirmationCreate = {
  job_run_id: number;
  action: string;
  idempotency_key: string;
  payload?: Record<string, unknown> | null;
};

export type ConfirmationOut = {
  id: number;
  job_run_id: number;
  action: string;
  confirmed_at: string; // ISO date-time
  idempotency_key: string;
  payload: Record<string, unknown> | null;
  created_at: string; // ISO date-time
  updated_at: string; // ISO date-time
};

export type ListJobRunsParams = {
  status?: string;
  from?: string; // ISO date-time
  to?: string; // ISO date-time
};

/**
 * List scheduler jobs.
 * GET /jobs
 * Response: JobOut[]
 */
export async function listJobs() {
  return get<JobOut[]>('/jobs');
}

/**
 * Create scheduler job.
 * POST /jobs
 * Request: JobCreate
 * Response: JobOut
 */
export async function createJob(payload: JobCreate) {
  return post<JobOut>('/jobs', payload);
}

/**
 * List scheduler job runs with filters.
 * GET /job-runs
 * Response: JobRunOut[]
 */
export async function listJobRuns(params?: ListJobRunsParams) {
  return get<JobRunOut[]>('/job-runs', { params });
}

/**
 * Create confirmation for job run action.
 * POST /confirmations
 * Request: ConfirmationCreate
 * Response: ConfirmationOut
 */
export async function createConfirmation(payload: ConfirmationCreate) {
  return post<ConfirmationOut>('/confirmations', payload);
}
