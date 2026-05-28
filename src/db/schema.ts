import {
  sqliteTable,
  text,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["ADMIN", "BENDAHARA"] }).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const buildings = sqliteTable("buildings", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  buildingId: text("building_id")
    .notNull()
    .references(() => buildings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const expenseCategories = sqliteTable("expense_categories", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const cashTransactions = sqliteTable("cash_transactions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .references(() => expenseCategories.id),
  transactionDate: text("transaction_date").notNull(), // Format: YYYY-MM-DD
  description: text("description").notNull(),
  debit: real("debit").notNull().default(0),
  credit: real("credit").notNull().default(0),
  balanceBefore: real("balance_before").notNull().default(0),
  balanceAfter: real("balance_after").notNull().default(0),
  notes: text("notes"),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).notNull().default("APPROVED"),
  approvedBy: text("approved_by").references(() => users.id),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // e.g., "CREATE_TRANSACTION", "APPROVE_TRANSACTION", "DELETE_BUILDING"
  entity: text("entity").notNull(), // e.g., "CASH_TRANSACTION", "BUILDING"
  entityId: text("entity_id").notNull(),
  details: text("details"), // JSON string
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});
