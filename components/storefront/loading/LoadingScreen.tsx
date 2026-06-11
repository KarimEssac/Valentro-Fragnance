type LoadingScreenProps = {
  progress?: number;
  complete?: boolean;
};

export default function LoadingScreen({
  progress,
  complete = false
}: LoadingScreenProps) {
  const progressStyle =
    typeof progress === "number"
      ? {width: `${Math.max(0, Math.min(progress, 100))}%`}
      : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[2000] flex min-h-[100svh] w-screen items-center justify-center overflow-hidden bg-surface-hi text-parchment transition-opacity duration-500 ${
        complete ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,248,236,0.92),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(227,210,186,0.36),transparent_30%),linear-gradient(135deg,rgba(255,248,236,0.78),rgba(239,226,204,0.5))]" />
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-gutter text-center">
        <h1 className="font-serif text-[clamp(3.2rem,10vw,7.5rem)] leading-none tracking-[0.14em] text-parchment">
          VALENTRO
        </h1>

        <div className="mt-24 flex w-full max-w-[260px] flex-col items-center gap-7 sm:mt-28">
          <p className="label-caps text-parchment">Entering the Atelier</p>
          <div className="h-px w-full overflow-hidden bg-outline/45">
            <div
              className={`h-full bg-parchment transition-[width] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] ${
                typeof progress === "number" ? "" : "loading-progress-auto"
              }`}
              style={progressStyle}
            />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading Valentro content</span>
    </div>
  );
}
