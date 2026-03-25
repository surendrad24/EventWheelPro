import { Participant } from "@/lib/types";

export function WheelPreview({
  entrants,
  highlight
}: {
  entrants: Participant[];
  highlight?: string;
}) {
  const visibleEntrants = entrants.slice(0, 10);
  const angleStep = 360 / Math.max(visibleEntrants.length, 1);

  return (
    <div>
      <div className="wheel-pointer" />
      <div className="wheel">
        <div className="wheel-labels">
          {visibleEntrants.map((entrant, index) => {
            const angle = index * angleStep - 72;

            return (
              <div
                key={entrant.id}
                className="wheel-label"
                style={{
                  transform: `rotate(${angle}deg) translate(0, -10px)`
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
        <div className="wheel-center">
          <div>
            <div className="eyebrow">Fair Spin Mode</div>
            <strong>{highlight ?? "Ready"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
