"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "USER" | "ADMIN";
type View = "access" | "login" | "signup" | "dashboard" | "history";
type Toast = { kind: "success" | "error"; message: string } | null;

type AuthUser = {
  sub?: string;
  id?: string;
  fullName?: string;
  email: string;
  role: Role;
};

type Concert = {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  reservedSeats: number;
  availableSeats: number;
  hasReserved?: boolean;
  reservationStatus?: "RESERVED" | "CANCELED" | null;
};

type ReservationHistory = {
  id: string;
  action: "RESERVE" | "CANCEL";
  actionAt: string;
  user: { fullName: string; email: string };
  concert: { id: string; name: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function PortalApp({
  initialView,
  initialRole = "USER",
}: {
  initialView: View;
  initialRole?: Role;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = normalizeRole(searchParams.get("role")) ?? initialRole;
  const [role, setRole] = useState<Role>(requestedRole);
  const [view, setViewState] = useState<View>(initialView);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [history, setHistory] = useState<ReservationHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  function setView(nextView: View, nextRole = role) {
    setViewState(nextView);

    if (nextView === "access") {
      router.push("/");
      return;
    }

    if (nextView === "login") {
      router.push(`/login?role=${nextRole}`);
      return;
    }

    if (nextView === "signup") {
      router.push(`/signup?role=${nextRole}`);
      return;
    }

    if (nextView === "history") {
      router.push("/admin/history");
      return;
    }

    router.push(nextRole === "ADMIN" ? "/admin" : "/user");
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message;
      throw new Error(message || `Request failed with ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();

    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  async function refreshDashboard(currentRole = user?.role) {
    if (!currentRole) {
      return;
    }

    if (currentRole === "ADMIN") {
      const [nextConcerts, nextHistory] = await Promise.all([
        request<Concert[]>("/concerts/admin"),
        request<ReservationHistory[]>("/reservations/history"),
      ]);
      setConcerts(nextConcerts);
      setHistory(nextHistory);
      return;
    }

    const nextConcerts = await request<Concert[]>("/concerts");
    setConcerts(nextConcerts);
    setHistory([]);
  }

  useEffect(() => {
    if ((initialView !== "dashboard" && initialView !== "history") || user) {
      return;
    }

    let active = true;
    request<AuthUser>("/auth/me")
      .then(async (nextUser) => {
        if (!active) {
          return;
        }

        if (nextUser.role !== initialRole) {
          setToast({
            kind: "error",
            message: `This account is registered as ${nextUser.role}.`,
          });
          setView("login", initialRole);
          return;
        }

        setUser(nextUser);
        await refreshDashboard(nextUser.role);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setToast({ kind: "error", message: getErrorMessage(error) });
        setView("login", initialRole);
      });

    return () => {
      active = false;
    };
    // The route props are the intended trigger; request helpers are local closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRole, initialView, user]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setToast(null);

    try {
      await request<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          role,
        }),
      });

      const nextUser = await request<AuthUser>("/auth/me");

      if (nextUser.role !== role) {
        throw new Error(`This account is registered as ${nextUser.role}.`);
      }

      setUser(nextUser);
      setView("dashboard", nextUser.role);
      await refreshDashboard(nextUser.role);
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setToast({ kind: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      await request<void>("/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
          password,
          role,
        }),
      });
      setToast({ kind: "success", message: "Account created. Please log in." });
      setView("login", role);
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateConcert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setToast(null);

    try {
      await request<void>("/concerts", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          totalSeats: Number(form.get("totalSeats")),
        }),
      });
      event.currentTarget.reset();
      await refreshDashboard("ADMIN");
      setToast({ kind: "success", message: "Concert created." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConcert(concertId: string) {
    setLoading(true);
    setToast(null);

    try {
      await request<void>(`/concerts/${concertId}`, { method: "DELETE" });
      await refreshDashboard("ADMIN");
      setToast({ kind: "success", message: "Concert deleted." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleReserve(concertId: string) {
    setLoading(true);
    setToast(null);

    try {
      await request<void>(`/concerts/${concertId}/reservations`, {
        method: "POST",
      });
      await refreshDashboard("USER");
      setToast({ kind: "success", message: "Seat reserved." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(concertId: string) {
    setLoading(true);
    setToast(null);

    try {
      await request<void>(`/concerts/${concertId}/reservations`, {
        method: "DELETE",
      });
      await refreshDashboard("USER");
      setToast({ kind: "success", message: "Reservation canceled." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await request<void>("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setConcerts([]);
    setHistory([]);
    setView("access");
  }

  const stats = useMemo(() => {
    const totalSeats = concerts.reduce((sum, concert) => sum + concert.totalSeats, 0);
    const reservedSeats = concerts.reduce(
      (sum, concert) => sum + concert.reservedSeats,
      0,
    );
    const canceled = history.filter((row) => row.action === "CANCEL").length;

    return { totalSeats, reservedSeats, canceled };
  }, [concerts, history]);

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-black">
      {toast ? <ToastMessage toast={toast} onClose={() => setToast(null)} /> : null}

      {view === "access" ? (
        <AccessLevel role={role} setRole={setRole} setView={setView} />
      ) : null}

      {view === "login" ? (
        <AuthShell quote="&quot;Your digital workspace, simplified.&quot;">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1>Login</h1>
            <Field label="Email" name="email" placeholder="Enter your Email Address" />
            <Field
              label="Password"
              name="password"
              placeholder="Enter your Password"
              type="password"
            />
            <button className="primary-button" disabled={loading}>
              {loading ? "Please wait..." : `Login as ${role === "ADMIN" ? "Admin" : "User"}`}
            </button>
            <p className="form-switch">
              Don&apos;t have an account?
              <button type="button" onClick={() => setView("signup", role)}>
                Create an account
              </button>
            </p>
          </form>
        </AuthShell>
      ) : null}

      {view === "signup" ? (
        <AuthShell quote="&quot;Powering the tools that power the team.&quot;">
          <form className="auth-form auth-form--signup" onSubmit={handleSignup}>
            <h1>Sign Up</h1>
            <Field label="Full name" name="fullName" placeholder="Enter your Full Name" />
            <Field label="Email" name="email" placeholder="Enter your Email Address" />
            <Field
              label="Password"
              name="password"
              placeholder="Create a Password"
              type="password"
            />
            <Field
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Re-enter your Password"
              type="password"
            />
            <button className="primary-button" disabled={loading}>
              {loading ? "Please wait..." : "Create an account"}
            </button>
            <p className="form-switch">
              Already have an account?
              <button type="button" onClick={() => setView("login", role)}>
                Login
              </button>
            </p>
          </form>
        </AuthShell>
      ) : null}

      {(view === "dashboard" || view === "history") && !user ? (
        <DashboardShell
          activeView={view === "history" ? "history" : "home"}
          role={initialRole}
          onHome={() => setView("dashboard", initialRole)}
          onHistory={() => setView("history", "ADMIN")}
          onLogout={handleLogout}
        >
          <section className="panel empty-panel">Loading workspace...</section>
        </DashboardShell>
      ) : null}

      {view === "dashboard" && user ? (
        <DashboardShell
          activeView="home"
          role={user.role}
          onHome={() => setView("dashboard", user.role)}
          onHistory={() => setView("history", "ADMIN")}
          onLogout={handleLogout}
        >
          <section className={`metric-grid ${isAdmin ? "" : "metric-grid--user"}`}>
            <Metric label="Total of seats" value={stats.totalSeats} />
            <Metric label="Reserve" value={stats.reservedSeats} />
            {isAdmin ? <Metric label="Cancel" value={stats.canceled} /> : null}
          </section>

          {isAdmin ? (
            <AdminDashboard
              concerts={concerts}
              loading={loading}
              onCreate={handleCreateConcert}
              onDelete={handleDeleteConcert}
            />
          ) : (
            <UserDashboard
              concerts={concerts}
              loading={loading}
              onReserve={handleReserve}
              onCancel={handleCancel}
            />
          )}
        </DashboardShell>
      ) : null}

      {view === "history" && user ? (
        <DashboardShell
          activeView="history"
          role={user.role}
          onHome={() => setView("dashboard", user.role)}
          onHistory={() => setView("history", "ADMIN")}
          onLogout={handleLogout}
        >
          {isAdmin ? (
            <AdminHistoryPage history={history} />
          ) : (
            <section className="panel empty-panel">
              Reservation history is only available to administrators.
            </section>
          )}
        </DashboardShell>
      ) : null}
    </main>
  );
}

function AccessLevel({
  role,
  setRole,
  setView,
}: {
  role: Role;
  setRole: (role: Role) => void;
  setView: (view: View, role?: Role) => void;
}) {
  return (
    <section className="access-screen">
      <Brand compact />
      <div className="access-heading">
        <h1>Select Access Level</h1>
        <p>Choose the workspace that matches your account role.</p>
      </div>
      <div className="role-grid">
        <RoleCard
          active={role === "USER"}
          title="User"
          body="Discover concerts and reserve one seat per concert."
          cta="Enter Workspace"
          onClick={() => {
            setRole("USER");
            setView("login", "USER");
          }}
        />
        <RoleCard
          active={role === "ADMIN"}
          title="Administrator"
          body="Create concert listings, remove listings, and view the full reservation audit trail."
          cta="Enter Portal"
          onClick={() => {
            setRole("ADMIN");
            setView("login", "ADMIN");
          }}
        />
      </div>
    </section>
  );
}

function RoleCard({
  active,
  title,
  body,
  cta,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button className={`role-card ${active ? "role-card--active" : ""}`} onClick={onClick}>
      <span className="role-icon">{title === "User" ? "U" : "A"}</span>
      <strong>{title}</strong>
      <span>{body}</span>
      <em>{cta} {"->"}</em>
    </button>
  );
}

function AuthShell({
  quote,
  children,
}: {
  quote: string;
  children: React.ReactNode;
}) {
  return (
    <section className="auth-screen">
      <aside className="brand-panel">
        <Brand />
        <div className="brand-copy">
          <h2>{quote}</h2>
          <p>
            Manage free concert tickets with clear role access, reservation limits,
            and audit history.
          </p>
        </div>
      </aside>
      <div className="auth-panel">{children}</div>
    </section>
  );
}

function Field({
  label,
  min,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  min?: number;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input min={min} name={name} placeholder={placeholder} type={type} required />
    </label>
  );
}

function DashboardShell({
  activeView,
  role,
  onHome,
  onHistory,
  onLogout,
  children,
}: {
  activeView: "home" | "history";
  role: Role;
  onHome: () => void;
  onHistory: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard">
      <aside className="sidebar">
        <h1>{role === "ADMIN" ? "Admin" : "User"}</h1>
        <nav>
          <button
            className={`nav-item ${activeView === "home" ? "nav-item--active" : ""}`}
            onClick={onHome}
          >
            Home
          </button>
          {role === "ADMIN" ? (
            <button
              className={`nav-item ${
                activeView === "history" ? "nav-item--active" : ""
              }`}
              onClick={onHistory}
            >
              History
            </button>
          ) : null}
          <button className="nav-item" onClick={onLogout}>
            Logout
          </button>
        </nav>
      </aside>
      <div className="dashboard-content">{children}</div>
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

function AdminDashboard({
  concerts,
  loading,
  onCreate,
  onDelete,
}: {
  concerts: Concert[];
  loading: boolean;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (concertId: string) => void;
}) {
  return (
    <div className="dashboard-stack">
      <form className="panel form-panel" onSubmit={onCreate}>
        <h2>Create</h2>
        <div className="form-row">
          <Field label="Concert Name" name="name" placeholder="Please input concert name" />
          <Field
            label="Total of seats"
            min={1}
            name="totalSeats"
            placeholder="500"
            type="number"
          />
        </div>
        <label className="field">
          <span>Description</span>
          <textarea name="description" placeholder="Please input description" required />
        </label>
        <button className="primary-button panel-action" disabled={loading}>
          Save
        </button>
      </form>
      <ConcertList concerts={concerts} admin onDelete={onDelete} loading={loading} />
    </div>
  );
}

function AdminHistoryPage({ history }: { history: ReservationHistory[] }) {
  return (
    <section className="panel history-panel">
      <h2>Reservation History</h2>
      {history.length ? (
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

function UserDashboard({
  concerts,
  loading,
  onReserve,
  onCancel,
}: {
  concerts: Concert[];
  loading: boolean;
  onReserve: (concertId: string) => void;
  onCancel: (concertId: string) => void;
}) {
  return (
    <div className="dashboard-stack">
      <ConcertList
        concerts={concerts}
        loading={loading}
        onReserve={onReserve}
        onCancel={onCancel}
      />
    </div>
  );
}

function ConcertList({
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
      onClick={() =>
        isReserved ? onCancel?.(concert.id) : onReserve?.(concert.id)
      }
    >
      {isReserved ? "Cancel" : "Reserve"}
    </button>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--dark" : ""}`}>
      <span />
      <strong>BRAND</strong>
    </div>
  );
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: NonNullable<Toast>;
  onClose: () => void;
}) {
  return (
    <div className={`toast toast--${toast.kind}`}>
      <span>{toast.message}</span>
      <button onClick={onClose}>x</button>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function normalizeRole(value: string | null): Role | null {
  if (value === "ADMIN" || value === "USER") {
    return value;
  }

  return null;
}
