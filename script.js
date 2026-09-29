/* =========================================================
   ALAM VOX - STATIC WEBSITE JAVASCRIPT
   ========================================================= */

const API_BASE = "https://www.googleapis.com/youtube/v3";

function $(selector) {
  return document.querySelector(selector);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function compact(number) {
  const n = Number(number || 0);

  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(".0", "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".0", "") + "K";

  return n.toLocaleString();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/* Exact tag filter:
   #LongVideo
   #Shorts
   #Live
*/
function hasTag(video, tag) {
  const title = String(video.snippet?.title || "").toLowerCase();
  const description = String(video.snippet?.description || "").toLowerCase();

  return (
    title.includes(tag.toLowerCase()) ||
    description.includes(tag.toLowerCase())
  );
}

function durationToSeconds(isoDuration) {
  const match = String(isoDuration || "").match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );

  if (!match) return 0;

  return (
    Number(match[1] || 0) * 3600 +
    Number(match[2] || 0) * 60 +
    Number(match[3] || 0)
  );
}

function formatDuration(seconds) {
  const total = Number(seconds || 0);

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secondsOnly = total % 60;

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secondsOnly).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secondsOnly).padStart(2, "0")}`;
}

/* =========================================================
   YOUTUBE API
   ========================================================= */

async function youtubeRequest(endpoint, params = {}) {
  const apiKey = SITE_CONFIG.YOUTUBE_API_KEY;

  const url = new URL(`${API_BASE}/${endpoint}`);

  url.searchParams.set("key", apiKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      `YouTube API error (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   STATIC SITE SETUP
   ========================================================= */

function setupSite() {
  const config = SITE_CONFIG;

  const youtubeName = $("#youtubeName");
  const realName = $("#realName");
  const profile = $("#profile");
  const instagram = $("#instagram");
  const facebook = $("#facebook");
  const github = $("#github");
  const email = $("#email");
  const emailText = $("#emailText");

  if (youtubeName) youtubeName.textContent = config.YOUTUBE_NAME || "ALAM VOX";
  if (realName) realName.textContent = config.REAL_NAME || "MD SARFARAZ ALAM";

  if (profile && config.PROFILE_IMAGE) {
    profile.src = config.PROFILE_IMAGE;
  }

  if (instagram) instagram.href = config.INSTAGRAM_URL || "#";
  if (facebook) facebook.href = config.FACEBOOK_URL || "#";
  if (github) github.href = config.GITHUB_URL || "#";

  if (email) {
    email.href = `mailto:${config.EMAIL || ""}`;
  }

  if (emailText) {
    emailText.textContent = config.EMAIL || "your@email.com";
  }

  /* Google Form */
  const googleForm = $("#googleForm");

  if (
    googleForm &&
    config.GOOGLE_FORM_EMBED_URL &&
    !config.GOOGLE_FORM_EMBED_URL.includes("YOUR_FORM_ID")
  ) {
    googleForm.innerHTML = `
      <iframe
        src="${escapeHTML(config.GOOGLE_FORM_EMBED_URL)}"
        title="Google Contact Form"
        loading="lazy">
      </iframe>
    `;
  }

  /* Portfolio */
  const portfolioGrid = $("#portfolioGrid");

  if (portfolioGrid) {
    const projects = Array.isArray(config.PORTFOLIO)
      ? config.PORTFOLIO
      : [];

    if (!projects.length) {
      portfolioGrid.innerHTML = `
        <div class="empty">
          Add portfolio projects in config.js.
        </div>
      `;
    } else {
      portfolioGrid.innerHTML = projects.map(project => `
        <article class="portfolio-card">

          <iframe
            src="${escapeHTML(project.url)}"
            loading="lazy"
            title="${escapeHTML(project.title)}">
          </iframe>

          <div class="portfolio-overlay">

            <h3>
              ${escapeHTML(project.title)}
            </h3>

            <p>
              ${escapeHTML(project.details)}
            </p>

            <a
              href="${escapeHTML(project.url)}"
              target="_blank"
              rel="noopener">
              View ↗
            </a>

          </div>

        </article>
      `).join("");
    }
  }

  /* Mobile navigation */
  const menu = $("#menu");
  const nav = $("#nav");

  if (menu && nav) {
    menu.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
      });
    });
  }
}

