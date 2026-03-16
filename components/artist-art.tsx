"use client";

import { useState } from "react";

interface ArtistArtProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

export function ArtistArt({ src, alt, width = 44, height = 44, className }: ArtistArtProps) {
  const [error, setError] = useState(false);
  const isPlaceholder = src?.includes(PLACEHOLDER_HASH);

  if (!src || error || isPlaceholder) {
    const letter = (alt?.trim()[0] ?? "?").toUpperCase();
    const size = Math.min(width, height);
    const fontSize = Math.max(12, Math.floor(size * 0.45));
    return (
      <div
        role="img"
        aria-label={alt || "Artist"}
        className={`rounded-full bg-secondary flex items-center justify-center shrink-0 ${className ?? ""}`}
        style={{ width, height, minWidth: size, minHeight: size }}
      >
        <span className="text-muted-foreground font-semibold" style={{ fontSize }}>
          {letter}
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
