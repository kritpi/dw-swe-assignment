import { Suspense } from "react";
import { PortalApp } from "./portal-client";

export default function HomePage() {
  return (
    <Suspense>
      <PortalApp initialView="access" />
    </Suspense>
  );
}
