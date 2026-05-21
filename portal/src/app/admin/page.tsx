import { Suspense } from "react";
import { PortalApp } from "../portal-client";

export default function AdminPage() {
  return (
    <Suspense>
      <PortalApp initialView="dashboard" initialRole="ADMIN" />
    </Suspense>
  );
}
