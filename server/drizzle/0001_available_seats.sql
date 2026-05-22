ALTER TABLE "concerts" ADD COLUMN "available_seats" integer;
--> statement-breakpoint
UPDATE "concerts" c
SET "available_seats" = c."total_seat" - COALESCE(r."reserved_count", 0)
FROM (
  SELECT "concert_id", count(*)::int AS "reserved_count"
  FROM "reservations"
  WHERE "status" = 'RESERVED'
  GROUP BY "concert_id"
) r
WHERE c."id" = r."concert_id";
--> statement-breakpoint
UPDATE "concerts"
SET "available_seats" = "total_seat"
WHERE "available_seats" IS NULL;
--> statement-breakpoint
ALTER TABLE "concerts" ALTER COLUMN "available_seats" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_available_seats_non_negative" CHECK ("concerts"."available_seats" >= 0);
--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_available_seats_within_total" CHECK ("concerts"."available_seats" <= "concerts"."total_seat");
--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "user_concert";
--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_active_user_concert_unique"
ON "reservations" ("user_id", "concert_id")
WHERE "status" = 'RESERVED';
