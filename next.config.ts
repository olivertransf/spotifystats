import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "lastfm-img2.freetls.fastly.net" },
      { protocol: "https", hostname: "s34.rev.sc" },
      { protocol: "https", hostname: "userserve-ak.last.fm" },
      { protocol: "http", hostname: "userserve-ak.last.fm" },
      { protocol: "https", hostname: "lastfm.freetls.fastly.net" },
    ],
  },
};

export default nextConfig;
