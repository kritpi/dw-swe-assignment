"use client";

import { PortalShell } from "@/components/portal/portal-shell";
import { useRequireRole } from "@/hooks/use-session";
import type { Role } from "@/lib/auth";

export function ProtectedShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const userQuery = useRequireRole(role);

  if (userQuery.isPending || userQuery.isError || userQuery.data?.role !== role) {
    return (
      <PortalShell role={role}>
        <section className="panel empty-panel">Loading workspace...</section>
      </PortalShell>
    );
  }

  return <PortalShell role={role}>{children}</PortalShell>;
}
