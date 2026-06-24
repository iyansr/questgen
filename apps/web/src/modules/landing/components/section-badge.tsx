export function SectionBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-muted-foreground text-xs">
      {icon}
      <span>{label}</span>
    </div>
  );
}
