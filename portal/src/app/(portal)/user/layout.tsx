import { ProtectedShell } from "@/components/portal/protected-shell";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedShell role="USER">{children}</ProtectedShell>;
}
