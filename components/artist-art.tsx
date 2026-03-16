"use client";

import { useState } from "react";
import Image from "next/image";

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
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-full object-cover ${className ?? ""}`}
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}
