import prisma, { supabase } from "../prisma.js";

/**
 * Enhanced Authentication Middleware using Supabase Native Auth
 */
export const authMiddleware = (requiredRoles = []) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      // 1. Verify token with Supabase
      const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser(token);
      
      if (sbError || !sbUser) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // 2. Fetch user from our public table to get role and other metadata
      const user = await prisma.user.findUnique({
        where: { id: sbUser.id }
      });

      if (!user) {
        return res.status(401).json({ message: "User not found in application database" });
      }

      // 3. Attach user to request
      req.user = user;

      // 4. Role-based access control
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied: insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error("Auth Middleware Error:", err);
      res.status(500).json({ message: "Authentication server error" });
    }
  };
};

export const verifyToken = authMiddleware();
export const verifyAdmin = authMiddleware(["admin"]);
export const verifySeller = authMiddleware(["admin", "seller"]);

export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    const { data: { user: sbUser } } = await supabase.auth.getUser(token);
    if (sbUser) {
      const user = await prisma.user.findUnique({ where: { id: sbUser.id } });
      if (user) req.user = user;
    }
  } catch (err) {
    // Silently proceed as guest
  }
  next();
};