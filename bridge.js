const http = require("node:http");
const path = require("node:path");
const { spawn, exec } = require("node:child_process");

// =========================================================================================
const NO_REFRESH_DOMAINS = [
  "youtube.com",
  "facebook.com",
  "streamed.pk",
  "cricstreams.",
  "sport4u.online",
  "website-vercel-helper-d-jaja-3-2.vercel.app",
  "websitestream.netlify.app/?ch=Channel%20HD%2071"
];

// 🚀 Multi-Stream Key Manager
const STREAM_KEYS = {
  "1": "15254238731883_15281627925099_najspfkgne",
  "1.1": "15254260751979_15281671637611_2plrcfqzze",
  "1.2": "15254285524587_15281717840491_7e6qdknzsu",

  "1.3": "16983200374379_18360218880619_efmw4fchxm",
  "1.4": "16983242579563_18360288741995_t2kh2jvcym",
  "1.5": "16983247822443_18360297982571_3zs5ml7gua",
  "1.6": "16983254834795_18360310237803_xrz3pf4uea",
  "1.7": "16983259553387_18360317971051_6khoe5efge",
  "1.8": "16983264468587_18360327342699_wsn7zgr7ee",
  "1.9": "16983269514859_18360335075947_363qzjlbte",
  "1.10": "16983277641323_18360347921003_rpf6hkqpdm",
  "1.11": "16983286554219_18360360503915_lrqraxbz3y",

  "2": "15254299352683_15281743071851_7dvz3h5d7q",
  "2.1": "15254308986475_15281761618539_3xca7oij3u",
  "2.2": "15254328122987_15281795566187_zjqa6bqzoq",

  "3": "15254341885547_15281821059691_hhlpb5vicy",
  "3.1": "15254357089899_15281848322667_sxeexgvzl4",
  "3.2": "15254367510123_15281868180075_pc4jrytfgm",
  "3.3": "17485986405995_19233134873195_iw63xjblny",
  "3.4": "17485996039787_19233150929515_d3yeoweuam",
  "3.5": "17486002789995_19233161611883_mbg22slybe",
  "3.6": "17486007770731_19233169934955_teme2zt4fm",

  "4": "15255022345835_15283095800427_vwrupxzstm",
  "4.1": "15255038074475_15283122080363_ai5qqp2we4",
  "4.2": "15255045480043_15283135842923_tldl4bhmii",
  "4.3": "15255208599147_15283449629291_abltofuc7m",
  "4.4": "15255217708651_15283466603115_bojrrqtlmu",
  "4.5": "15255227670123_15283486263915_jpntt54mve",

  // "5": "15273689226859_15317451606635_d7zzy3c7qi",
  "5": "17135767461483_18625099401835_4gpytlxk4a",
  "5.1": "15273713933931_15317494860395_avj47smmim",
  "5.2": "15273722257003_15317510195819_6edjluvdqi",
  "5.3": "15273739624043_15317541653099_ii4bxpvabe",
  "5.4": "15273750175339_15317561707115_csel26ku5a",
  "5.5": "15273760071275_15317579467371_cnewcj54me",
  "5.6": "15273767935595_15317595851371_3q43tk7tvm",
  "5.7": "15273778683499_15317616560747_4piekvs4wu",

  "s1.1": "14204232736303_14846150314543_37jq4ryehq",
  "s1.2": "14204288179759_14846247373359_tnsknmapva",
  "s1.3": "14204319768111_14846302489135_sr4ht4ccwq",
  "s1.4": "14204331957807_14846326147631_dji2acqcze",
  "s1.5": "14204346572335_14846351641135_7gvns4o5ue",
  "s1.6": "14204361252399_14846376479279_cjajhf4d3y",
  "s1.7": "14204370492975_14846393649711_6fduhdqite",
  "s1.8": "14204395527727_14846438017583_s2jlti7lsm",
  "s1.9": "14204411387439_14846464887343_f5lxgcqj5y",
  "s1.10": "14204424691247_14846487562799_xmbvntt6wa",

  "s2.1": "14204490948143_14846603495983_kzevn36tii",
  "s2.2": "14204506742319_14846634494511_ta2rxyg2oy",
  "s2.3": "14204523322927_14846661233199_foqb3q7zb4",
  "s2.4": "14204540034607_14846689085999_gjejdie4uy",
  "s2.5": "14204555304495_14846715497007_zdanghuxzu",
  "s2.6": "14204565200431_14846734371375_ap3bqpabpu",
  "s2.7": "14204577259055_14846756194863_3ecad2535u",
  "s2.8": "14204592528943_14846785227311_4hjl46y62e",
  "s2.9": "14204602621487_14846802594351_ilnp6lxekq",
  "s2.10": "14206184136239_14849618610735_ihnbx7hkoi"
};
// =========================================================================================

