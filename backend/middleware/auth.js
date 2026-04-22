import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  // get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.ownerId = decoded.id; // attach owner ID to request
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
  }
};

export default authMiddleware;