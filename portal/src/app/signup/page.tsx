import { Suspense } from "react";
import { PortalApp } from "../portal-client";

export default function SignupPage() {
  return (
    <Suspense>
      <PortalApp initialView="signup" />
    </Suspense>
  );
}
