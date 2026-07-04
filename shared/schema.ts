import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex, index, uuid, numeric, check, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, relations } from "drizzle-orm";
import { TRAINING_EVENT_STATUSES } from "./config/training-events";
import { QUOTE_STATUSES } from "./config/quote-states";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["individual", "certified_student", "instructor_applicant", "instructor", "group_admin", "admin", "super_admin"] }).notNull().default("individual"),
  authProvider: text("auth_provider"),
  authProviderId: text("auth_provider_id"),
  passwordResetTokenHash: text("password_reset_token_hash"),
  passwordResetTokenExpiresAt: timestamp("password_reset_token_expires_at"),
  passwordResetTokenUsedAt: timestamp("password_reset_token_used_at"),
  notificationPreferences: jsonb("notification_preferences"),
  locale: text("locale").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_auth_provider_idx").on(table.authProvider, table.authProviderId)
    .where(sql`${table.authProvider} IS NOT NULL AND ${table.authProviderId} IS NOT NULL`),
]);

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  inviteToken: uuid("invite_token").notNull().unique().defaultRandom(),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  invitedByUserId: integer("invited_by_user_id").references(() => users.id),
  pendingEnrollmentId: integer("pending_enrollment_id"),
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
}, (table) => [
  index("group_members_group_id_idx").on(table.groupId),
  uniqueIndex("group_members_group_email_idx").on(table.groupId, table.email),
]);

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category"),
  language: text("language").notNull().default("en"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const courseSteps = pgTable("course_steps", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  stepOrder: integer("step_order").notNull(),
  title: text("title").notNull(),
  type: text("type", { enum: ["content", "video", "exam", "lesson", "checkpoint", "download"] }).notNull(),
  config: jsonb("config").notNull().default({}),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  check("course_steps_step_order_check", sql`${table.stepOrder} >= 1`),
  uniqueIndex("course_steps_course_order_idx").on(table.courseId, table.stepOrder),
]);

export const examQuestions = pgTable("exam_questions", {
  id: serial("id").primaryKey(),
  stepId: integer("step_id").notNull().references(() => courseSteps.id),
  question: text("question").notNull(),
  type: text("type", { enum: ["mcq_single", "mcq_multi"] }).notNull(),
  options: jsonb("options").notNull(),
  correctAnswers: jsonb("correct_answers").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  invoiceNumber: text("invoice_number").unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "paid", "refunded"] }).notNull().default("pending"),
  refundPolicyAccepted: boolean("refund_policy_accepted").notNull().default(false),
  abandonedEmailSent: boolean("abandoned_email_sent").notNull().default(false),
  companyId: integer("company_id").references(() => companies.id),
  assignedRepId: integer("assigned_rep_id").references(() => users.id),
  trainingEventId: integer("training_event_id").references(() => trainingEvents.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("orders_user_id_idx").on(table.userId),
  check("orders_total_check", sql`${table.total} >= 0`),
]);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
}, (table) => [
  check("order_items_quantity_check", sql`${table.quantity} > 0`),
  uniqueIndex("order_items_order_course_idx").on(table.orderId, table.courseId),
]);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  provider: text("provider").notNull(),
  providerTransactionId: text("provider_transaction_id"),
  status: text("status").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  platformEarnings: numeric("platform_earnings", { precision: 10, scale: 2 }),
  partnerEarnings: numeric("partner_earnings", { precision: 10, scale: 2 }),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  check("payments_amount_check", sql`${table.amount} >= 0`),
]);

export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull().unique(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at"),
  status: text("status", { enum: ["received", "processed", "failed"] }).notNull().default("received"),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  lastAttemptedAt: timestamp("last_attempted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  status: text("status", { enum: ["active", "completed", "revoked"] }).notNull().default("active"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  assignedByUserId: integer("assigned_by_user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("enrollments_user_id_idx").on(table.userId),
  index("enrollments_course_id_idx").on(table.courseId),
  uniqueIndex("enrollments_user_course_active_idx").on(table.userId, table.courseId)
    .where(sql`${table.status} != 'revoked' AND ${table.userId} IS NOT NULL`),
]);

