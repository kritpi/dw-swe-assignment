import { ProtectedShell } from "@/components/portal/protected-shell";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedShell role="ADMIN">{children}</ProtectedShell>;
}
