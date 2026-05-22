"use client";

import { useReservationHistory } from "@/hooks/use-portal-data";

export function AdminHistoryPage() {
  const historyQuery = useReservationHistory();
  const history = historyQuery.data ?? [];

  return (
    <section className="panel history-panel">
      <h2>Reservation History</h2>
      {historyQuery.isError ? (
        <p>{historyQuery.error.message}</p>
      ) : history.length ? (
        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Concert</th>
                <th>Action</th>
                <th>User</th>
                <th>Email</th>
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
                  <td>{row.user.fullName || "-"}</td>
                  <td>{row.user.email}</td>
                  <td>{new Date(row.actionAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No reservation history yet.</p>
      )}
    </section>
  );
}
