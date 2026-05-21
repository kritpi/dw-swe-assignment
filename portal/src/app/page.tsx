import Link from "next/link";
import { Brand } from "@/components/auth/brand";

export default function Home() {
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
            body="Discover concerts and reserve one seat per concert."
            cta="Enter Workspace"
            href="/login?role=USER"
            title="User"
          />
          <RoleCard
            body="Create concert listings, remove listings, and view the full reservation audit trail."
            cta="Enter Portal"
            href="/login?role=ADMIN"
            title="Administrator"
          />
        </div>
      </section>
    </main>
  );
}

function RoleCard({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <Link className="role-card" href={href}>
      <span className="role-icon">{title === "User" ? "U" : "A"}</span>
      <strong>{title}</strong>
      <span>{body}</span>
      <em>{cta} {"->"}</em>
    </Link>
  );
}
