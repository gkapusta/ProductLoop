import {
	pgTable,
	text,
	timestamp,
	integer,
	uuid,
	jsonb,
	pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Request type enum
export const requestTypeEnum = pgEnum("request_type", [
	"feature",
	"bug",
	"improvement",
	"idea",
]);

// Request status enum
export const requestStatusEnum = pgEnum("request_status", [
	"open",
	"in_progress",
	"completed",
	"rejected",
	"archived",
]);

// Request priority enum
export const requestPriorityEnum = pgEnum("request_priority", [
	"low",
	"medium",
	"high",
	"critical",
]);

export const productRequest = pgTable("product_request", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Basic information
	title: text("title").notNull(),
	description: text("description").notNull(),
	type: requestTypeEnum("type").notNull(),
	status: requestStatusEnum("status").notNull().default("open"),
	priority: requestPriorityEnum("priority").default("medium"),

	// UI Element information (from loop-inspector)
	elementId: text("element_id"), // data-dev-id
	elementName: text("element_name"), // data-dev-name
	elementPath: text("element_path"), // data-dev-path (source file path)
	elementLine: text("element_line"), // data-dev-line
	elementFile: text("element_file"), // data-dev-file
	elementComponent: text("element_component"), // data-dev-component
	elementMetadata: jsonb("element_metadata"), // data-dev-metadata (JSON)

	// Position and size information
	positionX: integer("position_x"), // x coordinate on screen
	positionY: integer("position_y"), // y coordinate on screen
	width: integer("width"), // element width
	height: integer("height"), // element height

	// Screenshot/context (optional)
	screenshotUrl: text("screenshot_url"),
	pageUrl: text("page_url"), // URL where request was created

	// User tracking
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	assignedTo: text("assigned_to").references(() => user.id, {
		onDelete: "set null",
	}),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Comments on product requests
export const productRequestComment = pgTable("product_request_comment", {
	id: uuid("id").primaryKey().defaultRandom(),
	requestId: uuid("request_id")
		.notNull()
		.references(() => productRequest.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Votes/reactions on product requests
export const productRequestVote = pgTable("product_request_vote", {
	id: uuid("id").primaryKey().defaultRandom(),
	requestId: uuid("request_id")
		.notNull()
		.references(() => productRequest.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
