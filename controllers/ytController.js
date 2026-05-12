const axios = require("axios");
const ytdlp = require("yt-dlp-exec");

const API_KEY = process.env.YT_API_KEY;

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

    // Search videos
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: `${q} official song audio lyrics music`,
          type: "video",
          videoCategoryId: "10",
          maxResults: 20,
          key: API_KEY
        }
      }
    );

    // Get all video IDs
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

    // Convert ISO duration → seconds
    const parseDuration = (iso) => {
      const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);

      const minutes = parseInt(match?.[1] || 0);
      const seconds = parseInt(match?.[2] || 0);

      return (minutes * 60) + seconds;
    };

    // Duration map
    const durationMap = {};

    details.data.items.forEach(video => {
      durationMap[video.id] = parseDuration(
        video.contentDetails.duration
      );
    });

    // Filter results
    const results = response.data.items
      .filter(item => {
        const title = item.snippet.title.toLowerCase();

        return (
          durationMap[item.id.videoId] <= 360 &&

          // ❌ Remove movie related
          !title.includes("movie") &&
          !title.includes("film") &&
          !title.includes("trailer") &&
          !title.includes("teaser") &&
          !title.includes("episode") &&
          !title.includes("scene") &&
          !title.includes("serial") &&
          !title.includes("drama") &&
          !title.includes("netflix") &&
          !title.includes("web series") &&

          // ✅ Music related
          (
            title.includes("song") ||
            title.includes("music") ||
            title.includes("audio") ||
            title.includes("lyrics") ||
            title.includes("official")
          )
        );
      })
      .slice(0, 5)
      .map(item => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        url: `https://youtu.be/${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.high.url,
        channel: item.snippet.channelTitle,
        duration: durationMap[item.id.videoId]
      }));

    res.json({
      status: true,
      results
    });

  } catch (err) {
    console.error("SEARCH ERROR:", err.response?.data || err.message);

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

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true
    });

    res.json({
      status: true,
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats: info.formats
        .filter(f => f.ext === "mp4")
        .slice(0, 5)
        .map(f => ({
          quality: f.format_note,
          url: f.url
        }))
    });

  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);

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
          part: "snippet,statistics,contentDetails",
          id: videoId,
          key: API_KEY
        }
      }
    );

    const video = response.data.items[0];

    if (!video) {
      return res.status(404).json({
        status: false,
        message: "Video not found"
      });
    }

    res.json({
      status: true,
      title: video.snippet.title,
      channel: video.snippet.channelTitle,
      views: video.statistics.viewCount,
      likes: video.statistics.likeCount,
      duration: video.contentDetails.duration,
      thumbnail: video.snippet.thumbnails.high.url
    });

  } catch (err) {
    console.error("INFO ERROR:", err.response?.data || err.message);

    res.status(500).json({
      status: false,
      message: "Failed to fetch video info"
    });
  }
};
