# ALAM VOX Static Website

Pure HTML + CSS + JavaScript website.

## Files

- `index.html`
- `style.css`
- `script.js`
- `config.js`
- `assets/profile.jpg` (add your image)

## YouTube tags

The site uses exact tags:

- `#LongVideo` -> Long Videos
- `#Shorts` -> Short Videos
- `#Live` -> Live Streams

The tag is checked in the title and description.

The Home page embeds the newest video with `#LongVideo`.

## YouTube statistics

Subscriber count, video count and total channel views are loaded from YouTube Data API v3.

## Carousel

- Scrollbar hidden
- Previous/next buttons
- Mouse drag
- Trackpad/mouse wheel
- Touch swipe on mobile

## Configuration

Edit `config.js`.

```js
YOUTUBE_API_KEY: "YOUR_KEY",
YOUTUBE_CHANNEL_ID: "YOUR_CHANNEL_ID"
```

Also add profile image, social URLs, Google Form URL and portfolio projects.

## API key

This is a browser-only static website, so the API key is visible to the browser. Restrict the key in Google Cloud Console to YouTube Data API v3 and your website's HTTP referrers.

If the key must be completely secret, a backend/serverless proxy is required.


## In-site video playback
All Long Videos, Short Videos and Live Streams now open in an in-site YouTube player with YouTube controls enabled. The Home hero also explicitly enables controls.
