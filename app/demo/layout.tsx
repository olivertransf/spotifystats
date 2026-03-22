export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
        <span className="font-medium text-amber-50">Demo mode</span>
        {" · "}
        Sample listening data for the last 12 months. Your real stats live under{" "}
        <a href="/me?range=ytd" className="underline underline-offset-2 hover:text-foreground">
          /me
        </a>
        .
      </div>
      {children}
    </div>
  );
}
