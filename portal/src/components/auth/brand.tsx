export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--dark" : ""}`}>
      <span />
      <strong>BRAND</strong>
    </div>
  );
}