export const stepProgress = pgTable("step_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  stepId: integer("step_id").notNull().references(() => courseSteps.id),
  status: text("status", { enum: ["not_started", "in_progress", "completed"] }).notNull().default("not_started"),
  score: numeric("score", { precision: 5, scale: 2 }),
  completedAt: timestamp("completed_at"),
}, (table) => [
  uniqueIndex("step_progress_enrollment_step_idx").on(table.enrollmentId, table.stepId),
]);

export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  stepId: integer("step_id").notNull().references(() => courseSteps.id),
  attemptNumber: integer("attempt_number").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }),
  passed: boolean("passed"),
  answers: jsonb("answers"),
  durationSeconds: integer("duration_seconds"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("exam_attempts_enrollment_id_idx").on(table.enrollmentId),
  check("exam_attempts_attempt_number_check", sql`${table.attemptNumber} >= 1`),
]);

export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id).unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  certificateNumber: text("certificate_number").notNull().unique(),
  verificationToken: uuid("verification_token").notNull().defaultRandom(),
  status: text("status", { enum: ["issued", "revoked", "reissued"] }).notNull().default("issued"),
  pdfUrl: text("pdf_url"),
  pdfGeneratedAt: timestamp("pdf_generated_at"),
  templateVersion: text("template_version"),
  reissuedAt: timestamp("reissued_at"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  companyId: integer("company_id").references(() => companies.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const certCardOrders = pgTable("cert_card_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  certificationId: integer("certification_id").notNull().references(() => certifications.id),
  quantity: integer("quantity").notNull().default(1),
  shippingAddress: jsonb("shipping_address").notNull(),
  shippingMethod: text("shipping_method", { enum: ["standard", "expedited"] }).notNull(),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending_payment", "paid", "processing", "shipped", "delivered", "canceled", "refunded"] }).notNull().default("pending_payment"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  paymentId: integer("payment_id"),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  trainingType: text("training_type"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("audit_logs_entity_idx").on(table.entity, table.entityId, table.createdAt),
  index("audit_logs_actor_idx").on(table.actorUserId, table.createdAt),
]);

export const emailOutbox = pgTable("email_outbox", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  payload: jsonb("payload"),
  html: text("html"),
  providerStatus: text("provider_status"),
  providerMessageId: text("provider_message_id"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true, inviteToken: true, invitedAt: true, acceptedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseStepSchema = createInsertSchema(courseSteps).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, orderNumber: true, invoiceNumber: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({ id: true, processedAt: true, retryCount: true, lastError: true, lastAttemptedAt: true, createdAt: true, updatedAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true, completedAt: true, updatedAt: true });
export const insertStepProgressSchema = createInsertSchema(stepProgress).omit({ id: true });
export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({ id: true, startedAt: true, completedAt: true });
export const insertCertificationSchema = createInsertSchema(certifications).omit({ id: true, certificateNumber: true, verificationToken: true, pdfUrl: true, pdfGeneratedAt: true, reissuedAt: true, issuedAt: true, updatedAt: true });
export const insertCertCardOrderSchema = createInsertSchema(certCardOrders).omit({ id: true, trackingNumber: true, carrier: true, paymentId: true, paidAt: true, refundedAt: true, createdAt: true, updatedAt: true });
export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertEmailOutboxSchema = createInsertSchema(emailOutbox).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCourseStep = z.infer<typeof insertCourseStepSchema>;
export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertStepProgress = z.infer<typeof insertStepProgressSchema>;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type InsertCertCardOrder = z.infer<typeof insertCertCardOrderSchema>;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseStep = typeof courseSteps.$inferSelect;
export type ExamQuestion = typeof examQuestions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type StepProgress = typeof stepProgress.$inferSelect;
export type ExamAttempt = typeof examAttempts.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type CertCardOrder = typeof certCardOrders.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type EmailOutboxEntry = typeof emailOutbox.$inferSelect;

export const seoPages = pgTable("seo_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  locale: text("locale").notNull().default("en"),
  templateKey: text("template_key").notNull(),
  published: boolean("published").notNull().default(false),
  title: text("title").notNull(),
  metaDescription: text("meta_description").notNull(),
  canonicalSlug: text("canonical_slug"),
  heroH1: text("hero_h1").notNull(),
  heroSubtitle: text("hero_subtitle"),
  introParagraph: text("intro_paragraph"),
  bodySections: jsonb("body_sections"),
  faqJson: jsonb("faq_json"),
  primaryKeyword: text("primary_keyword"),
  secondaryKeywords: jsonb("secondary_keywords"),
  city: text("city"),
  state: text("state"),
  industry: text("industry"),
  equipmentType: text("equipment_type"),
  internalLinks: jsonb("internal_links"),
  ogImagePath: text("og_image_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("seo_pages_slug_locale_idx").on(table.slug, table.locale),
  index("seo_pages_template_idx").on(table.templateKey),
  index("seo_pages_published_idx").on(table.published),
]);

export const insertSeoPageSchema = createInsertSchema(seoPages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeoPage = z.infer<typeof insertSeoPageSchema>;
export type SeoPage = typeof seoPages.$inferSelect;

export const serviceAreas = pgTable("service_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  state: text("state").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  zipPrefixes: text("zip_prefixes").array().notNull(),
  cities: jsonb("cities").notNull().default([]),
  availabilityRules: jsonb("availability_rules").notNull().default({
    daysOfWeek: [1, 3, 5],
    timeSlots: [
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "13:00", endTime: "16:00" },
    ],
    maxParticipants: 10,
    leadTimeDays: 2,
    windowDays: 90,
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingNumber: text("booking_number").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  serviceAreaId: integer("service_area_id").notNull().references(() => serviceAreas.id),
  productSlug: text("product_slug").notNull(),
  sessionDate: date("session_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  participantCount: integer("participant_count").notNull(),
  customerAddress: text("customer_address").notNull(),
  customerCity: text("customer_city").notNull(),
  customerState: text("customer_state").notNull(),
  customerZip: text("customer_zip").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  specialRequests: text("special_requests"),
  status: text("status", { enum: ["pending", "confirmed", "cancelled", "completed"] }).notNull().default("pending"),
  orderId: integer("order_id").references(() => orders.id),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("bookings_user_id_idx").on(table.userId),
  index("bookings_area_date_idx").on(table.serviceAreaId, table.sessionDate),
  index("bookings_status_idx").on(table.status),
  check("bookings_participant_count_check", sql`${table.participantCount} > 0`),
]);

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, bookingNumber: true, createdAt: true, updatedAt: true });

export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type ServiceArea = typeof serviceAreas.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

export interface AvailabilityRules {
  daysOfWeek: number[];
  timeSlots: { startTime: string; endTime: string }[];
  maxParticipants: number;
  leadTimeDays: number;
  windowDays: number;
  blackoutDates?: string[];
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  bookedParticipants: number;
  available: boolean;
}

export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedByUserId: integer("updated_by_user_id").references(() => users.id),
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({ id: true, updatedAt: true });
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettings.$inferSelect;

export const supportConversations = pgTable("support_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  messageCount: integer("message_count").notNull().default(0),
  escalated: boolean("escalated").notNull().default(false),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("support_conversations_user_id_idx").on(table.userId),
  index("support_conversations_session_id_idx").on(table.sessionId),
]);

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => supportConversations.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  redacted: boolean("redacted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull().default(sql`NOW() + INTERVAL '30 days'`),
}, (table) => [
  index("support_messages_conversation_id_idx").on(table.conversationId),
]);

export const insertSupportConversationSchema = createInsertSchema(supportConversations).omit({ id: true, createdAt: true, lastMessageAt: true });
export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({ id: true, createdAt: true, expiresAt: true });

export type InsertSupportConversation = z.infer<typeof insertSupportConversationSchema>;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportConversation = typeof supportConversations.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  billingStreet: text("billing_street"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  industry: text("industry"),
  employeeCount: integer("employee_count"),
  assignedRepId: integer("assigned_rep_id").references(() => users.id),
  leadSource: text("lead_source"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("companies_assigned_rep_idx").on(table.assignedRepId),
]);

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  title: text("title"),
  role: text("role", { enum: ["decision_maker", "training_manager", "employee", "other"] }),
  isPrimary: boolean("is_primary").notNull().default(false),
  notes: text("notes"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("contacts_company_id_idx").on(table.companyId),
  index("contacts_user_id_idx").on(table.userId),
]);

