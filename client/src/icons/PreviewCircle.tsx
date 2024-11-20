interface PreviewCircleProps {
  trackId: string;
  size: number;
  offset: number;
  playingTrackId: string | null;
}

export default function PreviewCircle({
  trackId,
  size,
  offset,
  playingTrackId,
}: PreviewCircleProps) {
  const isActive = trackId === playingTrackId;

  // Note: take care changing radius & stroke width - ensure radius in calculateOffset() matches
  const radius = 20;
  const strokeWidth = 2;

  return (
    <div
      className="previewCircle"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg
        width="auto"
        height="100%"
        style={{ maxWidth: "100%" }}
        viewBox={`-${radius} -${radius} ${radius * 2} ${radius * 2}`}
        fill="none"
        strokeWidth={strokeWidth}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          r={radius - 2}
          stroke="white"
          fill="transparent"
          strokeDasharray={2 * Math.PI * (radius - 2)}
          strokeDashoffset={isActive ? offset : 2 * Math.PI * (radius - 2)}
        />
      </svg>
    </div>
  );
}
