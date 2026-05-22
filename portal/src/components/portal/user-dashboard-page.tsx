"use client";

import { useState } from "react";
import { ToastMessage } from "@/components/auth/toast-message";
import { ConcertList } from "@/components/portal/concert-list";
import { MetricGrid } from "@/components/portal/metric-grid";
import {
  useCancelReservation,
  useMyReservationHistory,
  useReserveSeat,
  useUserConcerts,
} from "@/hooks/use-portal-data";
import { getErrorMessage, type ToastState } from "@/lib/auth";

export function UserDashboardPage() {
  const [toast, setToast] = useState<ToastState>(null);
  const concertsQuery = useUserConcerts();
  const historyQuery = useMyReservationHistory();
  const reserveSeatMutation = useReserveSeat();
  const cancelReservationMutation = useCancelReservation();

  const loading =
    concertsQuery.isPending ||
    historyQuery.isPending ||
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
  const history = historyQuery.data ?? [];

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
        <section className="panel history-panel">
          <h2>My Reservations</h2>
          {historyQuery.isError ? (
            <p>{historyQuery.error.message}</p>
          ) : history.length ? (
            <div className="table-scroll">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Concert</th>
                    <th>Action</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id}>
                      <td>{row.concert.name}</td>
                      <td>
                        <span className={`action-badge action-badge--${row.action.toLowerCase()}`}>
                          {row.action}
                        </span>
                      </td>
                      <td>{new Date(row.actionAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No reservations yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
