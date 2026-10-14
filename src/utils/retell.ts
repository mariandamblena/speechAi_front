import type { JobModel } from '@/types';

// Retell's raw combined_cost is USD cents; internal estimated costs are USD.
export function getCallCostUsd(job: Partial<Pick<JobModel, 'call_result' | 'estimated_cost'>>): number {
  const cents = job.call_result?.summary?.call_cost?.combined_cost;
  return cents == null ? (job.estimated_cost ?? 0) : cents / 100;
}