const PORT = 8765;
const FB_INGEST = "rtmps://live-api-s.facebook.com:443/rtmp/";
const SOURCE_URL = process.env.SOURCE_URL;
const CHROME_PATH = process.env.CHROME_PATH;
const DURATION_MINUTES = parseInt(process.env.DURATION_MINUTES || "180", 10);
const FORCE_REFRESH_MINUTES = parseInt(process.env.FORCE_REFRESH_MINUTES || "0", 10);

if (!SOURCE_URL || !CHROME_PATH) {
  console.error("ERROR: SOURCE_URL or CHROME_PATH environment variable is missing.");
  process.exit(1);
}

// Resolve Stream Key ID (e.g., "1", "1.4", "s1.2") or direct key/RTMP URL
const keyInput = (process.env.STREAM_KEY || "1").trim();
let RTMP_URL = "";
if (STREAM_KEYS[keyInput]) {
  RTMP_URL = `${FB_INGEST}${STREAM_KEYS[keyInput]}`;
  console.log(`[🔑] Selected Stream Key ID: [${keyInput}]`);
} else if (keyInput.startsWith("rtmp://") || keyInput.startsWith("rtmps://")) {
  RTMP_URL = keyInput;
  console.log("[🔑] Using Custom RTMP URL");
} else {
  RTMP_URL = `${FB_INGEST}${keyInput}`;
  console.log("[🔑] Using Direct Stream Key");
}

// Quality & Bitrate Settings
const selectedQuality = process.env.STREAM_QUALITY || "Original (1080p Max)";
let RES_W = 1920, RES_H = 1080, BITRATE = 5000;

if (selectedQuality === "360p") { RES_W = 640; RES_H = 360; BITRATE = 800; }
else if (selectedQuality === "480p") { RES_W = 854; RES_H = 480; BITRATE = 1500; }
else if (selectedQuality === "720p") { RES_W = 1280; RES_H = 720; BITRATE = 3000; }
else if (selectedQuality === "1080p") { RES_W = 1920; RES_H = 1080; BITRATE = 4500; }
else { RES_W = 1920; RES_H = 1080; BITRATE = 6000; }

const isNoRefreshDomain = NO_REFRESH_DOMAINS.some((domain) =>
  SOURCE_URL.toLowerCase().includes(domain.toLowerCase())
);
const effectiveRefreshMinutes = isNoRefreshDomain ? 0 : FORCE_REFRESH_MINUTES;

console.log(`[🚀] Smart Engine Locked to: ${RES_W}x${RES_H} @ ${BITRATE}kbps (${selectedQuality})`);
console.log(`[⏱️] Auto-Refresh Time Set To: ${effectiveRefreshMinutes} Minutes${isNoRefreshDomain ? " (No-Refresh Domain Matched)" : ""}`);

let ffmpegProcess = null;
let isSwitchingStream = false;
let detectionTimeout = null;

function buildHeaderString(headers) {
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\r\n") + "\r\n";
}

