CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"website" text,
	"billing_street" text,
	"billing_city" text,
	"billing_state" text,
	"billing_zip" text,
	"industry" text,
	"employee_count" integer,
	"assigned_rep_id" integer,
	"lead_source" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"title" text,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rep_attribution" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"primary_rep_id" integer,
	"secondary_rep_id" integer,
	"lead_source" text DEFAULT 'unknown' NOT NULL,
	"referral_code" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ALTER COLUMN "status" SET DEFAULT 'new_lead';--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ADD COLUMN "company_id" integer;--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ADD COLUMN "contact_id" integer;--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ADD COLUMN "assigned_rep_id" integer;--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ADD COLUMN "lead_source" text DEFAULT 'unknown';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "company_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "assigned_rep_id" integer;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_assigned_rep_id_users_id_fk" FOREIGN KEY ("assigned_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_attribution" ADD CONSTRAINT "rep_attribution_primary_rep_id_users_id_fk" FOREIGN KEY ("primary_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_attribution" ADD CONSTRAINT "rep_attribution_secondary_rep_id_users_id_fk" FOREIGN KEY ("secondary_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_assigned_rep_idx" ON "companies" USING btree ("assigned_rep_id");--> statement-breakpoint
CREATE INDEX "contacts_company_id_idx" ON "contacts" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rep_attribution_entity_idx" ON "rep_attribution" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "rep_attribution_primary_rep_idx" ON "rep_attribution" USING btree ("primary_rep_id");--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ADD CONSTRAINT "onsite_training_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ADD CONSTRAINT "onsite_training_requests_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onsite_training_requests" ADD CONSTRAINT "onsite_training_requests_assigned_rep_id_users_id_fk" FOREIGN KEY ("assigned_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_rep_id_users_id_fk" FOREIGN KEY ("assigned_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "onsite_requests_company_id_idx" ON "onsite_training_requests" USING btree ("company_id");