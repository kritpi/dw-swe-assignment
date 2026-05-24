"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Concert, ReservationHistory } from "@/lib/portal";

const defaultPage = { page: 1, limit: 100 };
const queryKeys = {
  concerts: {
    all: ["concerts"] as const,
    user: () => ["concerts", "user", defaultPage] as const,
    admin: () => ["concerts", "admin", defaultPage] as const,
  },
  reservations: {
    all: ["reservations"] as const,
    adminHistory: () => ["reservations", "history", defaultPage] as const,
    myHistory: () => ["reservations", "me", defaultPage] as const,
  },
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CreateConcertPayload = {
  name: string;
  description: string;
  totalSeats: number;
};

async function getUserConcerts() {
  const response = await apiClient.get<PaginatedResponse<Concert>>("/concerts", {
    params: defaultPage,
  });
  return response.data.data;
}

async function getAdminConcerts() {
  const response = await apiClient.get<PaginatedResponse<Concert>>("/admin/concerts", {
    params: defaultPage,
  });
  return response.data.data;
}

async function getReservationHistory() {
  const response = await apiClient.get<PaginatedResponse<ReservationHistory>>(
    "/admin/reservations/history",
    { params: defaultPage },
  );
  return response.data.data;
}

async function getMyReservationHistory() {
  const response = await apiClient.get<PaginatedResponse<ReservationHistory>>(
    "/reservations/me",
    { params: defaultPage },
  );
  return response.data.data;
}

async function createConcert(payload: CreateConcertPayload) {
  await apiClient.post("/admin/concerts", payload);
}

async function deleteConcert(concertId: string) {
  await apiClient.delete(`/admin/concerts/${concertId}`);
}

async function reserveSeat(concertId: string) {
  await apiClient.post(`/reservations/concerts/${concertId}`);
}

async function cancelReservation(concertId: string) {
  await apiClient.delete(`/reservations/concerts/${concertId}`);
}

export function useUserConcerts() {
  return useQuery({
    queryKey: queryKeys.concerts.user(),
    queryFn: getUserConcerts,
  });
}

export function useAdminConcerts() {
  return useQuery({
    queryKey: queryKeys.concerts.admin(),
    queryFn: getAdminConcerts,
  });
}

export function useReservationHistory() {
  return useQuery({
    queryKey: queryKeys.reservations.adminHistory(),
    queryFn: getReservationHistory,
  });
}

export function useMyReservationHistory() {
  return useQuery({
    queryKey: queryKeys.reservations.myHistory(),
    queryFn: getMyReservationHistory,
  });
}

export function useCreateConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConcert,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
      ]),
  });
}

export function useDeleteConcert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConcert,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
      ]),
  });
}

export function useReserveSeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reserveSeat,
    onMutate: async (concertId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.concerts.user() });
      const previousConcerts = queryClient.getQueryData<Concert[]>(queryKeys.concerts.user());

      queryClient.setQueryData<Concert[]>(queryKeys.concerts.user(), (current) =>
        current?.map((concert) =>
          concert.id === concertId
            ? {
                ...concert,
                availableSeats: Math.max(0, concert.availableSeats - 1),
                reservedSeats: concert.reservedSeats + 1,
                hasReserved: true,
                reservationStatus: "RESERVED",
              }
            : concert,
        ),
      );

      return { previousConcerts };
    },
    onError: (_error, _concertId, context) => {
      queryClient.setQueryData(queryKeys.concerts.user(), context?.previousConcerts);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
      ]),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelReservation,
    onMutate: async (concertId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.concerts.user() });
      const previousConcerts = queryClient.getQueryData<Concert[]>(queryKeys.concerts.user());

      queryClient.setQueryData<Concert[]>(queryKeys.concerts.user(), (current) =>
        current?.map((concert) =>
          concert.id === concertId
            ? {
                ...concert,
                availableSeats: concert.availableSeats + 1,
                reservedSeats: Math.max(0, concert.reservedSeats - 1),
                hasReserved: false,
                reservationStatus: "CANCELED",
              }
            : concert,
        ),
      );

      return { previousConcerts };
    },
    onError: (_error, _concertId, context) => {
      queryClient.setQueryData(queryKeys.concerts.user(), context?.previousConcerts);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.concerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
      ]),
  });
}
