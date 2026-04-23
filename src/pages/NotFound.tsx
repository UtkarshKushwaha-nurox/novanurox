export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-7xl font-bold text-gradient-neon">404</div>
        <h1 className="mt-4 font-display text-2xl font-bold">Lost in the matrix</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-neon px-5 h-11 text-sm font-semibold text-background shadow-neon"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
