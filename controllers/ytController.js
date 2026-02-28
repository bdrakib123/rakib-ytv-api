const ytdl = require("@distube/ytdl-core");
const yts = require("yt-search");

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

    const result = await yts(q);

    const videos = result.videos.slice(0, 5).map(v => ({
      title: v.title,
      url: v.url,
      views: v.views,
      duration: v.timestamp,
      thumbnail: v.thumbnail
    }));

    res.json({
      status: true,
      results: videos
    });

  } catch (err) {
    console.error("SEARCH ERROR:", err.message);
    res.status(500).json({
      status: false,
      message: "Search failed"
    });
  }
};

// 📄 VIDEO INFO
exports.getInfo = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "YouTube URL required"
      });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        status: false,
        message: "Invalid YouTube URL"
      });
    }

    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    });

    res.json({
      status: true,
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      views: info.videoDetails.viewCount,
      length: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails.pop().url
    });

  } catch (err) {
    console.error("INFO ERROR:", err.message);
    res.status(500).json({
      status: false,
      message: "Failed to fetch video info"
    });
  }
};

// ⬇️ VIDEO DOWNLOAD
exports.downloadVideo = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "YouTube URL required"
      });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        status: false,
        message: "Invalid YouTube URL"
      });
    }

    res.header("Content-Disposition", "attachment; filename=video.mp4");

    ytdl(url, { quality: "highest" })
      .on("error", (err) => {
        console.error("DOWNLOAD ERROR:", err.message);
        if (!res.headersSent) {
          res.status(500).end();
        }
      })
      .pipe(res);

  } catch (err) {
    console.error("VIDEO ERROR:", err.message);
    res.status(500).json({
      status: false,
      message: "Download failed"
    });
  }
};
