import type { IncomingHttpHeaders } from "node:http";
import { auth } from "@my-better-t-app/auth";

function fromNodeHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!key) {
      continue;
    }
    if (Array.isArray(value)) {
      out[key.toLowerCase()] = value.join(", ");
    } else if (typeof value === "string") {
      out[key.toLowerCase()] = value;
    } else if (value === undefined) {
      // skip undefined headers
    } else {
      out[key.toLowerCase()] = String(value);
    }
  }
  return out;
}

export async function createContext(req: IncomingHttpHeaders) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req),
  });
  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
