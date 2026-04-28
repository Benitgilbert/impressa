import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../prisma.js';
import dotenv from 'dotenv';

dotenv.config();

// Only initialize Google Strategy if credentials are provided in .env
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists
                    let user = await prisma.user.findUnique({
                        where: { googleId: profile.id }
                    });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if email exists (upgrade account)
                    const email = profile.emails[0].value;
                    user = await prisma.user.findUnique({
                        where: { email }
                    });

                    if (user) {
                        user = await prisma.user.update({
                            where: { email },
                            data: { googleId: profile.id }
                        });
                        return done(null, user);
                    }

                    // Create new user
                    user = await prisma.user.create({
                        data: {
                            googleId: profile.id,
                            name: profile.displayName,
                            email: email,
                            role: 'customer',
                        }
                    });

                    done(null, user);
                } catch (err) {
                    console.error("Google Auth Error:", err);
                    done(err, null);
                }
            }
        )
    );
} else {
    console.warn("⚠️  GOOGLE_CLIENT_ID not found in .env. Google Auth is disabled.");
}

export default passport;
