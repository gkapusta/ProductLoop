import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@my-better-t-app/db";
import * as schema from "@my-better-t-app/db/schema/auth";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	baseURL: "https://localhost:12345/api/v1/auth",
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
});
