import { Suspense } from "react";
import { AccessLevelPage } from "@/components/portal/access-level-page";

export default function HomePage() {
  return (
    <Suspense>
      <AccessLevelPage />
    </Suspense>
  );
}