/* =========================================================
   CHANNEL
   ========================================================= */

async function getChannel() {
  const channelId = SITE_CONFIG.YOUTUBE_CHANNEL_ID;

  const data = await youtubeRequest("channels", {
    part: "snippet,statistics,contentDetails",
    id: channelId
  });

  if (!data.items || !data.items.length) {
    throw new Error(
      "YouTube channel not found. Please check YOUTUBE_CHANNEL_ID."
    );
  }

  return data.items[0];
}

/* =========================================================
   GET ALL TAGGED VIDEOS
   ========================================================= */

async function getTaggedVideos(channel) {
  const playlistId =
    channel.contentDetails?.relatedPlaylists?.uploads;

  if (!playlistId) {
    throw new Error(
      "YouTube uploads playlist could not be found."
    );
  }

  let pageToken = "";
  let videoIds = [];

  const maxPages = Math.max(
    1,
    Number(SITE_CONFIG.MAX_UPLOAD_PAGES || 5)
  );

  /* Read uploads playlist */
  for (let page = 0; page < maxPages; page++) {
    const playlist = await youtubeRequest("playlistItems", {
      part: "contentDetails",
      playlistId,
      maxResults: 50,
      pageToken
    });

    const ids = (playlist.items || [])
      .map(item => item.contentDetails?.videoId)
      .filter(Boolean);

    videoIds.push(...ids);

    if (!playlist.nextPageToken) {
      break;
    }

    pageToken = playlist.nextPageToken;
  }

  videoIds = [...new Set(videoIds)];

  if (!videoIds.length) {
    return [];
  }

  const allVideos = [];

  /* videos.list accepts max 50 IDs per request */
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);

    const data = await youtubeRequest("videos", {
      part: "snippet,contentDetails,statistics",
      id: batch.join(",")
    });

    allVideos.push(...(data.items || []));
  }

  return allVideos
    .map(video => {
      const durationSeconds =
        durationToSeconds(
          video.contentDetails?.duration
        );

      return {
        id: video.id,

        title:
          video.snippet?.title || "Untitled video",

        description:
          video.snippet?.description || "",

        publishedAt:
          video.snippet?.publishedAt || "",

        thumbnail:
          video.snippet?.thumbnails?.maxres?.url ||
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.medium?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",

        views:
          Number(video.statistics?.viewCount || 0),

        duration:
          formatDuration(durationSeconds),

        /* EXACT USER TAGS */
        long:
          hasTag(video, "#LongVideo"),

        short:
          hasTag(video, "#Shorts"),

        live:
          hasTag(video, "#Live")
      };
    })

    /* Only tagged videos */
    .filter(video =>
      video.long ||
      video.short ||
      video.live
    )

    /* Newest first */
    .sort(
      (a, b) =>
        new Date(b.publishedAt) -
        new Date(a.publishedAt)
    );
}

/* =========================================================
   RENDER CAROUSEL
   ========================================================= */

function renderCarousel(id, videos, emptyMessage) {
  const container = document.getElementById(id);

  if (!container) return;

  if (!videos.length) {
    container.innerHTML = `
      <div class="empty">
        ${escapeHTML(emptyMessage)}
      </div>
    `;
    return;
  }

  const maxVideos =
    Math.max(
      1,
      Number(SITE_CONFIG.MAX_VIDEOS || 20)
    );

  container.innerHTML = videos
    .slice(0, maxVideos)
    .map(video => `
      <button
        class="video-card"
        type="button"
        data-video-id="${escapeHTML(video.id)}"
        data-video-title="${escapeHTML(video.title)}"
        aria-label="Play ${escapeHTML(video.title)}"
      >

        <span class="video-thumb">
          <img
            src="${escapeHTML(video.thumbnail)}"
            alt="${escapeHTML(video.title)}"
            loading="lazy"
          >
          <span class="video-play">▶</span>
        </span>

        <span class="video-info">
          <b>${escapeHTML(video.title)}</b>
          <small>
            ${formatDate(video.publishedAt)} ·
            ${escapeHTML(video.duration)} ·
            ${compact(video.views)} views
          </small>
        </span>

      </button>
    `)
    .join("");
}

