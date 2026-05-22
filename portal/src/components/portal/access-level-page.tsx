"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/auth/brand";
import { normalizeRole } from "@/lib/auth";

export function AccessLevelPage() {
  const searchParams = useSearchParams();
  const selectedRole = normalizeRole(searchParams.get("role"));

  return (
    <main className="min-h-screen bg-[#fbfbfb] text-black">
      <section className="access-screen">
        <Brand compact />
        <div className="access-heading">
          <h1>Select Access Level</h1>
          <p>Choose the workspace that matches your account role.</p>
        </div>
        <div className="role-grid">
          <RoleCard
            active={selectedRole === "USER"}
            title="User"
            body="Discover concerts and reserve one seat per concert."
            cta="Enter Workspace"
            href="/login?role=USER"
          />
          <RoleCard
            active={selectedRole === "ADMIN"}
            title="Administrator"
            body="Create concert listings, remove listings, and view the full reservation audit trail."
            cta="Enter Portal"
            href="/login?role=ADMIN"
          />
        </div>
      </section>
    </main>
  );
}

function RoleCard({
  active,
  title,
  body,
  cta,
  href,
}: {
  active: boolean;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <Link className={`role-card ${active ? "role-card--active" : ""}`} href={href}>
      <span className="role-icon">{title === "User" ? "U" : "A"}</span>
      <strong>{title}</strong>
      <span>{body}</span>
      <em>{cta} {"->"}</em>
    </Link>
  );
}
