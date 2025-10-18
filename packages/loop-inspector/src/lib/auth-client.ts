import { createAuthClient } from "better-auth/react";

// Get the server URL from the environment or use a default
// This should be configured by the consuming application
const getServerUrl = () => "https://localhost:12345";

export const authClient = createAuthClient({
  baseURL: `${getServerUrl()}/api/v1/auth`,
});
