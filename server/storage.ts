import {
  users, groups, groupMembers, courses, courseSteps, examQuestions,
  orders, orderItems, payments, webhookEvents, enrollments, stepProgress,
  examAttempts, certifications, certCardOrders, contactSubmissions, auditLogs,
  type User, type InsertUser, type Group, type InsertGroup,
  type GroupMember, type InsertGroupMember, type Course, type InsertCourse,
  type CourseStep, type InsertCourseStep, type ExamQuestion, type InsertExamQuestion,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Payment, type InsertPayment, type WebhookEvent, type InsertWebhookEvent,
  type Enrollment, type InsertEnrollment, type StepProgress, type InsertStepProgress,
  type ExamAttempt, type InsertExamAttempt, type Certification, type InsertCertification,
  type CertCardOrder, type InsertCertCardOrder, type ContactSubmission, type InsertContactSubmission,
  type AuditLog, type InsertAuditLog, type ContactFormData,
  seoPages, type SeoPage, type InsertSeoPage,
  serviceAreas, bookings,
  type ServiceArea, type InsertServiceArea,
  type Booking, type InsertBooking,
  type AvailabilityRules, type AvailableSlot,
  supportConversations, supportMessages,
  type SupportConversation, type InsertSupportConversation,
  type SupportMessage, type InsertSupportMessage,
  companies, contacts, repAttribution,
  type Company, type InsertCompany,
  type Contact, type InsertContact,
  type RepAttribution, type InsertRepAttribution,
  onsiteTrainingRequests,
  type OnsiteTrainingRequest, type InsertOnsiteTrainingRequest,
  leadActivities,
  type LeadActivity, type InsertLeadActivity,
  instructorApplications,
  type InstructorApplication, type InsertInstructorApplication,
  instructorAppStatusChanges,
  type InstructorAppStatusChange,
  instructors,
  type Instructor, type InsertInstructor,
  instructorAssignments,
  type InstructorAssignment, type InsertInstructorAssignment,
  instructorAssignmentStatusChanges,
  type InstructorAssignmentStatusChange,
  trainingEvents,
  type TrainingEvent, type InsertTrainingEvent,
  quotes,
  type Quote, type InsertQuote,
} from "@shared/schema";
import type { QuoteStatus } from "@shared/config/quote-states";
import { db, pool } from "./db";
import { eq, and, desc, asc, lt, lte, sql, isNull, ne, or, inArray, gt, gte, isNotNull } from "drizzle-orm";