export const repAttribution = pgTable("rep_attribution", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type", { enum: ["order", "onsite_request"] }).notNull(),
  entityId: integer("entity_id").notNull(),
  primaryRepId: integer("primary_rep_id").references(() => users.id),
  secondaryRepId: integer("secondary_rep_id").references(() => users.id),
  leadSource: text("lead_source", { enum: ["organic", "referral", "direct", "paid", "rep_sourced", "unknown"] }).notNull().default("unknown"),
  referralCode: text("referral_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("rep_attribution_entity_idx").on(table.entityType, table.entityId),
  index("rep_attribution_primary_rep_idx").on(table.primaryRepId),
]);

export const onsiteTrainingRequests = pgTable("onsite_training_requests", {
  id: serial("id").primaryKey(),
  companyName: text("company_name"),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  trainingAddress: text("training_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  traineeCount: integer("trainee_count").notNull(),
  preferredDate1: text("preferred_date_1"),
  preferredDate2: text("preferred_date_2"),
  preferredDate3: text("preferred_date_3"),
  equipmentTypes: text("equipment_types").array().notNull().default([]),
  trainingType: text("training_type").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["new_lead", "contacted", "quoted", "quote_accepted", "quote_declined", "scheduled", "confirmed", "completed", "invoiced", "unresponsive", "cancelled"] }).notNull().default("new_lead"),
  adminNotes: text("admin_notes"),
  companyId: integer("company_id").references(() => companies.id),
  contactId: integer("contact_id").references(() => contacts.id),
  assignedRepId: integer("assigned_rep_id").references(() => users.id),
  leadSource: text("lead_source").default("unknown"),
  customerClassification: text("customer_classification", { enum: ["new", "existing", "unverified"] }).notNull().default("unverified"),
  requestedLocationSlug: text("requested_location_slug"),
  requestedLocationType: text("requested_location_type"),
  nextActionType: text("next_action_type", { enum: ["call_back", "send_quote", "follow_up", "schedule_training", "send_info", "other"] }),
  nextActionDate: timestamp("next_action_date"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("onsite_requests_status_idx").on(table.status),
  index("onsite_requests_created_at_idx").on(table.createdAt),
  index("onsite_requests_company_id_idx").on(table.companyId),
  index("onsite_requests_assigned_rep_idx").on(table.assignedRepId),
  index("onsite_requests_next_action_date_idx").on(table.nextActionDate),
]);

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export const insertRepAttributionSchema = createInsertSchema(repAttribution).omit({ id: true, createdAt: true });
export type InsertRepAttribution = z.infer<typeof insertRepAttributionSchema>;
export type RepAttribution = typeof repAttribution.$inferSelect;

