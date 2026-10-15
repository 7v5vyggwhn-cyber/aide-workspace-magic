export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-2xl leading-none tracking-tight ${className}`}>
      Adel<span className="italic text-brand">AI</span>de
    </span>
  );
}
