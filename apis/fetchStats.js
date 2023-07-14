import fetch from "node-fetch";

export default async function fetchStats() {
  const req = await fetch(process.env.NGINX_STATS, {
    method: "get",
  });

  if (req.status === 200) {
    return await req.text();
  }

  return null;
}
