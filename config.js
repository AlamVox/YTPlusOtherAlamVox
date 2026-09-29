/*
  STATIC SITE CONFIGURATION

  IMPORTANT:
  A browser-only static site cannot keep a YouTube API key secret.
  If YOUTUBE_API_KEY is filled in here, visitors can inspect it.

  For a truly private API key, use a backend/serverless proxy.
*/

const SITE_CONFIG = {
  YOUTUBE_API_KEY: "AIzaSyBzxJUQw3K9UvVGTBS_Q759Tt8aFaxTLHQ",
  YOUTUBE_CHANNEL_ID: "UChs_NgS8gS73EgIiIzxS3jA",

  YOUTUBE_NAME: "ALAM VOX",
  REAL_NAME: "MD SARFARAZ ALAM",
  EMAIL: "talk.alamvox@gmail.com",
  PROFILE_IMAGE: "https://yt3.googleusercontent.com/CERNi0TeJTg9q5M5fxTaCuJAokVcj2E7dG0L0ktYS__ePp2z8HTbC37oIya4k00WBFZVQ3-Q=s160-c-k-c0x00ffffff-no-rj",

  INSTAGRAM_URL: "https://www.instagram.com/alamvoxofficial",
  FACEBOOK_URL: "https://www.facebook.com/profile.php?id=100020233616632",
  GITHUB_URL: "https://github.com/AlamVox",

  // Google Forms > Send > Embed > copy the iframe src URL
  GOOGLE_FORM_EMBED_URL:
    "https://docs.google.com/forms/d/e/1FAIpQLSfJedU169Ijs6qmgXyK_GdrNpg305VdNZxJnH5GNObtq_WNgA/viewform?embedded=true",

  /*
    Portfolio format:
    {
      title: "Project title",
      details: "Small details shown on hover",
      url: "https://example.com"
    }
  */
  PORTFOLIO: [
    {
      title: "Project 1",
      details: "H & E Physics.",
      url: "https://hnephysics.com"
    },
    {
      title: "Project 2",
      details: "Jaman Chemistry.",
      url: "https://jamanchemistry.netlify.app"
    },
    {
      title: "Project 3",
      details: "Institute of Modern Technology | IMT",
      url: "https://imtec.in"
    },
    {
      title: "Project 4",
      details: "Institute of Modern Technology Scholarship Portal | IMTSAT",
      url: "https://scholarship.imtec.in"
    }
  ],

  // Videos at or below this duration are treated as Shorts.
  SHORT_MAX_SECONDS: 180,

  // Maximum videos loaded into each carousel.
  MAX_VIDEOS: 20,

  // Number of upload-playlist pages checked for #LongVideo/#Shorts/#Live.
  // 1 page = up to 50 uploads.
  MAX_UPLOAD_PAGES: 5
};