export const insertOnsiteTrainingRequestSchema = createInsertSchema(onsiteTrainingRequests).omit({ id: true, status: true, adminNotes: true, nextActionType: true, nextActionDate: true, lastActivityAt: true, createdAt: true, updatedAt: true });
export type InsertOnsiteTrainingRequest = z.infer<typeof insertOnsiteTrainingRequestSchema>;
export type OnsiteTrainingRequest = typeof onsiteTrainingRequests.$inferSelect;

export const LEAD_ACTIVITY_TYPES = [
  "note_added", "call_logged", "email_logged", "status_changed",
  "rep_assigned", "follow_up_scheduled", "quote_requested",
  "company_linked", "contact_linked",
  "training_event_created", "training_event_status_changed", "training_event_updated",
  "quote_created", "quote_sent", "quote_approved", "quote_declined", "quote_converted"
] as const;
export type LeadActivityType = typeof LEAD_ACTIVITY_TYPES[number];

export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => onsiteTrainingRequests.id),
  companyId: integer("company_id").references(() => companies.id),
  contactId: integer("contact_id").references(() => contacts.id),
  actorUserId: integer("actor_user_id").references(() => users.id),
  activityType: text("activity_type", { enum: LEAD_ACTIVITY_TYPES }).notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("lead_activities_lead_id_idx").on(table.leadId),
  index("lead_activities_company_id_idx").on(table.companyId),
  index("lead_activities_created_at_idx").on(table.createdAt),
]);

export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({ id: true, createdAt: true });
export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;

