"use client";

import { useState } from "react";

interface ArtistArtProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ArtistArt({ src, alt, width = 44, height = 44, className }: ArtistArtProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`rounded-full bg-primary/10 shrink-0 flex items-center justify-center ${className ?? ""}`}
        style={{ width, height }}
      >
        <span className="text-primary text-sm font-bold">
          {alt[0]?.toUpperCase() ?? "?"}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-full object-cover shrink-0 ${className ?? ""}`}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}
