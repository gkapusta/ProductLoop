import { protectedProcedure } from "../index";
import { db } from "@my-better-t-app/db";
import {
	productRequest,
	productRequestComment,
	productRequestVote,
} from "@my-better-t-app/db/schema/request";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const elementInfoSchema = z.object({
	elementId: z.string().optional(),
	elementName: z.string().optional(),
	elementPath: z.string().optional(),
	elementLine: z.string().optional(),
	elementFile: z.string().optional(),
	elementComponent: z.string().optional(),
	elementMetadata: z.record(z.unknown()).optional(),
	positionX: z.number().optional(),
	positionY: z.number().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
});

const createProductRequestSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().min(1, "Description is required"),
	type: z.enum(["feature", "bug", "improvement", "idea"]),
	priority: z.enum(["low", "medium", "high", "critical"]).optional(),
	elementInfo: elementInfoSchema.optional(),
	screenshotUrl: z.string().url().optional(),
	pageUrl: z.string().url().optional(),
});

const listProductRequestsSchema = z.object({
	type: z.enum(["feature", "bug", "improvement", "idea"]).optional(),
	status: z
		.enum(["open", "in_progress", "completed", "rejected", "archived"])
		.optional(),
	priority: z.enum(["low", "medium", "high", "critical"]).optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

const getProductRequestSchema = z.object({
	id: z.string().uuid(),
});

const updateProductRequestSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(200).optional(),
	description: z.string().min(1).optional(),
	status: z
		.enum(["open", "in_progress", "completed", "rejected", "archived"])
		.optional(),
	priority: z.enum(["low", "medium", "high", "critical"]).optional(),
	assignedTo: z.string().optional(),
});

export const productRequestRouter = {
	// Create a new product request
	create: protectedProcedure
		.input(createProductRequestSchema)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			const [newRequest] = await db
				.insert(productRequest)
				.values({
					title: input.title,
					description: input.description,
					type: input.type,
					priority: input.priority ?? "medium",
					createdBy: userId,
					elementId: input.elementInfo?.elementId,
					elementName: input.elementInfo?.elementName,
					elementPath: input.elementInfo?.elementPath,
					elementLine: input.elementInfo?.elementLine,
					elementFile: input.elementInfo?.elementFile,
					elementComponent: input.elementInfo?.elementComponent,
					elementMetadata: input.elementInfo?.elementMetadata,
					positionX: input.elementInfo?.positionX,
					positionY: input.elementInfo?.positionY,
					width: input.elementInfo?.width,
					height: input.elementInfo?.height,
					screenshotUrl: input.screenshotUrl,
					pageUrl: input.pageUrl,
				})
				.returning();

			return newRequest;
		}),

	// List product requests with filters
	list: protectedProcedure
		.input(listProductRequestsSchema)
		.handler(async ({ input }) => {
			let query = db.select().from(productRequest);

			// Apply filters
			if (input.type || input.status || input.priority) {
				const conditions = [];
				if (input.type) {
					conditions.push(eq(productRequest.type, input.type));
				}
				if (input.status) {
					conditions.push(eq(productRequest.status, input.status));
				}
				if (input.priority) {
					conditions.push(eq(productRequest.priority, input.priority));
				}

				if (conditions.length > 0) {
					query = query.where(and(...conditions)) as typeof query;
				}
			}

			const requests = await query
				.orderBy(desc(productRequest.createdAt))
				.limit(input.limit)
				.offset(input.offset);

			return {
				requests,
				pagination: {
					limit: input.limit,
					offset: input.offset,
					hasMore: requests.length === input.limit,
				},
			};
		}),

	// Get a single product request by ID
	get: protectedProcedure
		.input(getProductRequestSchema)
		.handler(async ({ input }) => {
			const [request] = await db
				.select()
				.from(productRequest)
				.where(eq(productRequest.id, input.id))
				.limit(1);

			if (!request) {
				throw new Error("Product request not found");
			}

			// Get comments count
			const comments = await db
				.select()
				.from(productRequestComment)
				.where(eq(productRequestComment.requestId, input.id));

			// Get votes count
			const votes = await db
				.select()
				.from(productRequestVote)
				.where(eq(productRequestVote.requestId, input.id));

			return {
				...request,
				commentsCount: comments.length,
				votesCount: votes.length,
			};
		}),

	// Update a product request
	update: protectedProcedure
		.input(updateProductRequestSchema)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			// Check if request exists
			const [existingRequest] = await db
				.select()
				.from(productRequest)
				.where(eq(productRequest.id, input.id))
				.limit(1);

			if (!existingRequest) {
				throw new Error("Product request not found");
			}

			// Only allow creator or assigned user to update
			if (
				existingRequest.createdBy !== userId &&
				existingRequest.assignedTo !== userId
			) {
				throw new Error("Unauthorized to update this request");
			}

			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (input.title) updateData.title = input.title;
			if (input.description) updateData.description = input.description;
			if (input.status) updateData.status = input.status;
			if (input.priority) updateData.priority = input.priority;
			if (input.assignedTo !== undefined)
				updateData.assignedTo = input.assignedTo;

			const [updatedRequest] = await db
				.update(productRequest)
				.set(updateData)
				.where(eq(productRequest.id, input.id))
				.returning();

			return updatedRequest;
		}),

	// Delete a product request
	delete: protectedProcedure
		.input(getProductRequestSchema)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			// Check if request exists and user is creator
			const [existingRequest] = await db
				.select()
				.from(productRequest)
				.where(eq(productRequest.id, input.id))
				.limit(1);

			if (!existingRequest) {
				throw new Error("Product request not found");
			}

			if (existingRequest.createdBy !== userId) {
				throw new Error("Only the creator can delete this request");
			}

			await db.delete(productRequest).where(eq(productRequest.id, input.id));

			return { success: true };
		}),

	// Get user's own requests
	myRequests: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;

		const requests = await db
			.select()
			.from(productRequest)
			.where(eq(productRequest.createdBy, userId))
			.orderBy(desc(productRequest.createdAt));

		return requests;
	}),

	// Get requests assigned to user
	assignedToMe: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;

		const requests = await db
			.select()
			.from(productRequest)
			.where(eq(productRequest.assignedTo, userId))
			.orderBy(desc(productRequest.createdAt));

		return requests;
	}),
};
