ALTER TABLE "documents" ALTER COLUMN "file_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."file_type";--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('pdf', 'docx');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "file_type" SET DATA TYPE "public"."file_type" USING "file_type"::"public"."file_type";--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "file_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "source_metadata";