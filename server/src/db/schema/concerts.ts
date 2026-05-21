import { sql } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { users } from './users';

export const concerts = t.pgTable(
  'concerts',
  {
    id: t.text('id').primaryKey(),
    name: t.text('name').notNull(),
    description: t.text('description'),
    totalSeat: t.integer('total_seat').notNull(),
    createdBy: t.text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: t.timestamp('created_at').notNull().defaultNow(),
    deletedAt: t.timestamp('deleted_at'),
  },
  (table) => ({
    totalSeatPositive: t.check('concerts_total_seat_positive', sql`${table.totalSeat} > 0`),
  }),
);

export type Concert = typeof concerts.$inferSelect;
export type NewConcert = typeof concerts.$inferInsert;
