"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Field } from "@/components/auth/field";
import { ToastMessage } from "@/components/auth/toast-message";
import { ConcertList } from "@/components/portal/concert-list";
import { MetricGrid } from "@/components/portal/metric-grid";
import {
  useAdminConcerts,
  useCreateConcert,
  useDeleteConcert,
  useReservationHistory,
} from "@/hooks/use-portal-data";
import { getErrorMessage, type ToastState } from "@/lib/auth";

export function AdminDashboardPage() {
  const [toast, setToast] = useState<ToastState>(null);
  const concertsQuery = useAdminConcerts();
  const historyQuery = useReservationHistory();
  const createConcertMutation = useCreateConcert();
  const deleteConcertMutation = useDeleteConcert();

  const loading =
    concertsQuery.isPending ||
    historyQuery.isPending ||
    createConcertMutation.isPending ||
    deleteConcertMutation.isPending;

  async function handleCreateConcert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setToast(null);

    try {
      await createConcertMutation.mutateAsync({
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        totalSeats: Number(form.get("totalSeats")),
      });
      event.currentTarget.reset();
      setToast({ kind: "success", message: "Concert created." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    }
  }

  async function handleDeleteConcert(concertId: string) {
    setToast(null);

    try {
      await deleteConcertMutation.mutateAsync(concertId);
      setToast({ kind: "success", message: "Concert deleted." });
    } catch (error) {
      setToast({ kind: "error", message: getErrorMessage(error) });
    }
  }

  const concerts = concertsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const hasError = concertsQuery.isError || historyQuery.isError;

  return (
    <>
      {toast ? <ToastMessage toast={toast} onClose={() => setToast(null)} /> : null}
      <MetricGrid concerts={concerts} history={history} role="ADMIN" />
      <div className="dashboard-stack">
        <form className="panel form-panel" onSubmit={handleCreateConcert}>
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

        {hasError ? (
          <section className="panel empty-panel">
            {concertsQuery.error?.message ?? historyQuery.error?.message}
          </section>
        ) : (
          <ConcertList
            admin
            concerts={concerts}
            loading={loading}
            onDelete={handleDeleteConcert}
          />
        )}
      </div>
    </>
  );
}
