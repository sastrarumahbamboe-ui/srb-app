// ================================================================
// Jurnal Sastra Rumah Bamboe — logika PWA
// Sumber konten: feed publik Blogger (JSONP, tanpa perlu API key)
// ================================================================

const BLOG_BASE = "https://sastrarumahbamboe23081980.blogspot.com";
const PAGE_SIZE = 12;

const state = {
  label: "",
  query: "",
  startIndex: 1,
  loading: false,
  exhausted: false,
};

const els = {
  dateEl: document.getElementById("masthead-date"),
  navToggle: document.getElementById("nav-toggle"),
  categoryNav: document.getElementById("category-nav"),
  chips: Array.from(document.querySelectorAll(".cat-chip")),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  featured: document.getElementById("featured"),
  sectionHeading: document.getElementById("section-heading"),
  postList: document.getElementById("post-list"),
  statusMsg: document.getElementById("status-msg"),
  loadMore: document.getElementById("load-more"),
  installBtn: document.getElementById("install-btn"),
  offlineBanner: document.getElementById("offline-banner"),
  year: document.getElementById("year"),
};

// ---------- Utilitas ----------

function setDate() {
  const now = new Date();
  els.dateEl.textContent = now.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  els.year.textContent = now.getFullYear();
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || div.innerText || "").trim();
}

function excerpt(html, len = 140) {
  const text = stripHtml(html);
  return text.length > len ? text.slice(0, len).trim() + "…" : text;
}

