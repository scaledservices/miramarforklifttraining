CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_user_id" integer,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_number" text NOT NULL,
	"user_id" integer NOT NULL,
	"service_area_id" integer NOT NULL,
	"product_slug" text NOT NULL,
	"session_date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"participant_count" integer NOT NULL,
	"customer_address" text NOT NULL,
	"customer_city" text NOT NULL,
	"customer_state" text NOT NULL,
	"customer_zip" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text NOT NULL,
	"special_requests" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"order_id" integer,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number"),
	CONSTRAINT "bookings_participant_count_check" CHECK ("bookings"."participant_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "cert_card_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"certification_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"shipping_method" text NOT NULL,
	"shipping_cost" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"tracking_number" text,
	"carrier" text,
	"payment_id" integer,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"certificate_number" text NOT NULL,
	"verification_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"pdf_url" text,
	"pdf_generated_at" timestamp,
	"template_version" text,
	"reissued_at" timestamp,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certifications_enrollment_id_unique" UNIQUE("enrollment_id"),
	CONSTRAINT "certifications_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"training_type" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"estimated_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_steps_step_order_check" CHECK ("course_steps"."step_order" >= 1)
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"category" text,
	"language" text DEFAULT 'en' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"payload" jsonb,
	"html" text,
	"provider_status" text,
	"provider_message_id" text,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"course_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"assigned_by_user_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"step_id" integer NOT NULL,
	"attempt_number" integer NOT NULL,
	"score" numeric(5, 2),
	"passed" boolean,
	"answers" jsonb,
	"duration_seconds" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "exam_attempts_attempt_number_check" CHECK ("exam_attempts"."attempt_number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"step_id" integer NOT NULL,
	"question" text NOT NULL,
	"type" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answers" jsonb NOT NULL,
	"explanation" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"invite_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"invited_by_user_id" integer,
	"pending_enrollment_id" integer,
	"last_reminder_sent_at" timestamp,
	CONSTRAINT "group_members_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"admin_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_app_status_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"changed_by_user_id" integer NOT NULL,
	"previous_status" text NOT NULL,
	"new_status" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"certification_id" integer,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"years_experience" integer NOT NULL,
	"equipment_types" text[] DEFAULT '{}' NOT NULL,
	"industries" text[] DEFAULT '{}' NOT NULL,
	"has_teaching_experience" boolean DEFAULT false NOT NULL,
	"training_experience" text,
	"current_certifications" text,
	"availability" text NOT NULL,
	"availability_notes" text,
	"willing_to_travel" boolean DEFAULT false NOT NULL,
	"travel_radius" integer,
	"why_instructor" text NOT NULL,
	"additional_notes" text,
	"linkedin_url" text,
	"website_url" text,
	"resume_url" text,
	"eligibility_verified_at" timestamp,
	"status" text DEFAULT 'applied' NOT NULL,
	"admin_notes" text,
	"compliance_rating" integer,
	"professionalism_rating" integer,
	"field_experience_rating" integer,
	"interview_recommended" boolean DEFAULT false NOT NULL,
	"follow_up_needed" boolean DEFAULT false NOT NULL,
	"review_checklist" jsonb,
	"decision_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_assignment_status_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"changed_by_user_id" integer NOT NULL,
	"previous_status" text NOT NULL,
	"new_status" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"instructor_id" integer NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"assigned_by_user_id" integer NOT NULL,
	"notes" text,
	"assigned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"user_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"travel_radius" integer,
	"equipment_classes" text[] DEFAULT '{}' NOT NULL,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"internal_notes" text,
	"onboarding_checklist" jsonb DEFAULT '{"identityVerified":false,"experienceReviewed":false,"interviewCompleted":false,"insuranceCollected":false,"agreementSigned":false,"taxInfoCollected":false,"backgroundCheckComplete":false,"readyForAssignment":false}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onsite_training_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" text,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"training_address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"trainee_count" integer NOT NULL,
	"preferred_date_1" text,
	"preferred_date_2" text,
	"preferred_date_3" text,
	"equipment_types" text[] DEFAULT '{}' NOT NULL,
	"training_type" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"invoice_number" text,
	"user_id" integer NOT NULL,
	"group_id" integer,
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"refund_policy_accepted" boolean DEFAULT false NOT NULL,
	"abandoned_email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "orders_total_check" CHECK ("orders"."total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"provider" text NOT NULL,
	"provider_transaction_id" text,
	"status" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"platform_earnings" numeric(10, 2),
	"partner_earnings" numeric(10, 2),
	"raw_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_check" CHECK ("payments"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by_user_id" integer,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "seo_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"template_key" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"title" text NOT NULL,
	"meta_description" text NOT NULL,
	"canonical_slug" text,
	"hero_h1" text NOT NULL,
	"hero_subtitle" text,
	"intro_paragraph" text,
	"body_sections" jsonb,
	"faq_json" jsonb,
	"primary_keyword" text,
	"secondary_keywords" jsonb,
	"city" text,
	"state" text,
	"industry" text,
	"equipment_type" text,
	"internal_links" jsonb,
	"og_image_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"state" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"zip_prefixes" text[] NOT NULL,
	"cities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"availability_rules" jsonb DEFAULT '{"daysOfWeek":[1,3,5],"timeSlots":[{"startTime":"09:00","endTime":"12:00"},{"startTime":"13:00","endTime":"16:00"}],"maxParticipants":10,"leadTimeDays":2,"windowDays":90}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "step_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"step_id" integer NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"score" numeric(5, 2),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "support_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_id" text NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"escalated" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"redacted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '30 days' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'individual' NOT NULL,
	"auth_provider" text,
	"auth_provider_id" text,
	"password_reset_token_hash" text,
	"password_reset_token_expires_at" timestamp,
	"password_reset_token_used_at" timestamp,
	"notification_preferences" jsonb,
	"locale" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp,
	"status" text DEFAULT 'received' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"last_attempted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_area_id_service_areas_id_fk" FOREIGN KEY ("service_area_id") REFERENCES "public"."service_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cert_card_orders" ADD CONSTRAINT "cert_card_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cert_card_orders" ADD CONSTRAINT "cert_card_orders_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_steps" ADD CONSTRAINT "course_steps_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_step_id_course_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."course_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_step_id_course_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."course_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_app_status_changes" ADD CONSTRAINT "instructor_app_status_changes_application_id_instructor_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."instructor_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_app_status_changes" ADD CONSTRAINT "instructor_app_status_changes_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_assignment_status_changes" ADD CONSTRAINT "instructor_assignment_status_changes_assignment_id_instructor_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."instructor_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_assignment_status_changes" ADD CONSTRAINT "instructor_assignment_status_changes_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_request_id_onsite_training_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."onsite_training_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_assignments" ADD CONSTRAINT "instructor_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_application_id_instructor_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."instructor_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_progress" ADD CONSTRAINT "step_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_progress" ADD CONSTRAINT "step_progress_step_id_course_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."course_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_area_date_idx" ON "bookings" USING btree ("service_area_id","session_date");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "course_steps_course_order_idx" ON "course_steps" USING btree ("course_id","step_order");--> statement-breakpoint
CREATE INDEX "enrollments_user_id_idx" ON "enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enrollments_course_id_idx" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_user_course_active_idx" ON "enrollments" USING btree ("user_id","course_id") WHERE "enrollments"."status" != 'revoked' AND "enrollments"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "exam_attempts_enrollment_id_idx" ON "exam_attempts" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "group_members_group_id_idx" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_group_email_idx" ON "group_members" USING btree ("group_id","email");--> statement-breakpoint
CREATE INDEX "instructor_app_sc_app_id_idx" ON "instructor_app_status_changes" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "instructor_apps_status_idx" ON "instructor_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "instructor_apps_user_id_idx" ON "instructor_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instructor_apps_created_at_idx" ON "instructor_applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "assignment_sc_assignment_id_idx" ON "instructor_assignment_status_changes" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "instructor_assignments_request_id_idx" ON "instructor_assignments" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "instructor_assignments_instructor_id_idx" ON "instructor_assignments" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "instructor_assignments_status_idx" ON "instructor_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "instructors_user_id_idx" ON "instructors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instructors_active_idx" ON "instructors" USING btree ("active");--> statement-breakpoint
CREATE INDEX "onsite_requests_status_idx" ON "onsite_training_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "onsite_requests_created_at_idx" ON "onsite_training_requests" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_course_idx" ON "order_items" USING btree ("order_id","course_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_pages_slug_locale_idx" ON "seo_pages" USING btree ("slug","locale");--> statement-breakpoint
CREATE INDEX "seo_pages_template_idx" ON "seo_pages" USING btree ("template_key");--> statement-breakpoint
CREATE INDEX "seo_pages_published_idx" ON "seo_pages" USING btree ("published");--> statement-breakpoint
CREATE UNIQUE INDEX "step_progress_enrollment_step_idx" ON "step_progress" USING btree ("enrollment_id","step_id");--> statement-breakpoint
CREATE INDEX "support_conversations_user_id_idx" ON "support_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_conversations_session_id_idx" ON "support_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "support_messages_conversation_id_idx" ON "support_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_provider_idx" ON "users" USING btree ("auth_provider","auth_provider_id") WHERE "users"."auth_provider" IS NOT NULL AND "users"."auth_provider_id" IS NOT NULL;