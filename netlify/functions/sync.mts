import type { Config } from "@netlify/functions";

export default async function handler() {
  const baseUrl = process.env.URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/sync`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  const data = await res.json();
  console.log("Sync result:", data);

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

export const config: Config = {
  schedule: "0 * * * *",
};
