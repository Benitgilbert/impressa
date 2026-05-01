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
        console.warn("Supabase Auth Error:", sbError?.message || "No user found for token");
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // 2. Fetch user from our public table to get role and other metadata
      let user = await prisma.user.findUnique({
        where: { id: sbUser.id }
      });

      // SELF-HEALING: If user exists in Auth but not in our public table, create them now.
      // This prevents "User not found" errors if the DB trigger failed or was delayed.
      if (!user) {
        console.warn(`User ${sbUser.id} missing from public.User table. Attempting to heal...`);
        try {
          user = await prisma.user.create({
            data: {
              id: sbUser.id,
              email: sbUser.email,
              name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
              role: (sbUser.user_metadata?.role || "customer"),
            }
          });
          console.info(`Successfully healed user record for ${sbUser.email}`);
        } catch (createErr) {
          console.error("Failed to heal user record:", createErr.message);
          return res.status(401).json({ message: "User account is in an inconsistent state" });
        }
      }

      // 3. Attach user to request
      req.user = user;

      // 4. Role-based access control
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        console.warn(`[AUTH] Access denied for user ${user.email}. Role: ${user.role}, Required: ${requiredRoles.join(', ')}`);
        return res.status(403).json({ 
          message: "Access denied: insufficient permissions",
          debug: process.env.NODE_ENV === 'development' ? { currentRole: user.role, requiredRoles } : undefined
        });
      }

      next();
    } catch (err) {
      console.error("CRITICAL: Auth Middleware Crash:", err.message, err.stack);
      res.status(500).json({ 
        message: "Authentication server error",
        debug: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
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