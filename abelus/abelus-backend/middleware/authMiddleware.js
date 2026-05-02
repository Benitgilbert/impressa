import prisma, { supabase } from "../prisma.js";

/**
 * Enhanced Authentication Middleware using Supabase Native Auth
 */
export const authMiddleware = (requiredRoles = []) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const startTime = Date.now();
    try {
      // 1. Verify token with Supabase (with a safety timeout)
      const authPromise = supabase.auth.getUser(token);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase Auth Timeout")), 8000)
      );

      const { data: { user: sbUser }, error: sbError } = await Promise.race([authPromise, timeoutPromise]);
      
      const authTime = Date.now() - startTime;
      if (authTime > 2000) {
        console.warn(`[AUTH] Slow Supabase Auth: ${authTime}ms`);
      }

      if (sbError || !sbUser) {
        console.warn("Supabase Auth Error:", sbError?.message || "No user found for token");
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // 2. Fetch user from our public table to get role and other metadata
      const dbStartTime = Date.now();
      let user = await prisma.user.findUnique({
        where: { id: sbUser.id }
      });
      const dbTime = Date.now() - dbStartTime;
      
      if (dbTime > 1000) {
        console.warn(`[AUTH] Slow DB Lookup: ${dbTime}ms for user ${sbUser.email}`);
      }

      // SELF-HEALING: If user exists in Auth but not in our public table, create them now.
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

      const totalTime = Date.now() - startTime;
      if (totalTime > 3000) {
        console.warn(`[AUTH] Total middleware time high: ${totalTime}ms`);
      }

      next();
    } catch (err) {
      const totalTime = Date.now() - startTime;
      console.error(`CRITICAL: Auth Middleware Crash (${totalTime}ms):`, err.message, err.stack);
      
      const statusCode = err.message === "Supabase Auth Timeout" ? 408 : 500;
      res.status(statusCode).json({ 
        message: err.message === "Supabase Auth Timeout" ? "Authentication timed out" : "Authentication server error",
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