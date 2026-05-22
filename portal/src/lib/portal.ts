import type { AuthUser } from "@/lib/auth";

export type Concert = {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  reservedSeats: number;
  availableSeats: number;
  hasReserved?: boolean;
  reservationStatus?: "RESERVED" | "CANCELED" | null;
};

export type ReservationHistory = {
  id: string;
  action: "RESERVE" | "CANCEL";
  actionAt: string;
  user: Pick<AuthUser, "fullName" | "email">;
  concert: { id: string; name: string };
};

export type DashboardStats = {
  totalSeats: number;
  reservedSeats: number;
  canceledCount: number;
};

export function getDashboardStats(
  concerts: Concert[],
  history: ReservationHistory[],
): DashboardStats {
  return {
    totalSeats: concerts.reduce((sum, concert) => sum + concert.totalSeats, 0),
    reservedSeats: concerts.reduce((sum, concert) => sum + concert.reservedSeats, 0),
    canceledCount: history.filter((row) => row.action === "CANCEL").length,
  };
}
