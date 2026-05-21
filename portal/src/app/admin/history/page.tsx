import { Suspense } from "react";
import { PortalApp } from "../../portal-client";

export default function AdminHistoryPage() {
  return (
    <Suspense>
      <PortalApp initialView="history" initialRole="ADMIN" />
    </Suspense>
  );
}
