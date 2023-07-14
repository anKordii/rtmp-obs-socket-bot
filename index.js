import tmi from "tmi.js";
import OBSWebSocket from "obs-websocket-js";
import dotenv from "dotenv";
import ObserveBitrate from "./functions/ObserveBitrate.js";

dotenv.config();

const client = new tmi.Client({
  channels: [process.env.CHANNEL_NAME],
  identity: {
    username: process.env.USER,
    password: process.env.PASSWORD,
  },
});

const sessionSettings = {
  disableAuto: false,
  currenScene: "live",
  offlineAttemp: 0,
};

const obs = new OBSWebSocket();

obs.connect(process.env.OBS_ADDRESS, process.env.OBS_PASSWORD).then(
  (info) => {
    console.log("Connected and identified", info);
  },
  (err) => {
    console.log(err);
  }
);

obs.on("SwitchScenes", (data) => {
  return client.say(
    `#${process.env.CHANNEL_NAME}`,
    `Pomyślnie zmieniono scene na ${data.sceneName}.`
  );
});

obs.on("error", (err) => {
  console.error("socket error:", err);
});

client.connect();

client.on("message", (channel, tags, message, self) => {
  if (self || !message.startsWith("!")) return;

  const args = message.slice(1).split(" ");
  const command = args.shift().toLowerCase();
  const badges = tags.badges || {};
  const isBroadcaster = badges.broadcaster;
  const isMod = badges.moderator;
  const isModUp = isBroadcaster || isMod;

  if (command === "brb") {
    if (isModUp) {
      obs.call("SetCurrentProgramScene", { sceneName: "brb" });

      return client.say(
        channel,
        `@${tags.username}, Scena została zmieniona na ZARAZ WRACAM NOWAY`
      );
    }

    return;
  }

  if (command === "stop") {
    if (isModUp) {
      obs.call("StopStream");

      return client.say(
        channel,
        `@${tags.username}, Stream został zakończony papa`
      );
    }

    return;
  }

  if (command === "live") {
    if (isModUp) {
      obs.call("SetCurrentProgramScene", { sceneName: "live" });

      return client.say(channel, `@${tags.username}, Już wszystko działa aok`);
    }

    return;
  }

  if (command === "disable") {
    if (isModUp) {
      sessionSettings.disableAuto = !sessionSettings.disableAuto;

      return client.say(
        channel,
        `@${tags.username}, ${
          sessionSettings.disableAuto === false ? "Włączyłeś" : "Wyłączyłeś"
        } interaktywne zmienianie sceny.`
      );
    }

    return;
  }
});

setInterval(async () => {
  await ObserveBitrate(sessionSettings, obs, client);
}, 15 * 1000);