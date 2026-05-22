"use client";

import { useState } from "react";
import { ToastMessage } from "@/components/auth/toast-message";
import { ConcertList } from "@/components/portal/concert-list";
import { MetricGrid } from "@/components/portal/metric-grid";
import {
  useCancelReservation,
  useReserveSeat,
  useUserConcerts,
} from "@/hooks/use-portal-data";
import { getErrorMessage, type ToastState } from "@/lib/auth";

export function UserDashboardPage() {
  const [toast, setToast] = useState<ToastState>(null);
  const concertsQuery = useUserConcerts();
  const reserveSeatMutation = useReserveSeat();
  const cancelReservationMutation = useCancelReservation();

  const loading =
    concertsQuery.isPending ||
    reserveSeatMutation.isPending ||
    cancelReservationMutation.isPending;

  async function handleReserve(concertId: string) {
    setToast(null);

    try {
      await reserveSeatMutation.mutateAsync(concertId);
      setToast({ kind: "success", message: "Seat reserved." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    }
  }

  async function handleCancel(concertId: string) {
    setToast(null);

    try {
      await cancelReservationMutation.mutateAsync(concertId);
      setToast({ kind: "success", message: "Reservation canceled." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    }
  }

  const concerts = concertsQuery.data ?? [];

  return (
    <>
      {toast ? <ToastMessage toast={toast} onClose={() => setToast(null)} /> : null}
      <MetricGrid concerts={concerts} role="USER" />
      <div className="dashboard-stack">
        {concertsQuery.isError ? (
          <section className="panel empty-panel">{concertsQuery.error.message}</section>
        ) : (
          <ConcertList
            concerts={concerts}
            loading={loading}
            onCancel={handleCancel}
            onReserve={handleReserve}
          />
        )}
      </div>
    </>
  );
}
