const axios = require("axios");

const API_KEY = process.env.YT_API_KEY;

// ISO 8601 duration → seconds
function parseDuration(iso) {
  if (!iso) return 0;

  const hours = parseInt(iso.match(/(\d+)H/)?.[1] || 0);
  const minutes = parseInt(iso.match(/(\d+)M/)?.[1] || 0);
  const seconds = parseInt(iso.match(/(\d+)S/)?.[1] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

// Seconds → mm:ss / hh:mm:ss
function formatDuration(total) {
  if (!total || isNaN(total)) return "0:00";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// 🔎 SEARCH
exports.searchVideo = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        status: false,
        message: "Search query required"
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        status: false,
        message: "YT_API_KEY is not configured"
      });
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: q.trim(),
          type: "video",
          maxResults: 20,
          key: API_KEY
        }
      }
    );

    const items = response.data.items || [];

    const videoIds = items
      .map(item => item.id?.videoId)
      .filter(Boolean)
      .join(",");

    if (!videoIds) {
      return res.json({
        status: true,
        results: []
      });
    }

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

    const durationMap = {};

    for (const video of details.data.items || []) {
      durationMap[video.id] = parseDuration(
        video.contentDetails?.duration
      );
    }

    const results = items
      .filter(item => {
        const videoId = item.id?.videoId;
        const duration = durationMap[videoId] || 0;

        return videoId && duration <= 360;
      })
      .slice(0, 5)
      .map(item => {
        const videoId = item.id.videoId;
        const seconds = durationMap[videoId] || 0;

        return {
          title: item.snippet.title,
          videoId,
          url: `https://youtu.be/${videoId}`,
          thumbnail:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url ||
            null,
          channel: item.snippet.channelTitle,
          duration: seconds,
          durationText: formatDuration(seconds)
        };
      });

    return res.json({
      status: true,
      results
    });

  } catch (err) {
    console.error(
      "SEARCH ERROR:",
      err.response?.data || err.message
    );

    return res.status(
      err.response?.status === 403 ? 403 : 500
    ).json({
      status: false,
      message:
        err.response?.data?.error?.message ||
        "Search failed"
    });
  }
};

// 📄 VIDEO INFO
exports.getInfo = async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId || !videoId.trim()) {
      return res.status(400).json({
        status: false,
        message: "videoId required"
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        status: false,
        message: "YT_API_KEY is not configured"
      });
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics,contentDetails",
          id: videoId.trim(),
          key: API_KEY
        }
      }
    );

    const video = response.data.items?.[0];

    if (!video) {
      return res.status(404).json({
        status: false,
        message: "Video not found"
      });
    }

    const seconds = parseDuration(
      video.contentDetails?.duration
    );

    return res.json({
      status: true,
      title: video.snippet?.title || "",
      channel: video.snippet?.channelTitle || "",
      views: video.statistics?.viewCount || "0",
      likes: video.statistics?.likeCount || "0",
      duration: seconds,
      durationText: formatDuration(seconds),
      thumbnail:
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.default?.url ||
        null
    });

  } catch (err) {
    console.error(
      "INFO ERROR:",
      err.response?.data || err.message
    );

    return res.status(
      err.response?.status === 403 ? 403 : 500
    ).json({
      status: false,
      message:
        err.response?.data?.error?.message ||
        "Failed to fetch video info"
    });
  }
};
