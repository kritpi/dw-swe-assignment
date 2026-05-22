"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Concert, ReservationHistory } from "@/lib/portal";

const userConcertsQueryKey = ["concerts", "user"] as const;
const adminConcertsQueryKey = ["concerts", "admin"] as const;
const reservationHistoryQueryKey = ["reservations", "history"] as const;

type CreateConcertPayload = {
  name: string;
  description: string;
  totalSeats: number;
};

async function getUserConcerts() {
  const response = await apiClient.get<Concert[]>("/concerts");
  return response.data;
}

async function getAdminConcerts() {
  const response = await apiClient.get<Concert[]>("/concerts/admin");
  return response.data;
}

async function getReservationHistory() {
  const response = await apiClient.get<ReservationHistory[]>("/reservations/history");
  return response.data;
}

async function createConcert(payload: CreateConcertPayload) {
  await apiClient.post("/concerts", payload);
}

async function deleteConcert(concertId: string) {
  await apiClient.delete(`/concerts/${concertId}`);
}

async function reserveSeat(concertId: string) {
  await apiClient.post(`/concerts/${concertId}/reservations`);
}

async function cancelReservation(concertId: string) {
  await apiClient.delete(`/concerts/${concertId}/reservations`);
}

export function useUserConcerts() {
  return useQuery({
    queryKey: userConcertsQueryKey,
    queryFn: getUserConcerts,
  });
}

export function useAdminConcerts() {
  return useQuery({
    queryKey: adminConcertsQueryKey,
    queryFn: getAdminConcerts,
  });
}

export function useReservationHistory() {
  return useQuery({
    queryKey: reservationHistoryQueryKey,
    queryFn: getReservationHistory,
  });
}

export function useCreateConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConcert,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminConcertsQueryKey }),
        queryClient.invalidateQueries({ queryKey: reservationHistoryQueryKey }),
      ]),
  });
}

export function useDeleteConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConcert,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminConcertsQueryKey }),
        queryClient.invalidateQueries({ queryKey: reservationHistoryQueryKey }),
      ]),
  });
}

export function useReserveSeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reserveSeat,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userConcertsQueryKey }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userConcertsQueryKey }),
  });
}
