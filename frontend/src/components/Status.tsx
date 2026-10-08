export function Status({
  value,
  variant,
}: {
  value: string;
  variant?: "success" | "active" | "completed" | "failed" | "rejected" | "cancelled";
}) {
  const v = variant ?? value.toLowerCase();
  return (
    <span className={`status ${v}`}>
      {value.replace("_", " ")}
    </span>
  );
}