/* =========================================================
   IN-SITE VIDEO PLAYER
   ========================================================= */

function openVideoPlayer(videoId, title = "YouTube Video") {
  const modal = document.getElementById("videoModal");
  const frame = document.getElementById("videoModalFrame");
  const titleEl = document.getElementById("videoModalTitle");

  if (!modal || !frame) return;
  if (titleEl) titleEl.textContent = title;

  frame.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1"
      title="${escapeHTML(title)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("video-modal-open");
}

function closeVideoPlayer() {
  const modal = document.getElementById("videoModal");
  const frame = document.getElementById("videoModalFrame");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("video-modal-open");
  if (frame) frame.innerHTML = "";
}

function setupVideoPlayer() {
  document.querySelectorAll(".video-card").forEach(card => {
    card.addEventListener("click", () => {
      openVideoPlayer(card.dataset.videoId, card.dataset.videoTitle || "YouTube Video");
    });
  });

  const close = document.getElementById("videoModalClose");
  if (close) close.addEventListener("click", closeVideoPlayer);

  document.querySelectorAll("[data-close-video]").forEach(el => {
    el.addEventListener("click", closeVideoPlayer);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeVideoPlayer();
  });
}

/* =========================================================
   CAROUSEL CONTROLS

   THIS FUNCTION FIXES:
   "setupCarousels is not defined"
   ========================================================= */

function setupCarousels() {

  /* Arrow buttons */
  document
    .querySelectorAll(".carousel-btn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const targetId =
          button.dataset.target;

        const target =
          document.getElementById(targetId);

        if (!target) return;

        const direction =
          Number(button.dataset.dir || 1);

        const amount =
          Math.max(
            target.clientWidth * 0.78,
            280
          );

        target.scrollBy({
          left: direction * amount,
          behavior: "smooth"
        });

      });

    });

  /* Mouse / pointer drag */
  document
    .querySelectorAll(".carousel")
    .forEach(carousel => {

      let dragging = false;
      let startX = 0;
      let startScroll = 0;

      carousel.addEventListener(
        "pointerdown",
        event => {

          dragging = true;

          startX = event.clientX;

          startScroll =
            carousel.scrollLeft;

          carousel.classList.add(
            "dragging"
          );

          try {
            carousel.setPointerCapture(
              event.pointerId
            );
          } catch (_) {}

        }
      );

      carousel.addEventListener(
        "pointermove",
        event => {

          if (!dragging) return;

          const distance =
            event.clientX - startX;

          carousel.scrollLeft =
            startScroll - distance;

        }
      );

      const stopDragging = () => {
        dragging = false;
        carousel.classList.remove(
          "dragging"
        );
      };

      carousel.addEventListener(
        "pointerup",
        stopDragging
      );

      carousel.addEventListener(
        "pointercancel",
        stopDragging
      );

      carousel.addEventListener(
        "pointerleave",
        stopDragging
      );

      /* Mouse wheel -> horizontal */
      carousel.addEventListener(
        "wheel",
        event => {

          if (
            Math.abs(event.deltaY) >
            Math.abs(event.deltaX)
          ) {

            if (
              carousel.scrollWidth >
              carousel.clientWidth
            ) {

              event.preventDefault();

              carousel.scrollLeft +=
                event.deltaY;
            }
          }

        },
        {
          passive: false
        }
      );
    });
}

/* =========================================================
   ERROR HANDLER
   ========================================================= */

function showError(message) {
  const safeMessage =
    escapeHTML(message);

  const hero =
    $("#heroVideo");

  if (hero) {
    hero.innerHTML = `
      <div class="empty">
        ${safeMessage}
      </div>
    `;
  }

  [
    "longVideos",
    "shortVideos",
    "liveVideos"
  ].forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {
      element.innerHTML = `
        <div class="empty">
          ${safeMessage}
        </div>
      `;
    }
  });
}

/* =========================================================
   MAIN
   ========================================================= */

