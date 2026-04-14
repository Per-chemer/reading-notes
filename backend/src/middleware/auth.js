const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = { authRequired };
