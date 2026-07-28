import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Plan } from "./users";

export const subscriptionsTable = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  plan: text("plan").$type<Plan>().notNull().default("free"),
  modelLimit: integer("model_limit").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
