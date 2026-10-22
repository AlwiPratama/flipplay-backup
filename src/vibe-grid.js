// ===== Konfigurasi =====
// Sumber data berurutan: AniList (utama) -> Kitsu (cadangan) -> data lokal.
const MAX_ITEMS = 25;
const TIMEOUT_MS = 12000;

const ANILIST_URL = "https://graphql.anilist.co";
const ANILIST_QUERY = `
  query ($perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
        id
        title { romaji english }
        genres
        status
        averageScore
        seasonYear
        episodes
        description(asHtml: false)
        coverImage { extraLarge large }
      }
    }
  }`;

const KITSU_URL =
  "https://kitsu.io/api/edge/anime?" +
  new URLSearchParams({
    "page[limit]": "20",
    sort: "-averageRating",
    include: "genres",
  }).toString();

// Dipakai bila kedua API tidak bisa diakses.
const FALLBACK_MEDIA = [
  { id: 1, title: "Fullmetal Alchemist: Brotherhood", genres: ["Action", "Adventure"], status: "Finished Airing", rating: 9.1, year: "2009", episodes: 64, summary: "Dua bersaudara mencari cara mengembalikan tubuh mereka setelah eksperimen alkimia yang gagal." },
  { id: 2, title: "Attack on Titan", genres: ["Action", "Drama"], status: "Finished Airing", rating: 8.6, year: "2013", episodes: 25, summary: "Umat manusia bertahan hidup di balik tembok yang melindungi mereka dari para Titan." },
  { id: 3, title: "Haikyu!!", genres: ["Sports", "Comedy"], status: "Finished Airing", rating: 8.4, year: "2014", episodes: 25, summary: "Shoyo Hinata mengejar mimpinya menjadi pemain voli hebat bersama tim SMA Karasuno." },
  { id: 4, title: "Violet Evergarden", genres: ["Drama", "Fantasy"], status: "Finished Airing", rating: 8.7, year: "2018", episodes: 13, summary: "Seorang mantan prajurit belajar memahami perasaan manusia lewat kata-kata yang ia tulis." },
  { id: 5, title: "One Piece", genres: ["Action", "Adventure"], status: "Currently Airing", rating: 8.7, year: "1999", episodes: 1000, summary: "Monkey D. Luffy dan kru Topi Jerami berlayar mencari harta karun legendaris." },
  { id: 6, title: "Your Lie in April", genres: ["Drama", "Romance"], status: "Finished Airing", rating: 8.6, year: "2014", episodes: 22, summary: "Seorang pianis muda menemukan kembali musik dan warna hidupnya setelah bertemu pemain biola." },
  { id: 7, title: "Frieren: Beyond Journey's End", genres: ["Adventure", "Drama", "Fantasy"], status: "Finished Airing", rating: 9.3, year: "2023", episodes: 28, summary: "Penyihir elf Frieren menempuh perjalanan baru untuk memahami manusia dan kenangan." },
  { id: 8, title: "Mob Psycho 100", genres: ["Action", "Comedy"], status: "Finished Airing", rating: 8.5, year: "2016", episodes: 12, summary: "Shigeo Kageyama berusaha hidup biasa sambil mengendalikan kekuatan psikisnya." },
];

// Aura = aturan penyaringan berdasarkan genre dan karakter serial.
const AURAS = {
  all: { hint: "", match: () => true },
  "high-energy": {
    hint: "High Energy: aksi, petualangan, sci-fi, dan olahraga.", //MENENTUKAN ANIME YANG MASUK DALAM SETIAP AURA
    match: (item) =>
      item.genres.some((g) => ["Action", "Adventure", "Sci-Fi", "Sports"].includes(g)),
  },
  melancholy: {
    hint: "Melancholy: drama dan romansa yang bukan komedi.",
    match: (item) =>
      item.genres.some((g) => ["Drama", "Romance"].includes(g)) &&
      !item.genres.includes("Comedy"),
  },
  binge: {
    hint: "Binge Mode: serial tamat dengan rating 8+, atau serial panjang 24+ episode.",
    match: (item) =>
      (item.status === "Finished Airing" && item.rating >= 8) || item.episodes >= 24,
  },
};


const ACTIVE_CLASSES = ["bg-accent", "text-on-accent", "border-accent"];
const IDLE_CLASSES = ["text-main", "border-line"];

// ===== Elemen DOM =====
const searchInput = document.querySelector("#search-input");
const auraList = document.querySelector("#aura-list");
const auraButtons = document.querySelectorAll(".aura-btn");
const auraHint = document.querySelector("#aura-hint");
const mediaGrid = document.querySelector("#media-grid");
const resultCount = document.querySelector("#result-count");
const loadingMessage = document.querySelector("#loading-message");
const errorBox = document.querySelector("#error-box");
const errorMessage = document.querySelector("#error-message");
const retryButton = document.querySelector("#retry-button");

