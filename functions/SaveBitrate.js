export default async function SaveBitrate(bitrate) {
  const req = await fetch(process.env.DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: "Bitrate",
          footer: {
            text: `oxynstudios.com`,
          },
          fields: [
            {
              name: "Number",
              value: bitrate,
            },
          ],
        },
      ],
    }),
  });

  if (req.status === 204) {
    return true;
  }

  return false;
}
