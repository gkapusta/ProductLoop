import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";

import { OpenAPIHandler } from "@orpc/openapi/node";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import { onError } from "@orpc/server";
import { appRouter } from "@my-better-t-app/api/routers/index";
import { createServer } from "node:http";
import { createContext } from "@my-better-t-app/api/context";

import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";

import { auth } from "@my-better-t-app/auth";

const baseCorsConfig = {
	origin: process.env.CORS_ORIGIN || "",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

const rpcHandler = new RPCHandler(appRouter, {
	plugins: [
		new CORSPlugin({
			origin: process.env.CORS_ORIGIN,
			credentials: true,
			allowHeaders: ["Content-Type", "Authorization"],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const fastify = Fastify({
	logger: true,
	serverFactory: (fastifyHandler) => {
		const server = createServer(async (req, res) => {
			const { matched } = await rpcHandler.handle(req, res, {
				context: await createContext(req.headers),
				prefix: "/rpc",
			});

			if (matched) {
				return;
			}

			const apiResult = await apiHandler.handle(req, res, {
				context: await createContext(req.headers),
				prefix: "/api-reference",
			});

			if (apiResult.matched) {
				return;
			}

			fastifyHandler(req, res);
		});

		return server;
	},
});

fastify.register(fastifyCors, baseCorsConfig);

fastify.route({
	method: ["GET", "POST"],
	url: "/api/auth/*",
	async handler(request, reply) {
		try {
			const url = new URL(request.url, `http://${request.headers.host}`);
			const headers = new Headers();
			Object.entries(request.headers).forEach(([key, value]) => {
				if (value) headers.append(key, value.toString());
			});
			const req = new Request(url.toString(), {
				method: request.method,
				headers,
				body: request.body ? JSON.stringify(request.body) : undefined,
			});
			const response = await auth.handler(req);
			reply.status(response.status);
			response.headers.forEach((value, key) => reply.header(key, value));
			reply.send(response.body ? await response.text() : null);
		} catch (error) {
			fastify.log.error({ err: error }, "Authentication Error:");
			reply.status(500).send({
				error: "Internal authentication error",
				code: "AUTH_FAILURE",
			});
		}
	},
});

interface AiRequestBody {
	id?: string;
	messages: UIMessage[];
}

fastify.post("/ai", async function (request) {
	const { messages } = request.body as AiRequestBody;
	const result = streamText({
		model: google("gemini-2.5-flash"),
		messages: convertToModelMessages(messages),
	});

	return result.toUIMessageStreamResponse();
});

fastify.get("/", async () => {
	return "OK";
});

fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	console.log("Server running on port 3000");
});