// ===== State =====
let allMedia = [];
let activeAura = "all";
let keyword = "";
let sourceName = "";

// ===== Helper =====
const escapeHTML = (text) => {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
};

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max).trim()}…` : text;

const cleanText = (html, fallback = "Sinopsis belum tersedia.") => {
  const text = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return truncate(text || fallback, 140);
};

const getImageURL = (item) => {
  try {
    const image = new URL(item.image);
    return image.protocol === "https:" ? image.href : "";
  } catch {
    return "";
  }
};

// Poster cadangan (SVG) bila gambar asli kosong atau gagal dimuat.
const createFallbackArtwork = (item) => {
  const palettes = [
    ["#142d4e", "#62b6cb", "#f2d492"],
    ["#351f3b", "#d66b75", "#f6c177"],
    ["#153c3a", "#47a992", "#f3d77c"],
    ["#32234f", "#8875d1", "#f3b7a1"],
  ];
  const [bg, accent, highlight] = palettes[Number(item.id) % palettes.length];
  const lines = [];
  let line = "";
  item.title.split(/\s+/).forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 19 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);

  const titleMarkup = lines
    .slice(0, 4)
    .map((t, i) => `<text x="32" y="${438 + i * 34}" fill="#fff" font-family="Arial, sans-serif" font-size="27" font-weight="700">${escapeHTML(t)}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#101827"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${highlight}" stop-opacity=".9"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="600" fill="url(#bg)"/>
    <circle cx="270" cy="220" r="170" fill="url(#glow)"/>
    <path d="M-30 390 130 205l70 85 75-112 155 212v210H-30Z" fill="${accent}" opacity=".72"/>
    <path d="m-30 450 135-115 90 90 105-120 130 120v205H-30Z" fill="#101827" opacity=".74"/>
    <circle cx="290" cy="175" r="42" fill="${highlight}" opacity=".9"/>
    ${titleMarkup}
    <text x="32" y="570" fill="#fff" fill-opacity=".72" font-family="Arial, sans-serif" font-size="14">${escapeHTML(item.genres.slice(0, 2).join(" · "))}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const fetchJSON = async (url, options = {}) => { //mengambil data dari API
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} membalas status ${response.status}.`);
  return response.json();
};

// ===== Sumber data =====
const loadFromAniList = async () => {
  const result = await fetchJSON(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { perPage: MAX_ITEMS } }),
  });
  const list = result?.data?.Page?.media;
  if (!Array.isArray(list) || list.length === 0) throw new Error("Format data AniList tidak sesuai.");

  return list.map((a) => ({
    id: a.id,
    title: a.title.english || a.title.romaji || "Tanpa judul",
    genres: a.genres || [],
    status: a.status === "FINISHED" ? "Finished Airing" : "Currently Airing",
    rating: a.averageScore ? Number((a.averageScore / 10).toFixed(1)) : 0,
    year: a.seasonYear || "-",
    episodes: Number(a.episodes) || 0,
    image: a.coverImage?.extraLarge || a.coverImage?.large || "",
    summary: cleanText(a.description),
  }));
};
// ===== Sumber data cadangan  jika api tidak dapat terhubung=====
const loadFromKitsu = async () => {
  const result = await fetchJSON(KITSU_URL, { headers: { Accept: "application/vnd.api+json" } });
  if (!Array.isArray(result.data) || result.data.length === 0) throw new Error("Format data Kitsu tidak sesuai.");

  const genreNames = new Map(
    (result.included || [])
      .filter((entry) => entry.type === "genres")
      .map((entry) => [entry.id, entry.attributes.name])
  );

  return result.data.map((a) => {
    const attr = a.attributes;
    const genreIds = a.relationships?.genres?.data || [];
    return {
      id: Number(a.id),
      title: attr.titles?.en || attr.canonicalTitle || "Tanpa judul",
      genres: genreIds.map((g) => genreNames.get(g.id)).filter(Boolean),
      status: attr.status === "finished" ? "Finished Airing" : "Currently Airing",
      rating: attr.averageRating ? Number((Number(attr.averageRating) / 10).toFixed(1)) : 0,
      year: attr.startDate ? attr.startDate.slice(0, 4) : "-",
      episodes: Number(attr.episodeCount) || 0,
      image: attr.posterImage?.large || attr.posterImage?.original || "",
      summary: cleanText(attr.synopsis),
    };
  });
};

// ===== Render Tampilan Setiap Anime=====
const renderCard = (item) => {
  const imageURL = getImageURL(item);
  const fallbackArt = createFallbackArtwork(item);
  const altText = `${imageURL ? "Poster" : "Ilustrasi sampul cadangan"} ${item.title}`;
  //template literal untuk menampilkan setiap kartu anime
  return `
    <article class="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel">
      <img class="aspect-[2/3] w-full object-cover" src="${escapeHTML(imageURL || fallbackArt)}" data-fallback="${escapeHTML(fallbackArt)}" alt="${escapeHTML(altText)}" loading="lazy" referrerpolicy="no-referrer" />
      <div class="flex flex-1 flex-col gap-1.5 p-3">
        <h3 class="clamp-2 font-['Space_Grotesk'] text-sm font-semibold leading-snug sm:text-base" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</h3>
        <p class="text-xs text-muted"><span class="font-bold text-accent">${item.rating ? `★ ${item.rating.toFixed(1)}` : "★ —"}</span> · ${escapeHTML(item.year)} · ${item.status === "Finished Airing" ? "Tamat" : "Masih tayang"}</p>
        <p class="clamp-1 text-xs text-muted">${escapeHTML(item.genres.slice(0, 3).join(", ") || "Tanpa genre")}</p>
        <div class="hidden sm:block"><p class="clamp-2 text-xs leading-5 text-subtle">${escapeHTML(item.summary)}</p></div>
      </div>
    </article>`;
};

const renderMedia = (items) => {
  const label = sourceName ? ` · sumber: ${sourceName}` : "";
  resultCount.textContent = `Menampilkan ${items.length} dari ${allMedia.length} judul${label}`;

  if (items.length === 0) {
    mediaGrid.innerHTML = `
      <p class="col-span-full rounded-2xl border border-line bg-panel p-6 text-sm text-muted">
        Tidak ada judul yang cocok. Coba kata kunci lain atau pilih Aura yang berbeda.
      </p>`;
    return;
  }
  mediaGrid.innerHTML = items.map(renderCard).join("");
};

const applyFilters = () => {
  const filtered = allMedia.filter(
    (item) => AURAS[activeAura].match(item) && item.title.toLowerCase().includes(keyword)
  );
  renderMedia(filtered);
};

const updateAuraButtons = () => {
  auraButtons.forEach((button) => {
    const isActive = button.dataset.aura === activeAura;
    button.classList.remove(...(isActive ? IDLE_CLASSES : ACTIVE_CLASSES));
    button.classList.add(...(isActive ? ACTIVE_CLASSES : IDLE_CLASSES));
    button.setAttribute("aria-pressed", String(isActive));
  });
  auraHint.textContent = AURAS[activeAura].hint;
};

// ===== Ambil data =====
const getMedia = async () => {
  loadingMessage.classList.remove("hidden");
  errorBox.classList.add("hidden");
  mediaGrid.innerHTML = "";
  resultCount.textContent = "";

  const sources = [
    ["AniList", loadFromAniList],
    ["Kitsu", loadFromKitsu],
  ];

  let loaded = null;
  for (const [name, loader] of sources) {
    try {
      const data = await loader();
      loaded = { name, data: data.sort((a, b) => b.rating - a.rating).slice(0, MAX_ITEMS) };
      break;
    } catch (error) {
      console.warn(`Gagal memuat dari ${name}:`, error);
    }
  }

  if (loaded) {
    allMedia = loaded.data;
    sourceName = loaded.name;
  } else {
    allMedia = FALLBACK_MEDIA; //jika kedua API gagal, gunakan data cadangan
    sourceName = "data cadangan";
    errorMessage.textContent =
      "AniList dan Kitsu tidak bisa diakses. Data cadangan ditampilkan agar kamu tetap bisa menjelajah.";
    errorBox.classList.remove("hidden");
  }

  applyFilters();
  loadingMessage.classList.add("hidden");
};

// ===== Event handling =====
searchInput.addEventListener("input", () => {
  keyword = searchInput.value.trim().toLowerCase(); // UNTUK PENCARIAN REALTIME
  applyFilters();
});

auraList.addEventListener("click", (event) => { //TOMBOL KLIK AURA
  const button = event.target.closest(".aura-btn");
  if (!button) return;
  activeAura = button.dataset.aura;
  updateAuraButtons();
  applyFilters();
});

retryButton.addEventListener("click", getMedia);

// Poster gagal dimuat -> ganti dengan ilustrasi cadangan.
mediaGrid.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (img.tagName === "IMG" && img.dataset.fallback && !img.dataset.failed) {
      img.dataset.failed = "1";
      img.src = img.dataset.fallback;
    }
  },
  true
);

getMedia();