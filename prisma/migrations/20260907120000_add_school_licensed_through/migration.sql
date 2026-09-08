-- Annual license end date for a school. Null means a legacy school (still allowed to send).

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "licensed_through" TIMESTAMP(3);
