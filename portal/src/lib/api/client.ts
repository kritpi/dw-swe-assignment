import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }

  const message = error.response?.data?.message;

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
  (error) => Promise.reject(new Error(getApiErrorMessage(error))),
);
