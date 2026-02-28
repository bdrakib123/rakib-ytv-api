const ytdl = require("ytdl-core");

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

    const info = await ytdl.getInfo(url);

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

exports.downloadAudio = async (req, res) => {
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

    res.header("Content-Disposition", "attachment; filename=audio.mp3");

    ytdl(url, { filter: "audioonly" })
      .on("error", (err) => {
        console.error("AUDIO ERROR:", err.message);
        if (!res.headersSent) {
          res.status(500).end();
        }
      })
      .pipe(res);

  } catch (err) {
    console.error("AUDIO CATCH ERROR:", err.message);
    res.status(500).json({
      status: false,
      message: "Audio download failed"
    });
  }
};
