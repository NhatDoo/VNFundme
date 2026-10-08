import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action: ReactNode;
}) {
  return (
    <header className="section-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <span>{action}</span>
    </header>
  );
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <article className="stat">
      <span>{icon}</span>
      <p>{label}</p>
      <b>{value}</b>
    </article>
  );
}
