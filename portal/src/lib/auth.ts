export type Role = "USER" | "ADMIN";

export type ToastState = {
  kind: "success" | "error";
  message: string;
} | null;

export type LoginResponse = {
  accessToken: string;
};

export type AuthUser = {
  sub?: string;
  id?: string;
  fullName?: string;
  email?: string;
  role: Role;
};

export function normalizeRole(value: string | null): Role {
  return value?.trim().toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

export function getRoleLabel(role: Role) {
  return role === "ADMIN" ? "Admin" : "User";
}

export function getDashboardPath(role: Role) {
  return role === "ADMIN" ? "/admin" : "/user";
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}
