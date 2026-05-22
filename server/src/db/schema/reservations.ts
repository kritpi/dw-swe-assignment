import { sql } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { concerts } from './concerts';
import { users } from './users';

export const reserveStatus = t.pgEnum('reserve_status', ['RESERVED', 'CANCELED']);
export const reservationAction = t.pgEnum('reservation_action', ['RESERVE', 'CANCEL']);

export const reservations = t.pgTable(
  'reservations',
  {
    id: t.text('id').primaryKey(),
    userId: t
      .text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    concertId: t
      .text('concert_id')
      .notNull()
      .references(() => concerts.id, { onDelete: 'cascade' }),
    status: reserveStatus('status').notNull().default('RESERVED'),
    createdAt: t.timestamp('created_at').notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    activeUserConcert: t
      .uniqueIndex('reservations_active_user_concert_unique')
      .on(table.userId, table.concertId)
      .where(sql`${table.status} = 'RESERVED'`),
  }),
);

export const reservationHistory = t.pgTable('reservation_history', {
  id: t.text('id').primaryKey(),
  userId: t
    .text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  concertId: t
    .text('concert_id')
    .notNull()
    .references(() => concerts.id, { onDelete: 'cascade' }),
  action: reservationAction('action').notNull(),
  actionAt: t.timestamp('action_at').notNull().defaultNow(),
});

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type ReservationHistory = typeof reservationHistory.$inferSelect;
export type NewReservationHistory = typeof reservationHistory.$inferInsert;
