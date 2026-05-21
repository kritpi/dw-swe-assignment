export type Role = "USER" | "ADMIN";

export type ToastState = {
  kind: "success" | "error";
  message: string;
} | null;

export type LoginResponse = {
  accessToken: string;
};

export function normalizeRole(value: string | null): Role {
  return value?.trim().toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

export function getRoleLabel(role: Role) {
  return role === "ADMIN" ? "Admin" : "User";
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
