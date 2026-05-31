const axios = require("axios");
const ytdlp = require("yt-dlp-exec");

const API_KEY = process.env.YT_API_KEY;

// ⏱ Convert ISO duration → seconds
function parseDuration(iso) {
  if (!iso) return 0;

  const hours =
    parseInt(
      iso.match(/(\d+)H/)?.[1] || 0
    );

  const minutes =
    parseInt(
      iso.match(/(\d+)M/)?.[1] || 0
    );

  const seconds =
    parseInt(
      iso.match(/(\d+)S/)?.[1] || 0
    );

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}

// ⏱ Seconds → mm:ss
function formatDuration(total) {
  if (!total || isNaN(total)) {
    return "0:00";
  }

  const hours =
    Math.floor(total / 3600);

  const minutes =
    Math.floor((total % 3600) / 60);

  const seconds =
    total % 60;

  if (hours > 0) {
    return (
      `${hours}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
    );
  }

  return (
    `${minutes}:` +
    `${String(seconds).padStart(2, "0")}`
  );
}

// 🔎 SEARCH
exports.searchVideo = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        message: "Search query required"
      });
    }

    // 🔥 FULL UNBLOCK SEARCH
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: q, // ✅ clean query
          type: "video",
          maxResults: 20,
          key: API_KEY
        }
      }
    );

    // Collect video IDs
    const videoIds = response.data.items
      .map(item => item.id.videoId)
      .join(",");

    // Fetch durations
    const details = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "contentDetails",
          id: videoIds,
          key: API_KEY
        }
      }
    );

    // Duration map
    const durationMap = {};

    details.data.items.forEach(video => {
      durationMap[video.id] =
        parseDuration(
          video.contentDetails.duration
        );
    });

    // ✅ ONLY duration filter
    const results = response.data.items
      .filter(item => {
        const duration =
          durationMap[item.id.videoId] || 0;

        return duration <= 360; // 6 min limit
      })
      .slice(0, 5)
      .map(item => {
        const seconds =
          durationMap[item.id.videoId] || 0;

        return {
          title: item.snippet.title,
          videoId: item.id.videoId,
          url:
            `https://youtu.be/${item.id.videoId}`,
          thumbnail:
            item.snippet.thumbnails.high.url,
          channel:
            item.snippet.channelTitle,

          duration: seconds,
          durationText:
            formatDuration(seconds)
        };
      });

    res.json({
      status: true,
      results
    });

  } catch (err) {
    console.error(
      "SEARCH ERROR:",
      err.response?.data || err.message
    );

    res.status(500).json({
      status: false,
      message: "Search failed"
    });
  }
};
    
   
// ⬇️ DOWNLOAD
exports.downloadVideo = async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({
        status: false,
        message: "videoId required"
      });
    }

    const url =
      `https://www.youtube.com/watch?v=${videoId}`;

    // 🔥 yt-dlp with cookies
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,

      // 🍪 cookies file
      cookies: "./cookie.txt",

      // better bypass
      addHeader: [
        "referer:youtube.com",
        "user-agent:Mozilla/5.0"
      ]
    });

    // 🎥 VIDEO FORMATS
    const videoFormats = info.formats
      .filter(f =>
        f.ext === "mp4" &&
        f.vcodec !== "none"
      )
      .slice(0, 5)
      .map(f => ({
        quality:
          f.format_note ||
          `${f.height || "?"}p`,
        filesize:
          f.filesize || null,
        url: f.url
      }));

    // 🎵 AUDIO FORMATS
    const audioFormats = info.formats
      .filter(f =>
        (
          f.ext === "m4a" ||
          f.ext === "mp3" ||
          f.ext === "webm"
        ) &&
        f.acodec !== "none"
      )
      .slice(0, 5)
      .map(f => ({
        bitrate:
          f.abr
            ? `${f.abr}kbps`
            : "audio",
        ext: f.ext,
        filesize:
          f.filesize || null,
        url: f.url
      }));

    res.json({
      status: true,

      title: info.title,
      thumbnail: info.thumbnail,

      duration: info.duration,
      durationText:
        formatDuration(info.duration),

      video: videoFormats,
      audio: audioFormats
    });

  } catch (err) {
    console.error(
      "DOWNLOAD ERROR:",
      err.stderr || err.message
    );

    res.status(500).json({
      status: false,
      message: "Download failed"
    });
  }
};

// 📄 VIDEO INFO
exports.getInfo = async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({
        status: false,
        message: "videoId required"
      });
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part:
            "snippet,statistics,contentDetails",
          id: videoId,
          key: API_KEY
        }
      }
    );

    const video =
      response.data.items[0];

    if (!video) {
      return res.status(404).json({
        status: false,
        message: "Video not found"
      });
    }

    const seconds =
      parseDuration(
        video.contentDetails.duration
      );

    res.json({
      status: true,
      title: video.snippet.title,
      channel:
        video.snippet.channelTitle,
      views:
        video.statistics.viewCount,
      likes:
        video.statistics.likeCount,

      // seconds
      duration: seconds,

      // formatted
      durationText:
        formatDuration(seconds),

      thumbnail:
        video.snippet.thumbnails.high.url
    });

  } catch (err) {
    console.error(
      "INFO ERROR:",
      err.response?.data || err.message
    );

    res.status(500).json({
      status: false,
      message:
        "Failed to fetch video info"
    });
  }
};
