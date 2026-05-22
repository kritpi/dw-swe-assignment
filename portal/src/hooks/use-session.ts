"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getDashboardPath, type AuthUser, type Role } from "@/lib/auth";

export const CURRENT_USER_QUERY_KEY = ["auth", "me"] as const;

async function getCurrentUser() {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}

async function logout() {
  await apiClient.post("/auth/logout");
}

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
  });
}

export function useRequireRole(role: Role) {
  const router = useRouter();
  const pathname = usePathname();
  const userQuery = useCurrentUser();

  useEffect(() => {
    if (userQuery.isPending) {
      return;
    }

    if (userQuery.isError) {
      router.replace(`/login?role=${role}`);
      return;
    }

    if (userQuery.data && userQuery.data.role !== role) {
      router.replace(getDashboardPath(userQuery.data.role));
    }
  }, [pathname, role, router, userQuery.data, userQuery.isError, userQuery.isPending]);

  return userQuery;
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      router.push("/");
    },
  });
}
