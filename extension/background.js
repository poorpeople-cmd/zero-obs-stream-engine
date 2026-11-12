let streamDispatched = false;

chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    if (streamDispatched) return;
    if (details.url.startsWith("http://127.0.0.1")) return;
    if (!details.url.includes(".m3u8")) return;

    streamDispatched = true;

    const headers = {};
    for (const h of details.requestHeaders || []) {
      const key = h.name.toLowerCase();
      if (["referer", "user-agent", "cookie", "origin"].includes(key)) {
        headers[h.name] = h.value;
      }
    }

    try {
      await fetch("http://127.0.0.1:8765/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          m3u8Url: details.url,
          headers
        })
      });
    } catch (err) {
      streamDispatched = false;
      console.error("Failed to reach local bridge:", err);
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders", "extraHeaders"]
);