async function init() {

  try {

    setupSite();

    /* Validate API key */
    if (
      !SITE_CONFIG.YOUTUBE_API_KEY ||
      SITE_CONFIG.YOUTUBE_API_KEY.includes("PASTE_")
    ) {
      throw new Error(
        "Please add your YouTube API key in config.js."
      );
    }

    /* Validate channel ID */
    if (
      !SITE_CONFIG.YOUTUBE_CHANNEL_ID ||
      SITE_CONFIG.YOUTUBE_CHANNEL_ID.includes("PASTE_")
    ) {
      throw new Error(
        "Please add your YouTube Channel ID in config.js."
      );
    }

    /* Channel */
    const channel =
      await getChannel();

    /* Channel URL */
    const channelLink =
      $("#channelLink");

    if (channelLink) {
      channelLink.href =
        `https://www.youtube.com/channel/${encodeURIComponent(channel.id)}`;
    }

    /* Channel description */
    const bio =
      $("#bio");

    if (bio) {
      bio.textContent =
        channel.snippet?.description ||
        `Videos and projects by ${SITE_CONFIG.YOUTUBE_NAME}.`;
    }

    /* YouTube statistics */
    const subscribers =
      $("#subs");

    const videoCount =
      $("#videoCount");

    const totalViews =
      $("#views");

    if (subscribers) {
      subscribers.textContent =
        compact(
          channel.statistics?.subscriberCount
        );
    }

    if (videoCount) {
      videoCount.textContent =
        compact(
          channel.statistics?.videoCount
        );
    }

    if (totalViews) {
      totalViews.textContent =
        compact(
          channel.statistics?.viewCount
        );
    }

    /* Get videos */
    const videos =
      await getTaggedVideos(channel);

    /*
      Exact categories:

      #LongVideo
      #Shorts
      #Live
    */

    const longVideos =
      videos.filter(
        video => video.long
      );

    const shortVideos =
      videos.filter(
        video => video.short
      );

    const liveVideos =
      videos.filter(
        video => video.live
      );

    /* Render */
    renderCarousel(
      "longVideos",
      longVideos,
      'No video with "#LongVideo" tag was found.'
    );

    renderCarousel(
      "shortVideos",
      shortVideos,
      'No video with "#Shorts" tag was found.'
    );

    renderCarousel(
      "liveVideos",
      liveVideos,
      'No video with "#Live" tag was found.'
    );

    /* IMPORTANT:
       Setup controls AFTER the carousel HTML exists.
    */
    setupCarousels();
    setupVideoPlayer();

    /* Home = newest #LongVideo */
    const latestLongVideo =
      longVideos[0];

    const hero =
      $("#heroVideo");

    if (!hero) return;

    if (latestLongVideo) {

      hero.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(
            latestLongVideo.id
          )}?rel=0&modestbranding=1"
          title="${escapeHTML(
            latestLongVideo.title
          )}"
          allow="
            accelerometer;
            autoplay;
            clipboard-write;
            encrypted-media;
            gyroscope;
            picture-in-picture;
            web-share
          "
          allowfullscreen>
        </iframe>
      `;

    } else {

      hero.innerHTML = `
        <div class="empty">
          No latest <b>#LongVideo</b> found.
        </div>
      `;

    }

  } catch (error) {

    console.error(
      "ALAM VOX ERROR:",
      error
    );

    showError(
      error.message
    );
  }
}

/* Start */
document.addEventListener(
  "DOMContentLoaded",
  init
);

/* ==================================================
   ACTIVE NAVIGATION
   ================================================== */

function setupActiveNavigation() {
  const links = Array.from(document.querySelectorAll('#nav a[data-section]'));
  const sections = links
    .map(link => document.getElementById(link.dataset.section))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach(link => {
      const active = link.dataset.section === id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) setActive(visible.target.id);
  }, {
    root: null,
    rootMargin: '-35% 0px -55% 0px',
    threshold: [0, .15, .35, .6, .9]
  });

  sections.forEach(section => observer.observe(section));

  links.forEach(link => {
    link.addEventListener('click', () => setActive(link.dataset.section));
  });

  setActive('home');
}

setupActiveNavigation();
