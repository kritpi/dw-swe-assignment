import { Brand } from "./brand";

type AuthShellProps = {
  quote: string;
  children: React.ReactNode;
};

export function AuthShell({ quote, children }: AuthShellProps) {
  return (
    <section className="auth-screen">
      <aside className="brand-panel">
        <Brand />
        <div className="brand-copy">
          <h2>{quote}</h2>
          <p>
            Manage free concert tickets with clear role access, reservation limits,
            and audit history.
          </p>
        </div>
      </aside>
      <div className="auth-panel">{children}</div>
    </section>
  );
}