export interface IStorage {
  saveContactSubmission(data: ContactFormData): Promise<void>;

  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;
  getUserByResetTokenHash(tokenHash: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  linkOAuthProvider(id: number, provider: string, providerId: string): Promise<User | undefined>;
  updateUserRole(id: number, role: User["role"]): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  createGroup(data: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupsByAdmin(userId: number): Promise<Group[]>;
  addGroupMember(data: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(id: number): Promise<void>;
  getGroupMemberByToken(token: string): Promise<GroupMember | undefined>;
  acceptInvite(memberId: number, userId: number): Promise<GroupMember | undefined>;
  listGroupMembers(groupId: number): Promise<GroupMember[]>;
  resendInvite(memberId: number): Promise<GroupMember | undefined>;
  reissueInvite(memberId: number): Promise<GroupMember | undefined>;
  getGroupMemberByGroupAndEmail(groupId: number, email: string): Promise<GroupMember | undefined>;
  updateGroupMemberReminderSent(memberId: number): Promise<void>;

  getCourse(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  createCourse(data: InsertCourse): Promise<Course>;
  updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  listCourses(): Promise<Course[]>;
  listActiveCourses(): Promise<Course[]>;

  getCourseSteps(courseId: number): Promise<CourseStep[]>;
  createCourseStep(data: InsertCourseStep): Promise<CourseStep>;
  updateCourseStep(id: number, data: Partial<InsertCourseStep>): Promise<CourseStep | undefined>;
  deleteCourseStep(id: number): Promise<void>;

  getExamQuestions(stepId: number): Promise<ExamQuestion[]>;
  createExamQuestion(data: InsertExamQuestion): Promise<ExamQuestion>;
  updateExamQuestion(id: number, data: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined>;
  deleteExamQuestion(id: number): Promise<void>;

  createOrder(data: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersByGroup(groupId: number): Promise<Order[]>;
  getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: Order["status"]): Promise<Order | undefined>;
  updateOrderGroupId(id: number, groupId: number): Promise<Order | undefined>;
  markAbandonedEmailSent(id: number): Promise<void>;
  listPendingAbandoned(minutesOld: number): Promise<Order[]>;
  generateInvoiceNumber(orderId: number): Promise<string>;
  listOrders(): Promise<Order[]>;
  updateOrderCompany(id: number, companyId: number | null): Promise<Order | undefined>;

  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;

  createPayment(data: InsertPayment): Promise<Payment>;
  getPaymentsByOrder(orderId: number): Promise<Payment[]>;
  getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined>;

  createWebhookEvent(data: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEventByEventId(eventId: string): Promise<WebhookEvent | undefined>;
  updateWebhookRetry(id: number, error: string | null, status: WebhookEvent["status"]): Promise<void>;
  listFailedWebhooks(): Promise<WebhookEvent[]>;

  createEnrollment(data: InsertEnrollment): Promise<Enrollment>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  updateEnrollmentStatus(id: number, status: Enrollment["status"]): Promise<Enrollment | undefined>;
  assignEnrollmentUser(enrollmentId: number, userId: number, assignedBy: number): Promise<Enrollment | undefined>;
  unassignEnrollmentUser(enrollmentId: number): Promise<Enrollment | undefined>;
  listUnassignedEnrollments(orderId: number): Promise<Enrollment[]>;
  getEnrollmentsByOrder(orderId: number): Promise<Enrollment[]>;
  listAllEnrollments(): Promise<Enrollment[]>;

  getStepProgress(enrollmentId: number): Promise<StepProgress[]>;
  upsertStepProgress(data: InsertStepProgress): Promise<StepProgress>;
  checkAllStepsCompleted(enrollmentId: number, courseId: number): Promise<boolean>;

  createExamAttempt(data: InsertExamAttempt): Promise<ExamAttempt>;
  getExamAttempts(enrollmentId: number, stepId: number): Promise<ExamAttempt[]>;
  countExamAttempts(enrollmentId: number, stepId: number): Promise<number>;

  hasPassedExamForCourse(enrollmentId: number, courseId: number): Promise<boolean>;
  getCertificationByEnrollment(enrollmentId: number): Promise<Certification | undefined>;
  issueCertification(data: InsertCertification): Promise<Certification>;
  getCertification(id: number): Promise<Certification | undefined>;
  getCertificationsByUser(userId: number): Promise<Certification[]>;
  getCertificationByNumber(certNumber: string): Promise<Certification | undefined>;
  revokeCertification(id: number): Promise<Certification | undefined>;
  reissueCertification(id: number): Promise<Certification | undefined>;
  updateCertificationPdf(id: number, pdfUrl: string): Promise<void>;
  getCertificationsByOrder(orderId: number): Promise<Certification[]>;
  updateCertificationCompany(id: number, companyId: number | null): Promise<Certification | undefined>;
  getCertificationsByCompany(companyId: number): Promise<Certification[]>;
  updateEnrollmentCompany(id: number, companyId: number | null): Promise<Enrollment | undefined>;
  getEnrollmentsByCompany(companyId: number): Promise<Enrollment[]>;
  updateContactUserId(id: number, userId: number | null): Promise<Contact | undefined>;
  getCompanySummaryStats(companyId: number): Promise<{
    totalRevenue: number;
    orderCount: number;
    activeLearners: number;
    totalCertifications: number;
    expiringCertifications: number;
    leadCount: number;
    trainingEventCount: number;
    trainingEventsByStatus: Record<string, number>;
  }>;

  createCertCardOrder(data: InsertCertCardOrder): Promise<CertCardOrder>;
  getCertCardOrdersByUser(userId: number): Promise<CertCardOrder[]>;
  getCertCardOrdersByCertification(certId: number): Promise<CertCardOrder[]>;
  updateCertCardOrderStatus(id: number, status: CertCardOrder["status"]): Promise<CertCardOrder | undefined>;
  updateCertCardOrderTracking(id: number, tracking: string, carrier: string): Promise<CertCardOrder | undefined>;
  listCertCardOrders(): Promise<CertCardOrder[]>;

  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  listAuditLogsByEntity(entity: string, entityId: string): Promise<AuditLog[]>;
  listRecentAuditLogs(limit?: number): Promise<AuditLog[]>;

  listContactSubmissions(): Promise<ContactSubmission[]>;

  getSeoPageBySlug(slug: string, locale?: string): Promise<SeoPage | undefined>;
  getSeoPagesByTemplate(templateKey: string, locale?: string): Promise<SeoPage[]>;
  listPublishedSeoPages(locale?: string): Promise<SeoPage[]>;
  listAllSeoPages(): Promise<SeoPage[]>;
  createSeoPage(data: InsertSeoPage): Promise<SeoPage>;
  updateSeoPage(id: number, data: Partial<InsertSeoPage>): Promise<SeoPage | undefined>;
  upsertSeoPage(slug: string, locale: string, data: InsertSeoPage): Promise<SeoPage>;

  getServiceAreas(): Promise<ServiceArea[]>;
  getServiceAreaBySlug(slug: string): Promise<ServiceArea | undefined>;
  getServiceAreaById(id: number): Promise<ServiceArea | undefined>;
  checkServiceAreaByZip(zip: string): Promise<ServiceArea | undefined>;
  createServiceArea(data: InsertServiceArea): Promise<ServiceArea>;
  updateServiceArea(id: number, data: Partial<InsertServiceArea>): Promise<ServiceArea | undefined>;
  upsertServiceArea(slug: string, data: InsertServiceArea): Promise<ServiceArea>;

  getAvailableSlots(serviceAreaId: number, from: string, to: string): Promise<AvailableSlot[]>;
  getBookedParticipants(serviceAreaId: number, sessionDate: string, startTime: string): Promise<number>;
  getTrainerBlockedDates(from: string, to: string, excludeServiceAreaId?: number): Promise<Set<string>>;
  isTrainerBookedOnDate(sessionDate: string, excludeServiceAreaId?: number): Promise<boolean>;

  createBooking(data: InsertBooking): Promise<Booking>;
  getBookingById(id: number): Promise<Booking | undefined>;
  getBookingByNumber(num: string): Promise<Booking | undefined>;
  getBookingsForUser(userId: number): Promise<Booking[]>;
  getAllBookings(filters: { status?: string; serviceAreaId?: number; from?: string; to?: string }): Promise<Booking[]>;
  updateBookingStatus(id: number, status: Booking["status"]): Promise<Booking | undefined>;
  updateBookingOrderId(id: number, orderId: number): Promise<Booking | undefined>;

  createSupportConversation(data: InsertSupportConversation): Promise<SupportConversation>;
  getSupportConversation(id: number): Promise<SupportConversation | undefined>;
  getSupportConversationBySessionId(sessionId: string): Promise<SupportConversation | undefined>;
  updateSupportConversation(id: number, data: Partial<{ messageCount: number; escalated: boolean; lastMessageAt: Date }>): Promise<SupportConversation | undefined>;
  incrementSupportMessageCount(id: number): Promise<void>;
  createSupportMessage(data: InsertSupportMessage): Promise<SupportMessage>;

  getCompanies(filters?: CompanyFilters): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;
  updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company | undefined>;

  getContacts(filters?: ContactFilters): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(data: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined>;

  createRepAttribution(data: InsertRepAttribution): Promise<RepAttribution>;
  getRepAttribution(entityType: string, entityId: number): Promise<RepAttribution | undefined>;
  getRepAttributionsByRep(repId: number): Promise<RepAttribution[]>;

  createOnsiteTrainingRequest(data: InsertOnsiteTrainingRequest): Promise<OnsiteTrainingRequest>;
  listOnsiteTrainingRequests(status?: string): Promise<OnsiteTrainingRequest[]>;
  getOnsiteTrainingRequest(id: number): Promise<OnsiteTrainingRequest | undefined>;
  updateOnsiteTrainingRequest(id: number, data: Partial<Pick<OnsiteTrainingRequest, "status" | "adminNotes" | "assignedRepId" | "leadSource" | "companyId" | "contactId" | "nextActionType" | "nextActionDate" | "lastActivityAt" | "customerClassification">>): Promise<OnsiteTrainingRequest | undefined>;

  createLeadActivity(data: InsertLeadActivity): Promise<LeadActivity>;
  getLeadActivitiesByLead(leadId: number): Promise<LeadActivity[]>;
  getLeadActivitiesByCompany(companyId: number): Promise<LeadActivity[]>;

  createInstructorApplication(data: InsertInstructorApplication): Promise<InstructorApplication>;
  listInstructorApplications(status?: string): Promise<InstructorApplication[]>;
  listInstructorApplicationsAdvanced(filters: InstructorAppFilters): Promise<InstructorApplication[]>;
  getInstructorApplication(id: number): Promise<InstructorApplication | undefined>;
  getInstructorApplicationByUser(userId: number): Promise<InstructorApplication | undefined>;
  updateInstructorApplication(id: number, data: Partial<InstructorApplication>): Promise<InstructorApplication | undefined>;

  createInstructorAppStatusChange(data: { applicationId: number; changedByUserId: number; previousStatus: string; newStatus: string; note?: string }): Promise<InstructorAppStatusChange>;
  listInstructorAppStatusChanges(applicationId: number): Promise<InstructorAppStatusChange[]>;

  createInstructor(data: InsertInstructor): Promise<Instructor>;
  listInstructors(filters?: InstructorFilters): Promise<Instructor[]>;
  getInstructor(id: number): Promise<Instructor | undefined>;
  getInstructorByUser(userId: number): Promise<Instructor | undefined>;
  updateInstructor(id: number, data: Partial<Instructor>): Promise<Instructor | undefined>;

  createInstructorAssignment(data: InsertInstructorAssignment): Promise<InstructorAssignment>;
  getInstructorAssignment(id: number): Promise<InstructorAssignment | undefined>;
  listAssignmentsByRequest(requestId: number): Promise<InstructorAssignment[]>;
  listAssignmentsByInstructor(instructorId: number): Promise<InstructorAssignment[]>;
  updateInstructorAssignment(id: number, data: Partial<Pick<InstructorAssignment, "status" | "notes">>): Promise<InstructorAssignment | undefined>;

  createAssignmentStatusChange(data: { assignmentId: number; changedByUserId: number; previousStatus: string; newStatus: string; note?: string }): Promise<InstructorAssignmentStatusChange>;
  listAssignmentStatusChanges(assignmentId: number): Promise<InstructorAssignmentStatusChange[]>;

  getMatchingInstructors(requestId: number): Promise<(Instructor & { matchScore: number; matchReasons: string[] })[]>;

  createTrainingEvent(data: InsertTrainingEvent): Promise<TrainingEvent>;
  getTrainingEvent(id: number): Promise<TrainingEvent | undefined>;
  listTrainingEvents(filters?: TrainingEventFilters): Promise<TrainingEvent[]>;
  updateTrainingEvent(id: number, data: Partial<Pick<TrainingEvent, "title" | "status" | "locationType" | "locationSlug" | "onsiteStreet" | "onsiteCity" | "onsiteState" | "onsiteZip" | "scheduledStart" | "scheduledEnd" | "timezone" | "traineeCount" | "equipmentTypes" | "instructorId" | "adminNotes" | "companyId" | "primaryContactId">>): Promise<TrainingEvent | undefined>;
  createQuote(data: InsertQuote): Promise<Quote>;
  getQuote(id: number): Promise<Quote | undefined>;
  listQuotes(filters?: QuoteFilters): Promise<Quote[]>;
  updateQuote(id: number, data: QuoteUpdateInput): Promise<Quote | undefined>;
  updateQuoteStatus(id: number, status: QuoteStatus, timestamps?: QuoteTimestampUpdate): Promise<Quote | undefined>;
}

export interface CompanyFilters {
  search?: string;
  assignedRepId?: number;
  industry?: string;
  billingState?: string;
}

export interface ContactFilters {
  companyId?: number;
  search?: string;
  role?: string;
}

export interface InstructorAppFilters {
  status?: string;
  state?: string;
  city?: string;
  equipment?: string;
  minYears?: number;
  willingToTravel?: boolean;
  search?: string;
  sortBy?: "date" | "status" | "experience";
  sortOrder?: "asc" | "desc";
}

export interface QuoteFilters {
  status?: QuoteStatus;
  companyId?: number;
  contactId?: number;
  originatingLeadId?: number;
  linkedTrainingEventId?: number;
  locationSlug?: string;
  createdByUserId?: number;
}

export type QuoteUpdateInput = Partial<Pick<Quote,
  "title" | "companyId" | "contactId" | "participantCount" |
  "locationType" | "locationSlug" | "onsiteStreet" | "onsiteCity" | "onsiteState" | "onsiteZip" |
  "equipmentTypes" | "subtotal" | "total" | "pricingNotes" | "internalNotes" | "validUntil" |
  "linkedTrainingEventId"
>>;

export interface QuoteTimestampUpdate {
  sentAt?: Date;
  approvedAt?: Date;
  declinedAt?: Date;
  respondedAt?: Date;
}

export interface TrainingEventFilters {
  status?: string;
  locationSlug?: string;
  companyId?: number;
  dateFrom?: string;
  dateTo?: string;
  originatingLeadId?: number;
}

export interface InstructorFilters {
  active?: boolean;
  search?: string;
  state?: string;
  sortBy?: "name" | "date" | "state";
  sortOrder?: "asc" | "desc";
}

export class DatabaseStorage implements IStorage {
  async saveContactSubmission(data: ContactFormData): Promise<void> {
    await db.insert(contactSubmissions).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      trainingType: data.trainingType,
      message: data.message,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.authProvider, provider), eq(users.authProviderId, providerId)));
    return user;
  }

  async getUserByResetTokenHash(tokenHash: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(eq(users.passwordResetTokenHash, tokenHash));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({ ...data, email: data.email.toLowerCase() }).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async linkOAuthProvider(id: number, provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ authProvider: provider, authProviderId: providerId })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: number, role: User["role"]): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createGroup(data: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(data).returning();
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupsByAdmin(userId: number): Promise<Group[]> {
    return db.select().from(groups).where(eq(groups.adminUserId, userId));
  }

  async addGroupMember(data: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db.insert(groupMembers).values(data).returning();
    return member;
  }

  async removeGroupMember(id: number): Promise<void> {
    await db.delete(groupMembers).where(eq(groupMembers.id, id));
  }

  async getGroupMemberByToken(token: string): Promise<GroupMember | undefined> {
    const [member] = await db.select().from(groupMembers).where(eq(groupMembers.inviteToken, token));
    return member;
  }

  async acceptInvite(memberId: number, userId: number): Promise<GroupMember | undefined> {
    const [member] = await db.update(groupMembers)
      .set({ acceptedAt: new Date(), userId })
      .where(eq(groupMembers.id, memberId))
      .returning();
    return member;
  }

  async listGroupMembers(groupId: number): Promise<GroupMember[]> {
    return db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async resendInvite(memberId: number): Promise<GroupMember | undefined> {
    const member = await this.getGroupMemberById(memberId);
    if (!member) return undefined;
    if (member.acceptedAt) throw new Error("Cannot resend invite: already accepted");

    const [updated] = await db.update(groupMembers)
      .set({ invitedAt: new Date() })
      .where(eq(groupMembers.id, memberId))
      .returning();
    return updated;
  }

  async reissueInvite(memberId: number): Promise<GroupMember | undefined> {
    const member = await this.getGroupMemberById(memberId);
    if (!member) return undefined;
    if (member.acceptedAt) throw new Error("Cannot reissue invite: already accepted");

    const [updated] = await db.update(groupMembers)
      .set({ inviteToken: sql`gen_random_uuid()`, invitedAt: new Date() })
      .where(eq(groupMembers.id, memberId))
      .returning();
    return updated;
  }

  async getGroupMemberByGroupAndEmail(groupId: number, email: string): Promise<GroupMember | undefined> {
    const [member] = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.email, email.toLowerCase())));
    return member;
  }

  async updateGroupMemberReminderSent(memberId: number): Promise<void> {
    await db.update(groupMembers)
      .set({ lastReminderSentAt: new Date() })
      .where(eq(groupMembers.id, memberId));
  }

  private async getGroupMemberById(id: number): Promise<GroupMember | undefined> {
    const [member] = await db.select().from(groupMembers).where(eq(groupMembers.id, id));
    return member;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course;
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  async updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses).set({ ...data, updatedAt: new Date() }).where(eq(courses.id, id)).returning();
    return course;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async listCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(asc(courses.title));
  }

  async listActiveCourses(): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.isActive, true)).orderBy(asc(courses.title));
  }

  async getCourseSteps(courseId: number): Promise<CourseStep[]> {
    return db.select().from(courseSteps)
      .where(eq(courseSteps.courseId, courseId))
      .orderBy(asc(courseSteps.stepOrder));
  }

  async createCourseStep(data: InsertCourseStep): Promise<CourseStep> {
    const [step] = await db.insert(courseSteps).values(data).returning();
    return step;
  }

  async updateCourseStep(id: number, data: Partial<InsertCourseStep>): Promise<CourseStep | undefined> {
    const [step] = await db.update(courseSteps).set({ ...data, updatedAt: new Date() }).where(eq(courseSteps.id, id)).returning();
    return step;
  }

  async deleteCourseStep(id: number): Promise<void> {
    await db.delete(courseSteps).where(eq(courseSteps.id, id));
  }

  async getExamQuestions(stepId: number): Promise<ExamQuestion[]> {
    return db.select().from(examQuestions)
      .where(eq(examQuestions.stepId, stepId))
      .orderBy(asc(examQuestions.order));
  }

  async createExamQuestion(data: InsertExamQuestion): Promise<ExamQuestion> {
    const [q] = await db.insert(examQuestions).values(data).returning();
    return q;
  }

  async updateExamQuestion(id: number, data: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined> {
    const [q] = await db.update(examQuestions).set(data).where(eq(examQuestions.id, id)).returning();
    return q;
  }

  async deleteExamQuestion(id: number): Promise<void> {
    await db.delete(examQuestions).where(eq(examQuestions.id, id));
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await pool.query(
        `SELECT 'FC-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('order_number_seq')::text, 6, '0') as order_number`
      );
      const orderNumber = result.rows[0].order_number;
      try {
        const [order] = await db.insert(orders).values({ ...data, orderNumber }).returning();
        return order;
      } catch (err: any) {
        if (err.code === '23505' && err.constraint === 'orders_order_number_unique' && attempt < 2) {
          const maxResult = await pool.query(
            `SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)), 0) as max_num FROM orders`
          );
          await pool.query(`SELECT setval('order_number_seq', $1)`, [maxResult.rows[0].max_num + 1]);
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to generate unique order number after 3 attempts');
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByGroup(groupId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.groupId, groupId)).orderBy(desc(orders.createdAt));
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async updateOrderStatus(id: number, status: Order["status"]): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderCompany(id: number, companyId: number | null): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ companyId, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderGroupId(id: number, groupId: number): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ groupId, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async markAbandonedEmailSent(id: number): Promise<void> {
    await db.update(orders)
      .set({ abandonedEmailSent: true, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async listPendingAbandoned(minutesOld: number): Promise<Order[]> {
    const cutoff = new Date(Date.now() - minutesOld * 60 * 1000);
    return db.select().from(orders)
      .where(and(
        eq(orders.status, "pending"),
        eq(orders.abandonedEmailSent, false),
        lt(orders.createdAt, cutoff)
      ));
  }

  async generateInvoiceNumber(orderId: number): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const lockResult = await client.query(
        "SELECT invoice_number FROM orders WHERE id = $1 FOR UPDATE",
        [orderId]
      );
      if (!lockResult.rows.length) {
        await client.query("ROLLBACK");
        throw new Error(`Order ${orderId} not found`);
      }
      const existing = lockResult.rows[0].invoice_number;
      if (existing) {
        await client.query("COMMIT");
        return existing;
      }

      const seqResult = await client.query(
        "SELECT 'INV-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('invoice_number_seq')::text, 6, '0') as invoice_number"
      );
      const invoiceNumber = seqResult.rows[0].invoice_number;

      await client.query(
        "UPDATE orders SET invoice_number = $1, updated_at = NOW() WHERE id = $2",
        [invoiceNumber, orderId]
      );
      await client.query("COMMIT");
      return invoiceNumber;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async listOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }

  async getPaymentsByOrder(orderId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.orderId, orderId));
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments)
      .where(eq(payments.providerTransactionId, transactionId));
    return payment;
  }

  async createWebhookEvent(data: InsertWebhookEvent): Promise<WebhookEvent> {
    const [event] = await db.insert(webhookEvents).values(data).returning();
    return event;
  }

  async getWebhookEventByEventId(eventId: string): Promise<WebhookEvent | undefined> {
    const [event] = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, eventId));
    return event;
  }

  async updateWebhookRetry(id: number, error: string | null, status: WebhookEvent["status"]): Promise<void> {
    await db.update(webhookEvents).set({
      retryCount: sql`${webhookEvents.retryCount} + 1`,
      lastError: error,
      lastAttemptedAt: new Date(),
      status,
      updatedAt: new Date(),
    }).where(eq(webhookEvents.id, id));
  }

  async listFailedWebhooks(): Promise<WebhookEvent[]> {
    return db.select().from(webhookEvents)
      .where(and(
        eq(webhookEvents.status, "failed"),
        lt(webhookEvents.retryCount, 3)
      ));
  }

  async createEnrollment(data: InsertEnrollment): Promise<Enrollment> {
    let enrichedData = { ...data };
    if (enrichedData.orderId) {
      const order = await this.getOrder(enrichedData.orderId);
      if (order?.companyId) {
        if (enrichedData.companyId && enrichedData.companyId !== order.companyId) {
          throw new Error("Enrollment companyId conflicts with order companyId");
        }
        enrichedData.companyId = order.companyId;
      }
    }
    const [enrollment] = await db.insert(enrollments).values(enrichedData).returning();
    return enrollment;
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async updateEnrollmentStatus(id: number, status: Enrollment["status"]): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments)
      .set({ status, updatedAt: new Date(), ...(status === "completed" ? { completedAt: new Date() } : {}) })
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment;
  }

  async assignEnrollmentUser(enrollmentId: number, userId: number, assignedBy: number): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.userId) throw new Error("Enrollment already assigned");

    const existingAssignment = await db.select({ id: enrollments.id })
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, enrollment.courseId),
        ne(enrollments.status, "revoked")
      ))
      .limit(1);
    if (existingAssignment.length > 0) throw new Error("Cannot assign: this member already has an active seat for this course");

    const hasExamAttempt = await db.select({ id: examAttempts.id }).from(examAttempts)
      .where(eq(examAttempts.enrollmentId, enrollmentId)).limit(1);
    if (hasExamAttempt.length > 0) throw new Error("Cannot reassign: learner has exam attempts");

    const hasCert = await db.select({ id: certifications.id }).from(certifications)
      .where(eq(certifications.enrollmentId, enrollmentId)).limit(1);
    if (hasCert.length > 0) throw new Error("Cannot reassign: certification already issued");

    const advancedProgress = await db.select({ id: stepProgress.id })
      .from(stepProgress)
      .innerJoin(courseSteps, eq(stepProgress.stepId, courseSteps.id))
      .where(and(
        eq(stepProgress.enrollmentId, enrollmentId),
        gt(courseSteps.stepOrder, 1),
        ne(stepProgress.status, "not_started")
      ))
      .limit(1);
    if (advancedProgress.length > 0) throw new Error("Cannot reassign: learner has completed steps beyond the introduction");

    const [updated] = await db.update(enrollments)
      .set({ userId, assignedByUserId: assignedBy, updatedAt: new Date() })
      .where(eq(enrollments.id, enrollmentId))
      .returning();
    return updated;
  }

  async unassignEnrollmentUser(enrollmentId: number): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");

    const hasExamAttempt = await db.select({ id: examAttempts.id }).from(examAttempts)
      .where(eq(examAttempts.enrollmentId, enrollmentId)).limit(1);
    if (hasExamAttempt.length > 0) throw new Error("Cannot unassign: learner has exam attempts");

    const hasCert = await db.select({ id: certifications.id }).from(certifications)
      .where(eq(certifications.enrollmentId, enrollmentId)).limit(1);
    if (hasCert.length > 0) throw new Error("Cannot unassign: certification already issued");

    const advancedProgress = await db.select({ id: stepProgress.id })
      .from(stepProgress)
      .innerJoin(courseSteps, eq(stepProgress.stepId, courseSteps.id))
      .where(and(
        eq(stepProgress.enrollmentId, enrollmentId),
        gt(courseSteps.stepOrder, 1),
        ne(stepProgress.status, "not_started")
      ))
      .limit(1);
    if (advancedProgress.length > 0) throw new Error("Cannot unassign: learner has completed steps beyond the introduction");

    const [updated] = await db.update(enrollments)
      .set({ userId: null, assignedByUserId: null, updatedAt: new Date() })
      .where(eq(enrollments.id, enrollmentId))
      .returning();
    return updated;
  }

  async listUnassignedEnrollments(orderId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments)
      .where(and(eq(enrollments.orderId, orderId), isNull(enrollments.userId)));
  }

  async getEnrollmentsByOrder(orderId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.orderId, orderId));
  }

  async listAllEnrollments(): Promise<Enrollment[]> {
    return db.select().from(enrollments).orderBy(desc(enrollments.enrolledAt));
  }

  async getStepProgress(enrollmentId: number): Promise<StepProgress[]> {
    return db.select().from(stepProgress).where(eq(stepProgress.enrollmentId, enrollmentId));
  }

  async upsertStepProgress(data: InsertStepProgress): Promise<StepProgress> {
    const existing = await db.select().from(stepProgress)
      .where(and(
        eq(stepProgress.enrollmentId, data.enrollmentId),
        eq(stepProgress.stepId, data.stepId)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(stepProgress)
        .set({ status: data.status, score: data.score, completedAt: data.completedAt })
        .where(eq(stepProgress.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(stepProgress).values(data).returning();
    return created;
  }

  async checkAllStepsCompleted(enrollmentId: number, courseId: number): Promise<boolean> {
    const steps = await this.getCourseSteps(courseId);
    const progress = await this.getStepProgress(enrollmentId);
    const completedStepIds = new Set(progress.filter(p => p.status === "completed").map(p => p.stepId));
    return steps.every(s => completedStepIds.has(s.id));
  }

  async createExamAttempt(data: InsertExamAttempt): Promise<ExamAttempt> {
    const [attempt] = await db.insert(examAttempts).values(data).returning();
    return attempt;
  }

  async getExamAttempts(enrollmentId: number, stepId: number): Promise<ExamAttempt[]> {
    return db.select().from(examAttempts)
      .where(and(eq(examAttempts.enrollmentId, enrollmentId), eq(examAttempts.stepId, stepId)))
      .orderBy(desc(examAttempts.attemptNumber));
  }

  async countExamAttempts(enrollmentId: number, stepId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(examAttempts)
      .where(and(eq(examAttempts.enrollmentId, enrollmentId), eq(examAttempts.stepId, stepId)));
    return Number(result[0].count);
  }

  async hasPassedExamForCourse(enrollmentId: number, courseId: number): Promise<boolean> {
    const steps = await this.getCourseSteps(courseId);
    const examSteps = steps.filter(s => s.type === "exam");
    if (examSteps.length === 0) return true;
    for (const examStep of examSteps) {
      const attempts = await this.getExamAttempts(enrollmentId, examStep.id);
      const passed = attempts.some(a => a.passed);
      if (!passed) return false;
    }
    return true;
  }

  async getCertificationByEnrollment(enrollmentId: number): Promise<Certification | undefined> {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.enrollmentId, enrollmentId))
      .limit(1);
    return cert;
  }

  async issueCertification(data: InsertCertification): Promise<Certification> {
    let enrichedData = { ...data };
    if (enrichedData.enrollmentId) {
      const enrollment = await this.getEnrollment(enrichedData.enrollmentId);
      const derivedCompanyId = enrollment?.companyId
        || (enrollment?.orderId ? (await this.getOrder(enrollment.orderId))?.companyId : undefined)
        || undefined;
      if (derivedCompanyId) {
        if (enrichedData.companyId && enrichedData.companyId !== derivedCompanyId) {
          throw new Error("Certification companyId conflicts with enrollment/order companyId");
        }
        enrichedData.companyId = derivedCompanyId;
      }
    }
    const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const [cert] = await db.insert(certifications).values({
      ...enrichedData,
      certificateNumber: certNumber,
    }).returning();
    return cert;
  }

  async getCertification(id: number): Promise<Certification | undefined> {
    const [cert] = await db.select().from(certifications).where(eq(certifications.id, id));
    return cert;
  }

  async getCertificationsByUser(userId: number): Promise<Certification[]> {
    return db.select().from(certifications).where(eq(certifications.userId, userId));
  }

  async getCertificationByNumber(certNumber: string): Promise<Certification | undefined> {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.certificateNumber, certNumber));
    return cert;
  }

  async revokeCertification(id: number): Promise<Certification | undefined> {
    const [cert] = await db.update(certifications)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(certifications.id, id))
      .returning();
    return cert;
  }

  async reissueCertification(id: number): Promise<Certification | undefined> {
    const [cert] = await db.update(certifications)
      .set({ status: "reissued", reissuedAt: new Date(), pdfUrl: null, pdfGeneratedAt: null, updatedAt: new Date() })
      .where(eq(certifications.id, id))
      .returning();
    return cert;
  }

  async updateCertificationPdf(id: number, pdfUrl: string): Promise<void> {
    await db.update(certifications)
      .set({ pdfUrl, pdfGeneratedAt: new Date(), updatedAt: new Date() })
      .where(eq(certifications.id, id));
  }

  async getCertificationsByOrder(orderId: number): Promise<Certification[]> {
    const orderEnrollments = await db.select({ id: enrollments.id })
      .from(enrollments).where(eq(enrollments.orderId, orderId));
    if (orderEnrollments.length === 0) return [];
    const enrollmentIds = orderEnrollments.map(e => e.id);
    return db.select().from(certifications)
      .where(inArray(certifications.enrollmentId, enrollmentIds));
  }

  async getCertificationsByCompany(companyId: number): Promise<Certification[]> {
    return db.select().from(certifications)
      .where(eq(certifications.companyId, companyId))
      .orderBy(desc(certifications.issuedAt));
  }

  async updateCertificationCompany(id: number, companyId: number | null): Promise<Certification | undefined> {
    const [cert] = await db.update(certifications)
      .set({ companyId })
      .where(eq(certifications.id, id))
      .returning();
    return cert;
  }

  async updateEnrollmentCompany(id: number, companyId: number | null): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments)
      .set({ companyId })
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment;
  }

  async getEnrollmentsByCompany(companyId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments)
      .where(eq(enrollments.companyId, companyId))
      .orderBy(desc(enrollments.enrolledAt));
  }

  async getCompanySummaryStats(companyId: number): Promise<{
    totalRevenue: number;
    orderCount: number;
    activeLearners: number;
    totalCertifications: number;
    expiringCertifications: number;
    leadCount: number;
    trainingEventCount: number;
    trainingEventsByStatus: Record<string, number>;
  }> {
    // Revenue: sum of orders with status="paid" (excludes pending/refunded)
    const [revenueResult] = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      orderCount: sql<number>`COUNT(*)::int`,
    }).from(orders)
      .where(and(
        eq(orders.companyId, companyId),
        eq(orders.status, "paid"),
      ));

    // Active learners: enrollments with status="active" (not completed/revoked)
    const [enrollmentResult] = await db.select({
      activeLearners: sql<number>`COUNT(*)::int`,
    }).from(enrollments)
      .where(and(
        eq(enrollments.companyId, companyId),
        eq(enrollments.status, "active"),
      ));

    // Total certifications: certs with status="issued" (not revoked/reissued)
    const [certResult] = await db.select({
      totalCertifications: sql<number>`COUNT(*)::int`,
    }).from(certifications)
      .where(and(
        eq(certifications.companyId, companyId),
        eq(certifications.status, "issued"),
      ));

    // Expiring certifications: issued certs with expiresAt within 90 days from now
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const [expiringResult] = await db.select({
      expiringCertifications: sql<number>`COUNT(*)::int`,
    }).from(certifications)
      .where(and(
        eq(certifications.companyId, companyId),
        eq(certifications.status, "issued"),
        isNotNull(certifications.expiresAt),
        lte(certifications.expiresAt, ninetyDaysFromNow),
        gte(certifications.expiresAt, new Date()),
      ));

    // Lead count: onsite training requests linked to this company
    const [leadResult] = await db.select({
      leadCount: sql<number>`COUNT(*)::int`,
    }).from(onsiteTrainingRequests)
      .where(eq(onsiteTrainingRequests.companyId, companyId));

    // Training events: total count and breakdown by status
    const eventRows = await db.select({
      status: trainingEvents.status,
      count: sql<number>`COUNT(*)::int`,
    }).from(trainingEvents)
      .where(eq(trainingEvents.companyId, companyId))
      .groupBy(trainingEvents.status);

    const trainingEventsByStatus: Record<string, number> = {};
    let trainingEventCount = 0;
    for (const row of eventRows) {
      trainingEventsByStatus[row.status] = row.count;
      trainingEventCount += row.count;
    }

    return {
      totalRevenue: parseFloat(revenueResult?.totalRevenue || "0"),
      orderCount: revenueResult?.orderCount || 0,
      activeLearners: enrollmentResult?.activeLearners || 0,
      totalCertifications: certResult?.totalCertifications || 0,
      expiringCertifications: expiringResult?.expiringCertifications || 0,
      leadCount: leadResult?.leadCount || 0,
      trainingEventCount,
      trainingEventsByStatus,
    };
  }

  async createCertCardOrder(data: InsertCertCardOrder): Promise<CertCardOrder> {
    const [order] = await db.insert(certCardOrders).values(data).returning();
    return order;
  }

  async getCertCardOrdersByUser(userId: number): Promise<CertCardOrder[]> {
    return db.select().from(certCardOrders).where(eq(certCardOrders.userId, userId));
  }

  async getCertCardOrdersByCertification(certId: number): Promise<CertCardOrder[]> {
    return db.select().from(certCardOrders).where(eq(certCardOrders.certificationId, certId));
  }

  async updateCertCardOrderStatus(id: number, status: CertCardOrder["status"]): Promise<CertCardOrder | undefined> {
    const [order] = await db.update(certCardOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(certCardOrders.id, id))
      .returning();
    return order;
  }

  async updateCertCardOrderTracking(id: number, tracking: string, carrier: string): Promise<CertCardOrder | undefined> {
    const [order] = await db.update(certCardOrders)
      .set({ trackingNumber: tracking, carrier, status: "shipped", updatedAt: new Date() })
      .where(eq(certCardOrders.id, id))
      .returning();
    return order;
  }

  async listCertCardOrders(): Promise<CertCardOrder[]> {
    return db.select().from(certCardOrders).orderBy(desc(certCardOrders.createdAt));
  }

  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async listAuditLogsByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .where(and(eq(auditLogs.entity, entity), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt));
  }

  async listRecentAuditLogs(limit = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  async listContactSubmissions(): Promise<ContactSubmission[]> {
    return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  async getSeoPageBySlug(slug: string, locale = "en"): Promise<SeoPage | undefined> {
    const [page] = await db.select().from(seoPages)
      .where(and(eq(seoPages.slug, slug), eq(seoPages.locale, locale)));
    return page;
  }

  async getSeoPagesByTemplate(templateKey: string, locale = "en"): Promise<SeoPage[]> {
    return db.select().from(seoPages)
      .where(and(eq(seoPages.templateKey, templateKey), eq(seoPages.locale, locale), eq(seoPages.published, true)))
      .orderBy(asc(seoPages.title));
  }

  async listPublishedSeoPages(locale = "en"): Promise<SeoPage[]> {
    return db.select().from(seoPages)
      .where(and(eq(seoPages.published, true), eq(seoPages.locale, locale)))
      .orderBy(asc(seoPages.slug));
  }

  async listAllSeoPages(): Promise<SeoPage[]> {
    return db.select().from(seoPages).orderBy(asc(seoPages.slug));
  }

  async createSeoPage(data: InsertSeoPage): Promise<SeoPage> {
    const [page] = await db.insert(seoPages).values(data).returning();
    return page;
  }

  async updateSeoPage(id: number, data: Partial<InsertSeoPage>): Promise<SeoPage | undefined> {
    const [page] = await db.update(seoPages).set({ ...data, updatedAt: new Date() })
      .where(eq(seoPages.id, id)).returning();
    return page;
  }

  async upsertSeoPage(slug: string, locale: string, data: InsertSeoPage): Promise<SeoPage> {
    const existing = await this.getSeoPageBySlug(slug, locale);
    if (existing) {
      const [updated] = await db.update(seoPages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(seoPages.id, existing.id))
        .returning();
      return updated;
    }
    return this.createSeoPage({ ...data, slug, locale });
  }

  async getServiceAreas(): Promise<ServiceArea[]> {
    return db.select().from(serviceAreas).where(eq(serviceAreas.isActive, true)).orderBy(asc(serviceAreas.name));
  }

  async getServiceAreaBySlug(slug: string): Promise<ServiceArea | undefined> {
    const [area] = await db.select().from(serviceAreas).where(eq(serviceAreas.slug, slug));
    return area;
  }

  async getServiceAreaById(id: number): Promise<ServiceArea | undefined> {
    const [area] = await db.select().from(serviceAreas).where(eq(serviceAreas.id, id));
    return area;
  }

  async checkServiceAreaByZip(zip: string): Promise<ServiceArea | undefined> {
    const areas = await db.select().from(serviceAreas).where(eq(serviceAreas.isActive, true));
    for (const area of areas) {
      if (area.zipPrefixes.some(prefix => zip.startsWith(prefix))) {
        return area;
      }
    }
    return undefined;
  }

  async createServiceArea(data: InsertServiceArea): Promise<ServiceArea> {
    const [area] = await db.insert(serviceAreas).values(data).returning();
    return area;
  }

  async updateServiceArea(id: number, data: Partial<InsertServiceArea>): Promise<ServiceArea | undefined> {
    const [area] = await db.update(serviceAreas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceAreas.id, id))
      .returning();
    return area;
  }

  async upsertServiceArea(slug: string, data: InsertServiceArea): Promise<ServiceArea> {
    const existing = await this.getServiceAreaBySlug(slug);
    if (existing) {
      const [updated] = await db.update(serviceAreas)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(serviceAreas.id, existing.id))
        .returning();
      return updated;
    }
    return this.createServiceArea({ ...data, slug });
  }

  async getAvailableSlots(serviceAreaId: number, from: string, to: string): Promise<AvailableSlot[]> {
    const area = await this.getServiceAreaById(serviceAreaId);
    if (!area) return [];

    const rules = area.availabilityRules as AvailabilityRules;
    // Malformed/legacy rules (e.g. hand-seeded data) must degrade to "no
    // slots", not crash the endpoint.
    if (!rules || !Array.isArray((rules as any).daysOfWeek) || !Array.isArray((rules as any).timeSlots)) return [];
    const { daysOfWeek, timeSlots, maxParticipants, leadTimeDays, windowDays, blackoutDates } = rules;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leadDate = new Date(today);
    leadDate.setDate(leadDate.getDate() + (leadTimeDays || 2));
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + (windowDays || 90));

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const effectiveFrom = fromDate > leadDate ? fromDate : leadDate;
    const effectiveTo = toDate < maxDate ? toDate : maxDate;

    if (effectiveFrom > effectiveTo) return [];

    const existingBookings = await db.select({
      sessionDate: bookings.sessionDate,
      startTime: bookings.startTime,
      totalParticipants: sql<number>`COALESCE(SUM(${bookings.participantCount}), 0)`,
    })
    .from(bookings)
    .where(and(
      eq(bookings.serviceAreaId, serviceAreaId),
      sql`${bookings.sessionDate} >= ${from}`,
      sql`${bookings.sessionDate} <= ${to}`,
      ne(bookings.status, 'cancelled'),
    ))
    .groupBy(bookings.sessionDate, bookings.startTime);

    const bookedMap = new Map<string, number>();
    for (const b of existingBookings) {
      bookedMap.set(`${b.sessionDate}_${b.startTime}`, Number(b.totalParticipants));
    }

    const trainerBlockedDates = await this.getTrainerBlockedDates(from, to, serviceAreaId);

    const blackoutSet = new Set(blackoutDates || []);
    const slots: AvailableSlot[] = [];
    const current = new Date(effectiveFrom);

    while (current <= effectiveTo) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];

      if (daysOfWeek.includes(dayOfWeek) && !blackoutSet.has(dateStr)) {
        const trainerBusy = trainerBlockedDates.has(dateStr);
        for (const slot of timeSlots) {
          const booked = bookedMap.get(`${dateStr}_${slot.startTime}`) || 0;
          slots.push({
            date: dateStr,
            startTime: slot.startTime,
            endTime: slot.endTime,
            maxParticipants,
            bookedParticipants: trainerBusy ? maxParticipants : booked,
            available: !trainerBusy && booked < maxParticipants,
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  async getBookedParticipants(serviceAreaId: number, sessionDate: string, startTime: string): Promise<number> {
    const [result] = await db.select({
      total: sql<number>`COALESCE(SUM(${bookings.participantCount}), 0)`,
    })
    .from(bookings)
    .where(and(
      eq(bookings.serviceAreaId, serviceAreaId),
      eq(bookings.sessionDate, sessionDate),
      eq(bookings.startTime, startTime),
      ne(bookings.status, 'cancelled'),
    ));
    return Number(result?.total || 0);
  }

  async getTrainerBlockedDates(from: string, to: string, excludeServiceAreaId?: number): Promise<Set<string>> {
    const conditions = [
      sql`${bookings.sessionDate} >= ${from}`,
      sql`${bookings.sessionDate} <= ${to}`,
      ne(bookings.status, 'cancelled'),
    ];
    if (excludeServiceAreaId !== undefined) {
      conditions.push(ne(bookings.serviceAreaId, excludeServiceAreaId));
    }
    const results = await db.selectDistinct({
      sessionDate: bookings.sessionDate,
    })
    .from(bookings)
    .where(and(...conditions));

    return new Set(results.map((r) => r.sessionDate));
  }

  async isTrainerBookedOnDate(sessionDate: string, excludeServiceAreaId?: number): Promise<boolean> {
    const conditions = [
      eq(bookings.sessionDate, sessionDate),
      ne(bookings.status, 'cancelled'),
    ];
    if (excludeServiceAreaId !== undefined) {
      conditions.push(ne(bookings.serviceAreaId, excludeServiceAreaId));
    }
    const [result] = await db.select({
      count: sql<number>`COUNT(*)`,
    })
    .from(bookings)
    .where(and(...conditions));

    return Number(result?.count || 0) > 0;
  }

  async createBooking(data: InsertBooking): Promise<Booking> {
    const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const [booking] = await db.insert(bookings).values({ ...data, bookingNumber }).returning();
    return booking;
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByNumber(num: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.bookingNumber, num));
    return booking;
  }

  async getBookingsForUser(userId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  }

  async getAllBookings(filters: { status?: string; serviceAreaId?: number; from?: string; to?: string }): Promise<Booking[]> {
    const conditions = [];
    if (filters.status) conditions.push(eq(bookings.status, filters.status as any));
    if (filters.serviceAreaId) conditions.push(eq(bookings.serviceAreaId, filters.serviceAreaId));
    if (filters.from) conditions.push(sql`${bookings.sessionDate} >= ${filters.from}`);
    if (filters.to) conditions.push(sql`${bookings.sessionDate} <= ${filters.to}`);

    return db.select().from(bookings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bookings.createdAt));
  }

  async updateBookingStatus(id: number, status: Booking["status"]): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBookingOrderId(id: number, orderId: number): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set({ orderId, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }
  async createSupportConversation(data: InsertSupportConversation): Promise<SupportConversation> {
    const [conv] = await db.insert(supportConversations).values(data).returning();
    return conv;
  }

  async getSupportConversation(id: number): Promise<SupportConversation | undefined> {
    const [conv] = await db.select().from(supportConversations).where(eq(supportConversations.id, id));
    return conv;
  }

  async getSupportConversationBySessionId(sessionId: string): Promise<SupportConversation | undefined> {
    const [conv] = await db.select().from(supportConversations)
      .where(eq(supportConversations.sessionId, sessionId))
      .orderBy(desc(supportConversations.createdAt))
      .limit(1);
    return conv;
  }

  async updateSupportConversation(id: number, data: Partial<{ messageCount: number; escalated: boolean; lastMessageAt: Date }>): Promise<SupportConversation | undefined> {
    const [conv] = await db.update(supportConversations).set(data).where(eq(supportConversations.id, id)).returning();
    return conv;
  }

  async incrementSupportMessageCount(id: number): Promise<void> {
    await db.update(supportConversations)
      .set({
        messageCount: sql`${supportConversations.messageCount} + 1`,
        lastMessageAt: new Date(),
      })
      .where(eq(supportConversations.id, id));
  }

  async createSupportMessage(data: InsertSupportMessage): Promise<SupportMessage> {
    const [msg] = await db.insert(supportMessages).values(data).returning();
    return msg;
  }

  async getCompanies(filters?: CompanyFilters): Promise<Company[]> {
    const conditions = [];
    if (filters?.assignedRepId) conditions.push(eq(companies.assignedRepId, filters.assignedRepId));
    if (filters?.industry) conditions.push(eq(companies.industry, filters.industry));
    if (filters?.billingState) conditions.push(eq(companies.billingState, filters.billingState));
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push(sql`(LOWER(${companies.name}) LIKE ${term} OR LOWER(${companies.email}) LIKE ${term} OR ${companies.phone} LIKE ${term})`);
    }
    return db.select().from(companies)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(companies.createdAt));
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  async updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db.update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async getContacts(filters?: ContactFilters): Promise<Contact[]> {
    const conditions = [];
    if (filters?.companyId) conditions.push(eq(contacts.companyId, filters.companyId));
    if (filters?.role) conditions.push(eq(contacts.role, filters.role));
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push(sql`(LOWER(${contacts.firstName}) LIKE ${term} OR LOWER(${contacts.lastName}) LIKE ${term} OR LOWER(${contacts.email}) LIKE ${term} OR ${contacts.phone} LIKE ${term})`);
    }
    return db.select().from(contacts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contacts.createdAt));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(data: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(data).returning();
    return contact;
  }

  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db.update(contacts)
      .set(data)
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async updateContactUserId(id: number, userId: number | null): Promise<Contact | undefined> {
    const [contact] = await db.update(contacts)
      .set({ userId })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async createRepAttribution(data: InsertRepAttribution): Promise<RepAttribution> {
    const [attr] = await db.insert(repAttribution).values(data).returning();
    return attr;
  }

  async getRepAttribution(entityType: string, entityId: number): Promise<RepAttribution | undefined> {
    const [attr] = await db.select().from(repAttribution)
      .where(and(eq(repAttribution.entityType, entityType), eq(repAttribution.entityId, entityId)));
    return attr;
  }

  async getRepAttributionsByRep(repId: number): Promise<RepAttribution[]> {
    return db.select().from(repAttribution)
      .where(or(eq(repAttribution.primaryRepId, repId), eq(repAttribution.secondaryRepId, repId)))
      .orderBy(desc(repAttribution.createdAt));
  }

  async createOnsiteTrainingRequest(data: InsertOnsiteTrainingRequest): Promise<OnsiteTrainingRequest> {
    const [req] = await db.insert(onsiteTrainingRequests).values(data).returning();
    return req;
  }

  async listOnsiteTrainingRequests(status?: string): Promise<OnsiteTrainingRequest[]> {
    if (status) {
      return db.select().from(onsiteTrainingRequests)
        .where(eq(onsiteTrainingRequests.status, status))
        .orderBy(desc(onsiteTrainingRequests.createdAt));
    }
    return db.select().from(onsiteTrainingRequests).orderBy(desc(onsiteTrainingRequests.createdAt));
  }

  async getOnsiteTrainingRequest(id: number): Promise<OnsiteTrainingRequest | undefined> {
    const [req] = await db.select().from(onsiteTrainingRequests).where(eq(onsiteTrainingRequests.id, id));
    return req;
  }

  async updateOnsiteTrainingRequest(id: number, data: Partial<Pick<OnsiteTrainingRequest, "status" | "adminNotes" | "assignedRepId" | "leadSource" | "companyId" | "contactId" | "nextActionType" | "nextActionDate" | "lastActivityAt" | "customerClassification">>): Promise<OnsiteTrainingRequest | undefined> {
    const [req] = await db.update(onsiteTrainingRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(onsiteTrainingRequests.id, id))
      .returning();
    return req;
  }

  async createLeadActivity(data: InsertLeadActivity): Promise<LeadActivity> {
    const [activity] = await db.insert(leadActivities).values(data).returning();
    await db.update(onsiteTrainingRequests)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() })
      .where(eq(onsiteTrainingRequests.id, data.leadId));
    return activity;
  }

  async getLeadActivitiesByLead(leadId: number): Promise<LeadActivity[]> {
    return db.select().from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
  }

  async getLeadActivitiesByCompany(companyId: number): Promise<LeadActivity[]> {
    return db.select().from(leadActivities)
      .where(eq(leadActivities.companyId, companyId))
      .orderBy(desc(leadActivities.createdAt));
  }

  async createInstructorApplication(data: InsertInstructorApplication): Promise<InstructorApplication> {
    const [app] = await db.insert(instructorApplications).values(data).returning();
    return app;
  }

  async listInstructorApplications(status?: string): Promise<InstructorApplication[]> {
    if (status) {
      return db.select().from(instructorApplications)
        .where(eq(instructorApplications.status, status))
        .orderBy(desc(instructorApplications.createdAt));
    }
    return db.select().from(instructorApplications).orderBy(desc(instructorApplications.createdAt));
  }

  async listInstructorApplicationsAdvanced(filters: InstructorAppFilters): Promise<InstructorApplication[]> {
    const conditions = [];
    if (filters.status) conditions.push(eq(instructorApplications.status, filters.status));
    if (filters.state) conditions.push(eq(instructorApplications.state, filters.state));
    if (filters.city) conditions.push(sql`LOWER(${instructorApplications.city}) = LOWER(${filters.city})`);
    if (filters.equipment) conditions.push(sql`${filters.equipment} = ANY(${instructorApplications.equipmentTypes})`);
    if (filters.minYears !== undefined) conditions.push(sql`${instructorApplications.yearsExperience} >= ${filters.minYears}`);
    if (filters.willingToTravel !== undefined) conditions.push(eq(instructorApplications.willingToTravel, filters.willingToTravel));
    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push(sql`(LOWER(${instructorApplications.fullName}) LIKE ${term} OR LOWER(${instructorApplications.email}) LIKE ${term} OR ${instructorApplications.phone} LIKE ${term})`);
    }

    let orderCol: ReturnType<typeof desc> | ReturnType<typeof asc>;
    const dir = filters.sortOrder === "asc" ? asc : desc;
    switch (filters.sortBy) {
      case "status": orderCol = dir(instructorApplications.status); break;
      case "experience": orderCol = dir(instructorApplications.yearsExperience); break;
      default: orderCol = dir(instructorApplications.createdAt);
    }

    if (conditions.length > 0) {
      return db.select().from(instructorApplications).where(and(...conditions)).orderBy(orderCol);
    }
    return db.select().from(instructorApplications).orderBy(orderCol);
  }

  async getInstructorApplication(id: number): Promise<InstructorApplication | undefined> {
    const [app] = await db.select().from(instructorApplications).where(eq(instructorApplications.id, id));
    return app;
  }

  async getInstructorApplicationByUser(userId: number): Promise<InstructorApplication | undefined> {
    const [app] = await db.select().from(instructorApplications)
      .where(eq(instructorApplications.userId, userId))
      .orderBy(desc(instructorApplications.createdAt));
    return app;
  }

  async updateInstructorApplication(id: number, data: Partial<InstructorApplication>): Promise<InstructorApplication | undefined> {
    const { id: _id, createdAt: _ca, ...updateData } = data as Record<string, unknown>;
    const [app] = await db.update(instructorApplications)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(instructorApplications.id, id))
      .returning();
    return app;
  }

  async createInstructorAppStatusChange(data: { applicationId: number; changedByUserId: number; previousStatus: string; newStatus: string; note?: string }): Promise<InstructorAppStatusChange> {
    const [change] = await db.insert(instructorAppStatusChanges).values(data).returning();
    return change;
  }

  async listInstructorAppStatusChanges(applicationId: number): Promise<InstructorAppStatusChange[]> {
    return db.select().from(instructorAppStatusChanges)
      .where(eq(instructorAppStatusChanges.applicationId, applicationId))
      .orderBy(desc(instructorAppStatusChanges.createdAt));
  }

  async createInstructor(data: InsertInstructor): Promise<Instructor> {
    const [inst] = await db.insert(instructors).values(data).returning();
    return inst;
  }

  async listInstructors(filters?: InstructorFilters): Promise<Instructor[]> {
    const conditions = [];
    if (filters?.active !== undefined) conditions.push(eq(instructors.active, filters.active));
    if (filters?.state) conditions.push(eq(instructors.state, filters.state));
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push(sql`(LOWER(${instructors.fullName}) LIKE ${term} OR LOWER(${instructors.email}) LIKE ${term} OR ${instructors.phone} LIKE ${term})`);
    }

    let orderCol: ReturnType<typeof desc> | ReturnType<typeof asc>;
    const dir = filters?.sortOrder === "asc" ? asc : desc;
    switch (filters?.sortBy) {
      case "name": orderCol = dir(instructors.fullName); break;
      case "state": orderCol = dir(instructors.state); break;
      default: orderCol = dir(instructors.createdAt);
    }

    if (conditions.length > 0) {
      return db.select().from(instructors).where(and(...conditions)).orderBy(orderCol);
    }
    return db.select().from(instructors).orderBy(orderCol);
  }

  async getInstructor(id: number): Promise<Instructor | undefined> {
    const [inst] = await db.select().from(instructors).where(eq(instructors.id, id));
    return inst;
  }

  async getInstructorByUser(userId: number): Promise<Instructor | undefined> {
    const [inst] = await db.select().from(instructors).where(eq(instructors.userId, userId));
    return inst;
  }

  async updateInstructor(id: number, data: Partial<Instructor>): Promise<Instructor | undefined> {
    const { id: _id, createdAt: _ca, ...updateData } = data as Record<string, unknown>;
    const [inst] = await db.update(instructors)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(instructors.id, id))
      .returning();
    return inst;
  }

  async createInstructorAssignment(data: InsertInstructorAssignment): Promise<InstructorAssignment> {
    const [assignment] = await db.insert(instructorAssignments).values(data).returning();
    return assignment;
  }

  async getInstructorAssignment(id: number): Promise<InstructorAssignment | undefined> {
    const [assignment] = await db.select().from(instructorAssignments).where(eq(instructorAssignments.id, id));
    return assignment;
  }

  async listAssignmentsByRequest(requestId: number): Promise<InstructorAssignment[]> {
    return db.select().from(instructorAssignments)
      .where(eq(instructorAssignments.requestId, requestId))
      .orderBy(desc(instructorAssignments.createdAt));
  }

  async listAssignmentsByInstructor(instructorId: number): Promise<InstructorAssignment[]> {
    return db.select().from(instructorAssignments)
      .where(eq(instructorAssignments.instructorId, instructorId))
      .orderBy(desc(instructorAssignments.createdAt));
  }

  async updateInstructorAssignment(id: number, data: Partial<Pick<InstructorAssignment, "status" | "notes">>): Promise<InstructorAssignment | undefined> {
    const [assignment] = await db.update(instructorAssignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(instructorAssignments.id, id))
      .returning();
    return assignment;
  }

  async createAssignmentStatusChange(data: { assignmentId: number; changedByUserId: number; previousStatus: string; newStatus: string; note?: string }): Promise<InstructorAssignmentStatusChange> {
    const [change] = await db.insert(instructorAssignmentStatusChanges).values(data).returning();
    return change;
  }

  async listAssignmentStatusChanges(assignmentId: number): Promise<InstructorAssignmentStatusChange[]> {
    return db.select().from(instructorAssignmentStatusChanges)
      .where(eq(instructorAssignmentStatusChanges.assignmentId, assignmentId))
      .orderBy(desc(instructorAssignmentStatusChanges.createdAt));
  }

  async getMatchingInstructors(requestId: number): Promise<(Instructor & { matchScore: number; matchReasons: string[] })[]> {
    const request = await this.getOnsiteTrainingRequest(requestId);
    if (!request) return [];

    const allInstructors = await db.select().from(instructors)
      .where(eq(instructors.active, true))
      .orderBy(asc(instructors.fullName));

    const existingAssignments = await this.listAssignmentsByRequest(requestId);
    const assignedIds = new Set(
      existingAssignments
        .filter(a => a.status !== "cancelled")
        .map(a => a.instructorId)
    );

    const scored = allInstructors
      .filter(inst => !assignedIds.has(inst.id))
      .filter(inst => {
        const checklist = inst.onboardingChecklist as Record<string, boolean>;
        return checklist?.readyForAssignment === true;
      })
      .map(inst => {
        let score = 0;
        const reasons: string[] = [];
        const checklist = inst.onboardingChecklist as Record<string, boolean>;

        const completedItems = checklist ? Object.values(checklist).filter(Boolean).length : 0;
        score += Math.round((completedItems / 8) * 15);
        reasons.push("Onboarding complete");

        const sameState = inst.state.toLowerCase() === request.state.toLowerCase();
        const sameCity = inst.city.toLowerCase() === request.city.toLowerCase();

        if (sameCity) {
          score += 35;
          reasons.push("Same city");
        } else if (sameState) {
          score += 20;
          reasons.push("Same state");
        }

        if (inst.travelRadius && inst.travelRadius > 0) {
          if (sameCity) {
            score += 5;
            reasons.push(`${inst.travelRadius}mi travel radius`);
          } else if (sameState && inst.travelRadius >= 50) {
            score += 10;
            reasons.push(`${inst.travelRadius}mi travel radius covers region`);
          }
        }

        const requestEquipment = request.equipmentTypes.map(e => e.toLowerCase());
        const instEquipment = inst.equipmentClasses.map(e => e.toLowerCase());
        if (requestEquipment.length > 0) {
          const equipMatch = requestEquipment.filter(e => instEquipment.includes(e));
          if (equipMatch.length === requestEquipment.length) {
            score += 25;
            reasons.push("Full equipment match");
          } else if (equipMatch.length > 0) {
            const pct = equipMatch.length / requestEquipment.length;
            score += Math.round(pct * 20);
            reasons.push(`${equipMatch.length}/${requestEquipment.length} equipment match`);
          }
        } else if (instEquipment.length > 0) {
          score += 5;
          reasons.push("Has equipment certifications");
        }

        if (inst.languages.length > 1) {
          score += 5;
          reasons.push(`Languages: ${inst.languages.join(", ")}`);
        }

        return { ...inst, matchScore: score, matchReasons: reasons };
      });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
  }
  async createTrainingEvent(data: InsertTrainingEvent): Promise<TrainingEvent> {
    const [event] = await db.insert(trainingEvents).values(data).returning();
    return event;
  }

  async getTrainingEvent(id: number): Promise<TrainingEvent | undefined> {
    const [event] = await db.select().from(trainingEvents).where(eq(trainingEvents.id, id));
    return event;
  }

  async listTrainingEvents(filters?: TrainingEventFilters): Promise<TrainingEvent[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(trainingEvents.status, filters.status));
    }
    if (filters?.locationSlug) {
      conditions.push(eq(trainingEvents.locationSlug, filters.locationSlug));
    }
    if (filters?.companyId) {
      conditions.push(eq(trainingEvents.companyId, filters.companyId));
    }
    if (filters?.originatingLeadId) {
      conditions.push(eq(trainingEvents.originatingLeadId, filters.originatingLeadId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(trainingEvents.scheduledStart, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setDate(endOfDay.getDate() + 1);
      conditions.push(lt(trainingEvents.scheduledStart, endOfDay));
    }

    if (conditions.length === 0) {
      return db.select().from(trainingEvents).orderBy(desc(trainingEvents.createdAt));
    }

    return db.select().from(trainingEvents)
      .where(and(...conditions))
      .orderBy(desc(trainingEvents.createdAt));
  }

  async updateTrainingEvent(id: number, data: Partial<Pick<TrainingEvent, "title" | "status" | "locationType" | "locationSlug" | "onsiteStreet" | "onsiteCity" | "onsiteState" | "onsiteZip" | "scheduledStart" | "scheduledEnd" | "timezone" | "traineeCount" | "equipmentTypes" | "instructorId" | "adminNotes" | "companyId" | "primaryContactId">>): Promise<TrainingEvent | undefined> {
    const [updated] = await db.update(trainingEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(trainingEvents.id, id))
      .returning();
    return updated;
  }

  async createQuote(data: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(data).returning();
    return quote;
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async listQuotes(filters?: QuoteFilters): Promise<Quote[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(quotes.status, filters.status));
    if (filters?.companyId) conditions.push(eq(quotes.companyId, filters.companyId));
    if (filters?.contactId) conditions.push(eq(quotes.contactId, filters.contactId));
    if (filters?.originatingLeadId) conditions.push(eq(quotes.originatingLeadId, filters.originatingLeadId));
    if (filters?.linkedTrainingEventId) conditions.push(eq(quotes.linkedTrainingEventId, filters.linkedTrainingEventId));
    if (filters?.locationSlug) conditions.push(eq(quotes.locationSlug, filters.locationSlug));
    if (filters?.createdByUserId) conditions.push(eq(quotes.createdByUserId, filters.createdByUserId));

    if (conditions.length === 0) {
      return db.select().from(quotes).orderBy(desc(quotes.createdAt));
    }
    return db.select().from(quotes).where(and(...conditions)).orderBy(desc(quotes.createdAt));
  }

  async updateQuote(id: number, data: QuoteUpdateInput): Promise<Quote | undefined> {
    const [updated] = await db.update(quotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updated;
  }

  async updateQuoteStatus(id: number, status: QuoteStatus, timestamps?: QuoteTimestampUpdate): Promise<Quote | undefined> {
    const setData: { status: QuoteStatus; updatedAt: Date; sentAt?: Date; approvedAt?: Date; declinedAt?: Date; respondedAt?: Date } = {
      status,
      updatedAt: new Date(),
    };
    if (timestamps?.sentAt) setData.sentAt = timestamps.sentAt;
    if (timestamps?.approvedAt) setData.approvedAt = timestamps.approvedAt;
    if (timestamps?.declinedAt) setData.declinedAt = timestamps.declinedAt;
    if (timestamps?.respondedAt) setData.respondedAt = timestamps.respondedAt;
    const [updated] = await db.update(quotes)
      .set(setData)
      .where(eq(quotes.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
