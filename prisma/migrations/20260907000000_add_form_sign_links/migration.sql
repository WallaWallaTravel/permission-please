-- Add capability tokens so a parent can sign from email without a login session.
-- Other tables already exist from prior db push; do not baseline the whole schema here.

CREATE TABLE IF NOT EXISTS "form_sign_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_sign_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "form_sign_links_token_key" ON "form_sign_links"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "form_sign_links_form_id_parent_id_key" ON "form_sign_links"("form_id", "parent_id");
CREATE INDEX IF NOT EXISTS "form_sign_links_parent_id_idx" ON "form_sign_links"("parent_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'form_sign_links_form_id_fkey'
  ) THEN
    ALTER TABLE "form_sign_links"
      ADD CONSTRAINT "form_sign_links_form_id_fkey"
      FOREIGN KEY ("form_id") REFERENCES "permission_forms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'form_sign_links_parent_id_fkey'
  ) THEN
    ALTER TABLE "form_sign_links"
      ADD CONSTRAINT "form_sign_links_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
