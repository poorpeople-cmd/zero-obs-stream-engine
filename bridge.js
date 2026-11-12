const http = require("node:http");
const { spawn, exec } = require("node:child_process");

const PORT = 8765;
const RTMP_URL = process.env.RTMP_URL;
const DURATION_MINUTES = parseInt(process.env.DURATION_MINUTES || "180", 10);

if (!RTMP_URL) {
  console.error("ERROR: RTMP_URL environment variable is missing.");
  process.exit(1);
}

let ffmpegProcess = null;

function buildHeaderString(headers) {
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\r\n") + "\r\n";
}

function startFfmpeg(m3u8Url, headers) {
  if (ffmpegProcess) return;

  const headerStr = buildHeaderString(headers);
  console.log("Captured M3U8 URL:", m3u8Url);

  const args = [
    "-hide_banner",
    "-loglevel", "info",
    "-headers", headerStr,
    "-reconnect", "1",
    "-reconnect_streamed", "1",
    "-reconnect_delay_max", "5",
    "-i", m3u8Url,
    "-c", "copy",
    "-bsf:a", "aac_adtstoasc",
    "-f", "flv",
    RTMP_URL
  ];

  ffmpegProcess = spawn("ffmpeg", args, { stdio: "inherit" });

  // Close Chrome after 15 seconds if FFmpeg is actively pulling the stream
  const cleanupTimer = setTimeout(() => {
    if (ffmpegProcess && ffmpegProcess.exitCode === null) {
      console.log("FFmpeg stream stable. Closing Chrome to free runner RAM...");
      exec("pkill -f chrome || true");
    }
  }, 15000);

  // Stop gracefully when requested duration ends
  const maxDurationTimer = setTimeout(() => {
    console.log(`Reached ${DURATION_MINUTES} minute limit. Stopping stream...`);
    if (ffmpegProcess) ffmpegProcess.kill("SIGTERM");
  }, DURATION_MINUTES * 60 * 1000);

  ffmpegProcess.on("exit", (code) => {
    clearTimeout(cleanupTimer);
    clearTimeout(maxDurationTimer);
    console.log(`FFmpeg exited with code ${code}`);
    process.exit(code === 0 || code === 255 ? 0 : 1);
  });
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

// Timeout if no .m3u8 is detected within 90 seconds
setTimeout(() => {
  if (!ffmpegProcess) {
    console.error("Timeout: No .m3u8 stream detected within 90 seconds.");
    exec("pkill -f chrome || true");
    process.exit(1);
  }
}, 90000);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Bridge listening on http://127.0.0.1:${PORT}`);
});
