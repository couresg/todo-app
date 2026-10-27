"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/Toast";
import { api, type TodoQuery } from "@/lib/api-client";
import { invalidateProgress, qk } from "@/lib/query";
import type { TodoCreateBody, TodoUpdateBody } from "@/types/api";

export function useTodos(q: TodoQuery, enabled = true) {
  return useQuery({ queryKey: qk.todos(q), queryFn: () => api.todos.list(q), enabled });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (b: TodoCreateBody) => api.todos.create(b),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, ...body }: TodoUpdateBody & { id: string }) => api.todos.update(id, body),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => api.todos.remove(id),
    onError: (e: Error) => toast(e.message),
    onSettled: () => invalidateProgress(qc),
  });
}