function findThumb(entry) {
  if (entry.media$thumbnail && entry.media$thumbnail.url) {
    // Blogger thumbnail kecil (72px) -> minta ukuran lebih besar
    return entry.media$thumbnail.url.replace(/\/s72-c\//, "/w300-h300-c/");
  }
  return null;
}

function entryUrl(entry) {
  const link = (entry.link || []).find((l) => l.rel === "alternate");
  return link ? link.href : "#";
}

function entryLabel(entry) {
  const cats = entry.category || [];
  return cats.length ? cats[0].term : "";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ---------- JSONP loader (feed Blogger tidak selalu kirim header CORS) ----------

let jsonpCounter = 0;

function loadFeedJsonp(url) {
  return new Promise((resolve, reject) => {
    const cbName = `srbFeedCb${Date.now()}_${jsonpCounter++}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Waktu permintaan habis"));
    }, 12000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      script.remove();
    }

    window[cbName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${cbName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("Gagal memuat data"));
    };
    document.body.appendChild(script);
  });
}

function buildFeedUrl({ label, query, startIndex, maxResults }) {
  let path = "/feeds/posts/default";
  if (label) path += `/-/${encodeURIComponent(label)}`;
  const params = new URLSearchParams({
    alt: "json-in-script",
    "max-results": String(maxResults),
    "start-index": String(startIndex),
  });
  if (query) params.set("q", query);
  return `${BLOG_BASE}${path}?${params.toString()}`;
}

async function fetchPosts({ label, query, startIndex, maxResults }) {
  const url = buildFeedUrl({ label, query, startIndex, maxResults });
  const data = await loadFeedJsonp(url);
  const entries = (data.feed && data.feed.entry) || [];
  return entries;
}

// ---------- Cache lokal sederhana (untuk mode offline dasar) ----------

const CACHE_KEY = "srb-last-posts";

function cachePosts(entries) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries.slice(0, PAGE_SIZE)));
  } catch (e) { /* abaikan jika penyimpanan penuh */ }
}

function getCachedPosts() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// ---------- Render ----------

function renderFeatured(entry) {
  if (!entry) {
    els.featured.hidden = true;
    els.featured.innerHTML = "";
    return;
  }
  const thumb = findThumb(entry);
  els.featured.hidden = false;
  els.featured.innerHTML = `
    <a href="${entryUrl(entry)}" target="_blank" rel="noopener">
      <div class="featured-label">${escapeHtml(entryLabel(entry) || "Sorotan")}</div>
      <h2 class="featured-title">${escapeHtml(entry.title.$t)}</h2>
      <p class="featured-excerpt">${escapeHtml(excerpt(entry.content ? entry.content.$t : entry.summary.$t, 180))}</p>
      <div class="featured-meta">${formatDate(entry.published.$t)}</div>
    </a>`;
}

function renderPostItem(entry) {
  const thumb = findThumb(entry);
  const a = document.createElement("a");
  a.className = "post-item";
  a.href = entryUrl(entry);
  a.target = "_blank";
  a.rel = "noopener";
  a.innerHTML = `
    ${thumb ? `<img class="post-thumb" src="${thumb}" alt="" loading="lazy">` : ""}
    <div class="post-body">
      <div class="post-label">${escapeHtml(entryLabel(entry) || "Tulisan")}</div>
      <h3 class="post-title">${escapeHtml(entry.title.$t)}</h3>
      <div class="post-meta">${formatDate(entry.published.$t)}</div>
    </div>`;
  return a;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function setHeading() {
  if (state.query) {
    els.sectionHeading.textContent = `Hasil pencarian: "${state.query}"`;
  } else if (state.label) {
    const chip = els.chips.find((c) => c.dataset.label === state.label);
    els.sectionHeading.textContent = chip ? chip.textContent : "Tulisan";
  } else {
    els.sectionHeading.textContent = "Tulisan Terbaru";
  }
}

// ---------- Alur utama ----------

async function loadInitial() {
  state.startIndex = 1;
  state.exhausted = false;
  els.postList.innerHTML = "";
  setHeading();
  els.statusMsg.textContent = "Memuat tulisan…";
  els.loadMore.hidden = true;

  try {
    const entries = await fetchPosts({
      label: state.label, query: state.query, startIndex: 1, maxResults: PAGE_SIZE,
    });

    if (!entries.length) {
      els.statusMsg.textContent = "Belum ada tulisan untuk kategori/pencarian ini.";
      renderFeatured(null);
      return;
    }

    if (!state.label && !state.query) {
      renderFeatured(entries[0]);
      entries.slice(1).forEach((e) => els.postList.appendChild(renderPostItem(e)));
      cachePosts(entries);
    } else {
      renderFeatured(null);
      entries.forEach((e) => els.postList.appendChild(renderPostItem(e)));
    }

    els.statusMsg.textContent = "";
    state.startIndex = PAGE_SIZE + 1;
    els.loadMore.hidden = entries.length < PAGE_SIZE;
  } catch (err) {
    console.error(err);
    const cached = (!state.label && !state.query) ? getCachedPosts() : [];
    if (cached.length) {
      els.statusMsg.textContent = "Menampilkan tulisan tersimpan (offline).";
      renderFeatured(cached[0]);
      cached.slice(1).forEach((e) => els.postList.appendChild(renderPostItem(e)));
    } else {
      els.statusMsg.textContent = "Tidak dapat memuat tulisan. Periksa koneksi internet.";
    }
  }
}

async function loadMorePosts() {
  if (state.loading || state.exhausted) return;
  state.loading = true;
  els.loadMore.textContent = "Memuat…";

  try {
    const entries = await fetchPosts({
      label: state.label, query: state.query, startIndex: state.startIndex, maxResults: PAGE_SIZE,
    });
    entries.forEach((e) => els.postList.appendChild(renderPostItem(e)));
    state.startIndex += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) {
      state.exhausted = true;
      els.loadMore.hidden = true;
    }
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
    els.loadMore.textContent = "Muat tulisan lainnya";
  }
}

// ---------- Event: kategori ----------

els.chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    els.chips.forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    state.label = chip.dataset.label;
    state.query = "";
    els.searchInput.value = "";
    els.categoryNav.classList.remove("is-open");
    loadInitial();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

els.navToggle.addEventListener("click", () => {
  const open = els.categoryNav.classList.toggle("is-open");
  els.navToggle.setAttribute("aria-expanded", String(open));
});

// ---------- Event: pencarian ----------

els.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = els.searchInput.value.trim();
  if (!q) return;
  state.query = q;
  state.label = "";
  els.chips.forEach((c) => c.classList.remove("is-active"));
  loadInitial();
});

// ---------- Event: muat lainnya ----------

els.loadMore.addEventListener("click", loadMorePosts);

// ---------- Status koneksi ----------

function updateOnlineStatus() {
  els.offlineBanner.hidden = navigator.onLine;
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// ---------- Install prompt (Android/Chrome) ----------

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  els.installBtn.hidden = false;
});

els.installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  els.installBtn.hidden = true;
});

// ---------- Service worker ----------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("Registrasi service worker gagal:", err);
    });
  });
}

// ---------- Mulai ----------

setDate();
updateOnlineStatus();
loadInitial();
