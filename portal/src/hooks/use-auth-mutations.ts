import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { AuthUser, LoginResponse, Role } from "@/lib/auth";

type LoginPayload = {
  email: string;
  password: string;
  role: Role;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
};

async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

async function register(payload: RegisterPayload): Promise<void> {
  await apiClient.post("/users", payload);
}

async function getCurrentUser() {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
  });
}

export function useCurrentUserMutation() {
  return useMutation({
    mutationFn: getCurrentUser,
  });
}
