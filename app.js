/* Quick Link Send - minimal room-based link sharer
 * RESTDB integration via config.js (RestDBConfig). Falls back to localStorage demo mode.
 */

(function () {
  const qs = new URLSearchParams(location.search);
  const roomParam = qs.get("room") || "";

  // Elements
  const el = (id) => document.getElementById(id);
  const landing = el("landing");
  const roomSection = el("room");
  const roomCodeEl = el("roomCode");
  const displayName = el("displayName");
  const urlInput = el("urlInput");
  const sendBtn = el("sendBtn");
  const refreshBtn = el("refreshBtn");
  const errorBox = el("error");
  const linksList = el("linksList");
  const copyLinkBtn = el("copyLinkBtn");
  const configWarning = el("configWarning");
  const createRoomBtn = el("createRoomBtn");
  const joinRoomInput = el("joinRoomInput");
  const joinRoomBtn = el("joinRoomBtn");

  // Config + mode
  const cfg = (window.RestDBConfig || {});
  const restdbConfigured = cfg.baseUrl && cfg.apiKey && !/YOURDB|YOUR_RESTDB_API_KEY/.test(cfg.baseUrl + cfg.apiKey);
  const DEMO_MODE = !restdbConfigured;

  if (DEMO_MODE) {
    configWarning.hidden = false;
    console.info("RESTDB not configured; running in local demo mode.");
  }

  // State
  let currentRoom = normalizeRoom(roomParam);
  const POLL_MS = 2500;
  let pollTimer = null;

  // Init
  window.addEventListener("DOMContentLoaded", () => {
    // Prefill name
    const savedName = localStorage.getItem("qls:name") || "";
    if (savedName) displayName.value = savedName;

    if (currentRoom) showRoom(currentRoom);
    else showLanding();

    wireEvents();
  });

  function wireEvents() {
    displayName.addEventListener("change", () => {
      localStorage.setItem("qls:name", displayName.value.trim());
    });

    sendBtn.addEventListener("click", onSend);
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onSend();
    });
    refreshBtn.addEventListener("click", loadLinks);

    copyLinkBtn.addEventListener("click", async () => {
      const link = shareUrl(currentRoom);
      try {
        await navigator.clipboard.writeText(link);
        toast(copyLinkBtn, "Copied");
      } catch (_) {
        prompt("Copy this room link:", link);
      }
    });

    createRoomBtn?.addEventListener("click", () => {
      const code = generateRoomCode();
      navigateToRoom(code);
    });

    joinRoomBtn?.addEventListener("click", () => {
      const code = normalizeRoom(joinRoomInput.value || "");
      if (!code) return setError("Enter a valid room code.");
      navigateToRoom(code);
    });
  }

  function showLanding() {
    landing.hidden = false;
    roomSection.hidden = true;
    copyLinkBtn.hidden = true;
  }

  function showRoom(room) {
    currentRoom = room;
    roomCodeEl.textContent = room;
    landing.hidden = true;
    roomSection.hidden = false;
    copyLinkBtn.hidden = false;
    startPolling();
    loadLinks();
  }

  function navigateToRoom(code) {
    const url = new URL(location.href);
    url.searchParams.set("room", code);
    location.href = url.toString();
  }

  function shareUrl(code) {
    const url = new URL(location.href);
    url.searchParams.set("room", code);
    return url.toString();
  }

  function normalizeRoom(str) {
    const s = (str || "").trim().toLowerCase();
    return s.replace(/[^a-z0-9-]/g, "");
  }

  function generateRoomCode() {
    // Simple, URL-safe code: qls- + 7 base36 chars
    const rand = Math.random().toString(36).slice(2, 9);
    return `qls-${rand}`;
  }

  function setError(msg) {
    errorBox.textContent = msg || "";
    errorBox.hidden = !msg;
  }

  function toast(anchorEl, text) {
    const el = document.createElement("span");
    el.textContent = text;
    el.className = "toast";
    el.style.position = "absolute";
    el.style.transform = "translateY(-160%)";
    el.style.background = "#111827";
    el.style.color = "#fff";
    el.style.padding = "4px 8px";
    el.style.borderRadius = "6px";
    el.style.fontSize = "12px";
    el.style.whiteSpace = "nowrap";
    const parent = anchorEl.parentElement || document.body;
    parent.style.position = parent.style.position || "relative";
    parent.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function ensureHttpUrl(u) {
    try {
      const hasProtocol = /^(https?:)?\/\//i.test(u);
      return hasProtocol ? u : "https://" + u;
    } catch (_) { return u; }
  }

  async function onSend() {
    setError("");
    const rawUrl = (urlInput.value || "").trim();
    if (!rawUrl) return setError("Enter a URL to send.");
    let linkUrl = ensureHttpUrl(rawUrl);
    try { new URL(linkUrl); } catch { return setError("Please enter a valid URL."); }
    const sender = (displayName.value || "").trim() || "Anon";

    sendBtn.disabled = true;
    try {
      const payload = {
        room: currentRoom,
        url: linkUrl,
        sender,
        createdAt: new Date().toISOString(),
      };
      await LinksAPI.create(payload);
      urlInput.value = "";
      await loadLinks();
    } catch (e) {
      console.error(e);
      setError("Failed to send link. Check RESTDB config and CORS settings.");
    } finally {
      sendBtn.disabled = false;
    }
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(loadLinks, POLL_MS);
  }

  async function loadLinks() {
    try {
      const items = await LinksAPI.list(currentRoom);
      renderList(items);
    } catch (e) {
      console.error(e);
      setError("Failed to load links. Check RESTDB config and CORS.");
    }
  }

  function renderList(items) {
    linksList.innerHTML = "";
    if (!items || items.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No links yet. Be the first to send one!";
      li.style.justifyContent = "center";
      li.style.color = "#6b7280";
      linksList.appendChild(li);
      return;
    }

    for (const item of items) {
      const li = document.createElement("li");
      const info = document.createElement("div");
      info.className = "link-info";
      const a = document.createElement("a");
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "link-url";
      a.textContent = item.url;
      const meta = document.createElement("div");
      meta.className = "link-meta";
      const when = timeAgo(item.createdAt);
      meta.textContent = `${item.sender || "Anon"} • ${when}`;
      info.appendChild(a);
      info.appendChild(meta);

      const openBtn = document.createElement("button");
      openBtn.className = "btn btn-primary";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => window.open(item.url, "_blank"));

      li.appendChild(info);
      li.appendChild(openBtn);
      linksList.appendChild(li);
    }
  }

  function timeAgo(dateStr) {
    const then = new Date(dateStr || Date.now()).getTime();
    const sec = Math.max(1, Math.floor((Date.now() - then) / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // Data layer: RESTDB or local demo
  const LinksAPI = DEMO_MODE ? LocalLinksAPI() : RestDBLinksAPI(cfg);

  function RestDBLinksAPI(cfg) {
    const base = cfg.baseUrl.replace(/\/$/, "");
    const coll = (cfg.collections && cfg.collections.links) || "links";
    const headers = {
      "content-type": "application/json",
      "x-apikey": cfg.apiKey,
      "cache-control": "no-cache"
    };

    return {
      async list(room) {
        const q = encodeURIComponent(JSON.stringify({ room }));
        // Using sort by createdAt ascending
        const url = `${base}/${coll}?q=${q}&sort=createdAt&dir=1`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`RESTDB list failed: ${res.status}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      },
      async create(item) {
        const url = `${base}/${coll}`;
        const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(item) });
        if (!res.ok) throw new Error(`RESTDB create failed: ${res.status}`);
        return res.json();
      }
    };
  }

  function LocalLinksAPI() {
    return {
      async list(room) {
        const raw = localStorage.getItem(lsKey(room));
        const arr = raw ? JSON.parse(raw) : [];
        return arr;
      },
      async create(item) {
        const arr = await this.list(item.room);
        arr.push(item);
        localStorage.setItem(lsKey(item.room), JSON.stringify(arr));
      }
    };
  }

  function lsKey(room) { return `qls:links:${room}`; }

})();
