import type { Concert } from "@/lib/portal";

export function ConcertList({
  concerts,
  admin = false,
  loading,
  onDelete,
  onReserve,
  onCancel,
}: {
  concerts: Concert[];
  admin?: boolean;
  loading: boolean;
  onDelete?: (concertId: string) => void;
  onReserve?: (concertId: string) => void;
  onCancel?: (concertId: string) => void;
}) {
  if (!concerts.length) {
    return <section className="panel empty-panel">No concerts yet.</section>;
  }

  return (
    <section className="concert-grid">
      {concerts.map((concert) => (
        <article className="panel concert-card" key={concert.id}>
          <h2>{concert.name}</h2>
          <p>{concert.description || "No description provided."}</p>
          <div className="concert-footer">
            <ConcertSeatSummary concert={concert} />
            {admin ? (
              <button
                className="danger-button"
                disabled={loading}
                onClick={() => onDelete?.(concert.id)}
                type="button"
              >
                Delete
              </button>
            ) : (
              <ReservationToggle
                concert={concert}
                loading={loading}
                onCancel={onCancel}
                onReserve={onReserve}
              />
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function ConcertSeatSummary({ concert }: { concert: Concert }) {
  return (
    <dl className="seat-summary">
      <div>
        <dt>Total</dt>
        <dd>{concert.totalSeats.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Reserved</dt>
        <dd>{concert.reservedSeats.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Available</dt>
        <dd>{concert.availableSeats.toLocaleString()}</dd>
      </div>
    </dl>
  );
}

function ReservationToggle({
  concert,
  loading,
  onReserve,
  onCancel,
}: {
  concert: Concert;
  loading: boolean;
  onReserve?: (concertId: string) => void;
  onCancel?: (concertId: string) => void;
}) {
  const isReserved =
    concert.reservationStatus === "RESERVED" || Boolean(concert.hasReserved);

  return (
    <button
      className={isReserved ? "danger-button" : ""}
      disabled={loading || (!isReserved && concert.availableSeats <= 0)}
      onClick={() => (isReserved ? onCancel?.(concert.id) : onReserve?.(concert.id))}
      type="button"
    >
      {isReserved ? "Cancel" : "Reserve"}
    </button>
  );
}
