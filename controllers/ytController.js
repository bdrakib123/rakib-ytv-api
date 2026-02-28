const ytdl = require("ytdl-core");

exports.getInfo = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "YouTube URL required"
    });
  }

  try {
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
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
};

exports.downloadVideo = (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "YouTube URL required"
    });
  }

  res.header("Content-Disposition", "attachment; filename=video.mp4");

  ytdl(url, { quality: "highestvideo" })
    .pipe(res);
};

exports.downloadAudio = (req, res) => {
  const { url } = req.query;

  res.header("Content-Disposition", "attachment; filename=audio.mp3");

  ytdl(url, { filter: "audioonly" })
    .pipe(res);
};
