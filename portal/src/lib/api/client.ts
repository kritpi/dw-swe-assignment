import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string | string[];
  statusCode?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }

  const data = error.response?.data as ApiErrorBody | undefined;
  const message = data?.error?.message ?? data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || `Request failed with ${error.response?.status ?? "unknown status"}`;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const data = error.response?.data as ApiErrorBody | undefined;
    return Promise.reject(
      new ApiError(
        getApiErrorMessage(error),
        data?.error?.code ?? "REQUEST_FAILED",
        error.response?.status,
        data?.error?.details,
      ),
    );
  },
);
