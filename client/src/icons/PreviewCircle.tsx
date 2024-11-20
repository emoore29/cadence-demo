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
        viewBox="-5 -5 10 10" // -5 -5 10 10 , +2 to allow space for 2px stroke
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          r={5}
          stroke="white"
          fill="transparent"
          strokeDasharray={2 * Math.PI * 5}
          strokeDashoffset={isActive ? offset : 2 * Math.PI * 5}
        />
      </svg>
    </div>
  );
}
