CREATE SCHEMA "savesafe";
--> statement-breakpoint
CREATE TYPE "savesafe"."categories" AS ENUM('housing', 'utilities', 'food', 'transport', 'technology', 'entertainment', 'finance', 'education', 'healthcare', 'shopping', 'telecommunications', 'other');--> statement-breakpoint
CREATE TYPE "savesafe"."categorization_methods" AS ENUM('ai_batch', 'ai_batch_error', 'stored', 'pattern', 'fuzzy');--> statement-breakpoint
CREATE TABLE "savesafe"."app" (
	"version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savesafe"."categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "savesafe"."categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category" "savesafe"."categories" NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "savesafe"."transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "savesafe"."transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"merchant" varchar(255) NOT NULL,
	"transactionDate" date NOT NULL,
	"effectiveDate" date,
	"amount" integer NOT NULL,
	"balance" integer NOT NULL,
	"category" varchar(255) NOT NULL,
	"categoryId" integer,
	"confidence" integer NOT NULL,
	"categorizationMethod" "savesafe"."categorization_methods" NOT NULL,
	"manuallyCategorized" boolean DEFAULT false,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "transactions_merchant_unique" UNIQUE("merchant")
);
--> statement-breakpoint
ALTER TABLE "savesafe"."transactions" ADD CONSTRAINT "transactions_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "savesafe"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_category_idx" ON "savesafe"."categories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "transactions_merchant_idx" ON "savesafe"."transactions" USING btree ("merchant");--> statement-breakpoint
CREATE INDEX "transactions_transaction_date_idx" ON "savesafe"."transactions" USING btree ("transactionDate");--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "savesafe"."transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "savesafe"."transactions" USING btree ("categoryId");