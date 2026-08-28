import jwt from "jsonwebtoken";

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET
    );

    if (!["admin", "owner"].includes(decoded.role)) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    req.admin = decoded;
    next();

  } catch (err) {
    console.error("Admin JWT verification failed:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default requireAdmin;