function closeBrowser() {
  exec("pkill -f chrome || true");
}

function launchBrowser() {
  closeBrowser();
  const extDir = path.resolve(__dirname, "extension");
  console.log("[🌐] Launching Chrome for Testing to sniff stream URL...");

  spawn(
    CHROME_PATH,
    [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--autoplay-policy=no-user-gesture-required",
      `--disable-extensions-except=${extDir}`,
      `--load-extension=${extDir}`,
      SOURCE_URL
    ],
    { stdio: "ignore", detached: true }
  ).unref();

  clearTimeout(detectionTimeout);
  detectionTimeout = setTimeout(() => {
    if (!ffmpegProcess) {
      console.error("Timeout: No .m3u8 stream detected within 90 seconds.");
      closeBrowser();
      process.exit(1);
    }
  }, 90000);
}

function startFfmpeg(m3u8Url, headers) {
  clearTimeout(detectionTimeout);
  console.log("[📡] Captured M3U8 URL:", m3u8Url);

  // If refreshing an active stream, stop the old FFmpeg process cleanly first
  if (ffmpegProcess && ffmpegProcess.exitCode === null) {
    isSwitchingStream = true;
    ffmpegProcess.kill("SIGTERM");
  }

  const headerStr = buildHeaderString(headers);
  const encodingArgs =
    selectedQuality === "Original (1080p Max)"
      ? ["-c", "copy", "-bsf:a", "aac_adtstoasc"]
      : [
          "-vf", `scale=${RES_W}:${RES_H}`,
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-b:v", `${BITRATE}k`,
          "-maxrate", `${BITRATE}k`,
          "-bufsize", `${BITRATE * 2}k`,
          "-g", "60",
          "-c:a", "aac",
          "-b:a", "128k"
        ];

  const args = [
    "-hide_banner",
    "-loglevel", "info",
    "-headers", headerStr,
    "-reconnect", "1",
    "-reconnect_streamed", "1",
    "-reconnect_delay_max", "5",
    "-i", m3u8Url,
    ...encodingArgs,
    "-f", "flv",
    RTMP_URL
  ];

  const child = spawn("ffmpeg", args, { stdio: "inherit" });
  ffmpegProcess = child;

  // Close Chrome after 15 seconds once FFmpeg is pulling cleanly to save RAM
  const cleanupTimer = setTimeout(() => {
    if (ffmpegProcess === child && child.exitCode === null) {
      console.log("[🧹] FFmpeg stream stable. Closing Chrome to free runner RAM...");
      closeBrowser();
    }
  }, 15000);

  child.on("exit", (code) => {
    clearTimeout(cleanupTimer);
    if (isSwitchingStream) {
      isSwitchingStream = false;
      return;
    }
    console.log(`FFmpeg exited with code ${code}`);
    closeBrowser();
    process.exit(code === 0 || code === 255 ? 0 : 1);
  });
}

// Stop gracefully when maximum stream duration ends
setTimeout(() => {
  console.log(`[🛑] Reached ${DURATION_MINUTES} minute limit. Stopping stream...`);
  closeBrowser();
  if (ffmpegProcess) ffmpegProcess.kill("SIGTERM");
  setTimeout(() => process.exit(0), 3000);
}, DURATION_MINUTES * 60 * 1000);

// Schedule token auto-refresh if enabled and domain is not in NO_REFRESH_DOMAINS
if (effectiveRefreshMinutes > 0) {
  setInterval(() => {
    console.log(`[🔄] ${effectiveRefreshMinutes}m elapsed. Re-opening browser to refresh stream token...`);
    launchBrowser();
  }, effectiveRefreshMinutes * 60 * 1000);
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/start") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const { m3u8Url, headers } = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        startFfmpeg(m3u8Url, headers || {});
      } catch (err) {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Bridge listening on http://127.0.0.1:${PORT}`);
  launchBrowser();
});
