import { Suspense } from "react";
import { PortalApp } from "../portal-client";

export default function RegisterPage() {
  return (
    <Suspense>
      <PortalApp initialView="signup" />
    </Suspense>
  );
}