export const instructorApplications = pgTable("instructor_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  certificationId: integer("certification_id").references(() => certifications.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  yearsExperience: integer("years_experience").notNull(),
  equipmentTypes: text("equipment_types").array().notNull().default([]),
  industries: text("industries").array().notNull().default([]),
  hasTeachingExperience: boolean("has_teaching_experience").notNull().default(false),
  trainingExperience: text("training_experience"),
  currentCertifications: text("current_certifications"),
  availability: text("availability").notNull(),
  availabilityNotes: text("availability_notes"),
  willingToTravel: boolean("willing_to_travel").notNull().default(false),
  travelRadius: integer("travel_radius"),
  whyInstructor: text("why_instructor").notNull(),
  additionalNotes: text("additional_notes"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  resumeUrl: text("resume_url"),
  eligibilityVerifiedAt: timestamp("eligibility_verified_at"),
  status: text("status", { enum: ["applied", "reviewing", "approved", "rejected", "archived"] }).notNull().default("applied"),
  adminNotes: text("admin_notes"),
  complianceRating: integer("compliance_rating"),
  professionalismRating: integer("professionalism_rating"),
  fieldExperienceRating: integer("field_experience_rating"),
  interviewRecommended: boolean("interview_recommended").notNull().default(false),
  followUpNeeded: boolean("follow_up_needed").notNull().default(false),
  reviewChecklist: jsonb("review_checklist"),
  decisionSummary: text("decision_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("instructor_apps_status_idx").on(table.status),
  index("instructor_apps_user_id_idx").on(table.userId),
  index("instructor_apps_created_at_idx").on(table.createdAt),
]);

export const insertInstructorApplicationSchema = createInsertSchema(instructorApplications).omit({ id: true, status: true, adminNotes: true, complianceRating: true, professionalismRating: true, fieldExperienceRating: true, interviewRecommended: true, followUpNeeded: true, reviewChecklist: true, decisionSummary: true, createdAt: true, updatedAt: true });
export type InsertInstructorApplication = z.infer<typeof insertInstructorApplicationSchema>;
export type InstructorApplication = typeof instructorApplications.$inferSelect;

export const instructorAppStatusChanges = pgTable("instructor_app_status_changes", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => instructorApplications.id),
  changedByUserId: integer("changed_by_user_id").notNull().references(() => users.id),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("instructor_app_sc_app_id_idx").on(table.applicationId),
]);

export type InstructorAppStatusChange = typeof instructorAppStatusChanges.$inferSelect;

export const instructors = pgTable("instructors", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => instructorApplications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  travelRadius: integer("travel_radius"),
  equipmentClasses: text("equipment_classes").array().notNull().default([]),
  languages: text("languages").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  internalNotes: text("internal_notes"),
  onboardingChecklist: jsonb("onboarding_checklist").notNull().default({
    identityVerified: false,
    experienceReviewed: false,
    interviewCompleted: false,
    insuranceCollected: false,
    agreementSigned: false,
    taxInfoCollected: false,
    backgroundCheckComplete: false,
    readyForAssignment: false,
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("instructors_user_id_idx").on(table.userId),
  index("instructors_active_idx").on(table.active),
]);

export const insertInstructorSchema = createInsertSchema(instructors).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructors.$inferSelect;

export const instructorAssignments = pgTable("instructor_assignments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => onsiteTrainingRequests.id),
  instructorId: integer("instructor_id").notNull().references(() => instructors.id),
  status: text("status", { enum: ["proposed", "assigned", "confirmed", "completed", "cancelled"] }).notNull().default("proposed"),
  assignedByUserId: integer("assigned_by_user_id").notNull().references(() => users.id),
  notes: text("notes"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("instructor_assignments_request_id_idx").on(table.requestId),
  index("instructor_assignments_instructor_id_idx").on(table.instructorId),
  index("instructor_assignments_status_idx").on(table.status),
]);

export const insertInstructorAssignmentSchema = createInsertSchema(instructorAssignments).omit({ id: true, assignedAt: true, createdAt: true, updatedAt: true });
export type InsertInstructorAssignment = z.infer<typeof insertInstructorAssignmentSchema>;
export type InstructorAssignment = typeof instructorAssignments.$inferSelect;

export const instructorAssignmentStatusChanges = pgTable("instructor_assignment_status_changes", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => instructorAssignments.id),
  changedByUserId: integer("changed_by_user_id").notNull().references(() => users.id),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("assignment_sc_assignment_id_idx").on(table.assignmentId),
]);

