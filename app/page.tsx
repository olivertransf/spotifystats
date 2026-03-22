export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-muted-foreground text-sm text-center">Nothing to see here.</p>
      <a
        href="/demo?range=ytd"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        View demo (sample data)
      </a>
    </div>
  );
}
