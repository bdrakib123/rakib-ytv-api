module.exports = (req, res, next) => {
  const key = req.query.apikey;

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized"
    });
  }

  next();
};