export const insertInstructorAssignmentStatusChangeSchema = createInsertSchema(instructorAssignmentStatusChanges).omit({ id: true, createdAt: true });
export type InsertInstructorAssignmentStatusChange = z.infer<typeof insertInstructorAssignmentStatusChangeSchema>;
export type InstructorAssignmentStatusChange = typeof instructorAssignmentStatusChanges.$inferSelect;

export const trainingEvents = pgTable("training_events", {
  id: serial("id").primaryKey(),
  originatingLeadId: integer("originating_lead_id").references(() => onsiteTrainingRequests.id),
  companyId: integer("company_id").references(() => companies.id),
  primaryContactId: integer("primary_contact_id").references(() => contacts.id),
  title: text("title").notNull(),
  status: text("status", { enum: [...TRAINING_EVENT_STATUSES] }).notNull().default("unscheduled"),
  locationType: text("location_type", { enum: ["facility", "customer_onsite"] }).notNull(),
  locationSlug: text("location_slug"),
  onsiteStreet: text("onsite_street"),
  onsiteCity: text("onsite_city"),
  onsiteState: text("onsite_state"),
  onsiteZip: text("onsite_zip"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  timezone: text("timezone"),
  traineeCount: integer("trainee_count"),
  equipmentTypes: text("equipment_types").array().notNull().default([]),
  instructorId: integer("instructor_id").references(() => instructors.id),
  adminNotes: text("admin_notes"),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("training_events_status_idx").on(table.status),
  index("training_events_company_id_idx").on(table.companyId),
  index("training_events_lead_id_idx").on(table.originatingLeadId),
  index("training_events_scheduled_start_idx").on(table.scheduledStart),
  index("training_events_location_slug_idx").on(table.locationSlug),
]);

export const insertTrainingEventSchema = createInsertSchema(trainingEvents).omit({ id: true, status: true, createdAt: true, updatedAt: true });
export type InsertTrainingEvent = z.infer<typeof insertTrainingEventSchema>;
export type TrainingEvent = typeof trainingEvents.$inferSelect;

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  contactId: integer("contact_id").references(() => contacts.id),
  originatingLeadId: integer("originating_lead_id").references(() => onsiteTrainingRequests.id),
  linkedTrainingEventId: integer("linked_training_event_id").references(() => trainingEvents.id),
  status: text("status", { enum: [...QUOTE_STATUSES] }).notNull().default("draft"),
  title: text("title").notNull(),
  participantCount: integer("participant_count"),
  locationSlug: text("location_slug"),
  locationType: text("location_type"),
  onsiteStreet: text("onsite_street"),
  onsiteCity: text("onsite_city"),
  onsiteState: text("onsite_state"),
  onsiteZip: text("onsite_zip"),
  equipmentTypes: text("equipment_types").array().notNull().default([]),
  subtotal: integer("subtotal").notNull().default(0),
  total: integer("total").notNull().default(0),
  pricingNotes: text("pricing_notes"),
  validUntil: timestamp("valid_until"),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  approvedAt: timestamp("approved_at"),
  declinedAt: timestamp("declined_at"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("quotes_company_id_idx").on(table.companyId),
  index("quotes_contact_id_idx").on(table.contactId),
  index("quotes_originating_lead_id_idx").on(table.originatingLeadId),
  index("quotes_linked_training_event_id_idx").on(table.linkedTrainingEventId),
  index("quotes_status_idx").on(table.status),
  index("quotes_created_at_idx").on(table.createdAt),
  index("quotes_valid_until_idx").on(table.validUntil),
  index("quotes_location_slug_idx").on(table.locationSlug),
  index("quotes_created_by_user_id_idx").on(table.createdByUserId),
]);

export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, status: true, sentAt: true, respondedAt: true, approvedAt: true, declinedAt: true, linkedTrainingEventId: true, createdAt: true, updatedAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  trainingType: z.enum(["individual", "business", "trainer", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
