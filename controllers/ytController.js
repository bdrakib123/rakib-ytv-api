const axios = require("axios");

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

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q,
          type: "video",
          maxResults: 5,
          key: API_KEY
        }
      }
    );

    const results = response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://youtu.be/${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high.url,
      channel: item.snippet.channelTitle
    }));

    res.json({ status: true, results });

  } catch (err) {
    console.error("SEARCH ERROR:", err.response?.data || err.message);
    res.status(500).json({
      status: false,
      message: "Search failed"
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
