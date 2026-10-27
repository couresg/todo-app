"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api-client";
import { invalidateProgress, qk } from "@/lib/query";
import type { GoalCreateBody, GoalUpdateBody } from "@/types/api";

export function useGoals() {
  return useQuery({ queryKey: qk.goals(), queryFn: api.goals.list });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (b: GoalCreateBody) => api.goals.create(b),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, ...body }: GoalUpdateBody & { id: string }) => api.goals.update(id, body),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => api.goals.remove(id),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}
