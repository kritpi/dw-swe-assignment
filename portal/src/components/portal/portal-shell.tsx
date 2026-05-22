"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/use-session";
import type { Role } from "@/lib/auth";

type PortalShellProps = {
  role: Role;
  children: React.ReactNode;
};

export function PortalShell({ role, children }: PortalShellProps) {
  const pathname = usePathname();
  const logoutMutation = useLogout();

  const navItems =
    role === "ADMIN"
      ? [
          { href: "/admin", label: "Home", active: pathname === "/admin" },
          {
            href: "/admin/history",
            label: "History",
            active: pathname === "/admin/history",
          },
        ]
      : [{ href: "/user", label: "Home", active: pathname === "/user" }];

  return (
    <section className="dashboard">
      <aside className="sidebar">
        <div>
          <h1>{role === "ADMIN" ? "Admin" : "User"}</h1>
          <nav>
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={`nav-item ${item.active ? "nav-item--active" : ""}`}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          className="nav-item"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          Logout
        </button>
      </aside>
      <div className="dashboard-content">{children}</div>
    </section>
  );
}
