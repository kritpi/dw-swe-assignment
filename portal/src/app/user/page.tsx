import { Suspense } from "react";
import { PortalApp } from "../portal-client";

export default function UserPage() {
  return (
    <Suspense>
      <PortalApp initialView="dashboard" initialRole="USER" />
    </Suspense>
  );
}
