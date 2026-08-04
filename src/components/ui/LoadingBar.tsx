interface LoadingBarProps {
  loading: boolean;
  label?: string;
}

export function LoadingBar({ loading, label }: LoadingBarProps) {
  if (!loading) return null;
  return (
    <>
      <style>{`@keyframes ebSlide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-primary/20">
        <div className="absolute inset-y-0 w-1/3 bg-primary rounded-full" style={{ animation: 'ebSlide 1.4s linear infinite' }} />
      </div>
      {label && <p className="text-xs text-muted-foreground text-center -mt-1">{label}</p>}
    </>
  );
}
