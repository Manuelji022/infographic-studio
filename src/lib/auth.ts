import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../../db/index";
import * as schema from "../../db/schema";
import { isOwnerEmail } from "./auth-allowlist";

let authInstance: ReturnType<typeof betterAuth> | undefined;

export function getAuth() {
  if (authInstance) return authInstance;
  const instance = betterAuth({
    database: drizzleAdapter(createDb(), { provider: "pg", schema }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!isOwnerEmail(user.email, process.env.OWNER_EMAIL)) {
              throw new Error("Only the configured owner may create an account");
            }
          },
        },
      },
    },
    // Better Auth defaults: httpOnly=true, secure follows HTTPS (true in production), sameSite="lax".
  });
  authInstance = instance as unknown as ReturnType<typeof betterAuth>;
  return authInstance;
}
