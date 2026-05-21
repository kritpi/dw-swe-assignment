import * as t from 'drizzle-orm/pg-core';

export const userRole = t.pgEnum('user_role', ['ADMIN', 'USER']);

export const users = t.pgTable('users', {
  id: t.text('id').primaryKey(),
  fullName: t.text('full_name').notNull(),
  email: t.text('email').notNull().unique(),
  password: t.text('password').notNull(),
  role: userRole('role').notNull().default('USER'),
  createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
