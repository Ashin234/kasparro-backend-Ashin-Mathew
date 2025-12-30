/**
 * Authentication middleware
 * Validates x-api-key header against environment variable
 */
module.exports = function auth(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  //  Missing key
  if (!apiKey) {
    return res.status(401).json({
      error: "API key missing",
    });
  }

  //  Invalid key
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: "Invalid API key",
    });
  }

  //  Authorized → continue request
  next();
};
