import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // We'll use random UUIDs
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["ADMIN", "BENDAHARA"] }).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const buildings = sqliteTable("buildings", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  buildingId: text("building_id")
    .notNull()
    .references(() => buildings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const expenseCategories = sqliteTable("expense_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const cashTransactions = sqliteTable("cash_transactions", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .references(() => expenseCategories.id), // Can be null if it's an initial balance or income
  transactionDate: text("transaction_date").notNull(), // Format: YYYY-MM-DD
  description: text("description").notNull(),
  debit: real("debit").notNull().default(0),
  credit: real("credit").notNull().default(0),
  balanceBefore: real("balance_before").notNull().default(0),
  balanceAfter: real("balance_after").notNull().default(0),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});
