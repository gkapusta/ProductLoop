import { createAuthClient } from "better-auth/react";
import type { auth } from "@my-better-t-app/auth";

export const authClient = createAuthClient<typeof auth>({
	baseURL: import.meta.env.VITE_SERVER_URL + "/api/v1/auth",
});
