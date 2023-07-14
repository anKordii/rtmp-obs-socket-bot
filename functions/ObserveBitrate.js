import xml2js from "xml2js";
import SaveBitrate from "./SaveBitrate.js";
import fetchStats from "../apis/fetchStats.js";

const logging = (mode) => {
  if (mode === 1) return console.log("Nie udało sie pobrać statystyk.");

  return console.log("Nie znaleziono serwera.");
};

export default async function ObserveBitrate(sessionSettings, obs, client) {
  const parser = new xml2js.Parser({ attrkey: "ATTR" });

  if (sessionSettings.disableAuto === true) {
    return;
  }

  const fetch = await fetchStats();

  if (!fetch) {
    return logging(1);
  }

  parser.parseString(fetch, function (error, result) {
    if (error) {
      return console.log(error);
    }

    const { rtmp } = result;
    if (!rtmp) return;

    // Stream duration
    const uptime = rtmp.uptime[0];

    //[-#-#-]
    if (rtmp.server.length <= 0) return logging(2);
    const rtmp_server = rtmp.server[0];

    //[-#-#-]
    if (rtmp_server.application <= 0) return logging(2);
    const rtmp_application = rtmp_server.application[0];

    //[-#-#-]
    if (rtmp_application.live <= 0) return logging(2);
    const rtmp_live = rtmp_application.live[0];

    //[-#-#-]
    if (!rtmp_live.stream || rtmp_live.stream <= 0) return logging(2);
    const stream = rtmp_live.stream[0];
    const streamKey = stream.name[0];

    if (streamKey !== process.env.STREAM_KEY) return;

    const bwIn = stream.bw_in[0];
    const calcBitrate = (bwIn * 8) / uptime;
    const cleanUpBitRate = Math.trunc(calcBitrate);
    const sendBit = SaveBitrate(cleanUpBitRate);

    if (
      cleanUpBitRate <= process.env.FOR_BRB &&
      sessionSettings.currenScene !== "brb"
    ) {
      obs.call("SetCurrentProgramScene", { sceneName: "brb" });
      sessionSettings.currenScene = "brb";

      return client.say(
        `#${process.env.CHANNEL_NAME}`,
        `Słaby zasięg, zaraz wracamy.`
      );
    }

    if (
      cleanUpBitRate >= process.env.FOR_LIVE &&
      sessionSettings.currenScene === "brb"
    ) {
      obs.call("SetCurrentProgramScene", { sceneName: "live" });
      sessionSettings.currenScene = "live";

      return client.say(`#${process.env.CHANNEL_NAME}`, `Zasięg wrócił NOWAY`);
    }
  });
}
