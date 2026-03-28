import { Participant } from "@/lib/types";

export function WheelPreview({
  entrants,
  highlight,
  theme = "default"
}: {
  entrants: Participant[];
  highlight?: string;
  theme?: "default" | "matrix";
}) {
  const visibleEntrants = entrants.slice(0, 10);
  const angleStep = 360 / Math.max(visibleEntrants.length, 1);
  const palette = ["#18E3B0", "#00D47A", "#B7FF00", "#25D9D2", "#00C96B", "#D6FF3D"];
  const wheelBackground = visibleEntrants.length
    ? visibleEntrants
        .map((_, index) => {
          const start = index * angleStep;
          const end = start + angleStep;
          return `${palette[index % palette.length]} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
        })
        .join(", ")
    : "#0b2013 0deg 360deg";

  return (
    <div className="wheel-preview">
      <div className="wheel-pointer wheel-preview__pointer" />
      <div
        className={`wheel wheel-preview__disc ${theme === "matrix" ? "wheel--matrix" : ""}`}
        style={{ ["--wheel-preview-bg" as string]: `conic-gradient(from -90deg, ${wheelBackground})` }}
      >
        <div className="wheel-labels wheel-preview__labels">
          {visibleEntrants.map((entrant, index) => {
            const angle = index * angleStep + angleStep / 2 - 90;

            return (
              <div
                key={entrant.id}
                className="wheel-label wheel-preview__label"
                style={{
                  transform: `rotate(${angle}deg) translate(0, -188px)`
                }}
              >
                <span
                  style={{
                    color: entrant.displayName === highlight ? "#051019" : "white",
                    background:
                      entrant.displayName === highlight
                        ? "rgba(255,255,255,0.88)"
                        : "transparent",
                    padding: "3px 8px",
                    borderRadius: 999
                  }}
                >
                  {entrant.displayName}
                </span>
              </div>
            );
          })}
        </div>
        <div className="wheel-center wheel-preview__center">
          <div>
            <div className="eyebrow">Fair Spin Mode</div>
            <strong>{highlight ?? "Ready"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
