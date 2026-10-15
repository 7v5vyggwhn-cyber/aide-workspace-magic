export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-display text-4xl tracking-tight">{title}</h1>
      {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
