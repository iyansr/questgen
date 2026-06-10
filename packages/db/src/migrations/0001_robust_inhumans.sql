ALTER TYPE "public"."file_type" ADD VALUE 'web';--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "file_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "source_metadata" jsonb;