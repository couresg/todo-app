"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api-client";
import { invalidateProgress, qk } from "@/lib/query";
import type { WeeklyPlanCreateBody, WeeklyPlanUpdateBody } from "@/types/api";

export function useWeeklyPlans(goalId?: string) {
  return useQuery({ queryKey: qk.plans(goalId), queryFn: () => api.plans.list(goalId) });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (b: WeeklyPlanCreateBody) => api.plans.create(b),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, ...body }: WeeklyPlanUpdateBody & { id: string }) => api.plans.update(id, body),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => api.plans.remove(id),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}
