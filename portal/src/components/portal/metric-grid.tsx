import { getDashboardStats, type Concert, type ReservationHistory } from "@/lib/portal";
import type { Role } from "@/lib/auth";

export function MetricGrid({
  role,
  concerts,
  history = [],
}: {
  role: Role;
  concerts: Concert[];
  history?: ReservationHistory[];
}) {
  const stats = getDashboardStats(concerts, history);

  return (
    <section className={`metric-grid ${role === "USER" ? "metric-grid--user" : ""}`}>
      <Metric label="Total of seats" value={stats.totalSeats} />
      <Metric label="Reserve" value={stats.reservedSeats} />
      {role === "ADMIN" ? <Metric label="Cancel" value={stats.canceledCount} /> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </article>
  );
}
