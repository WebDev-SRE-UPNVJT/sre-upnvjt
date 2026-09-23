import { pgTable, serial, varchar, text, boolean, integer, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. RBAC & Organization Structure
export const department = pgTable('department', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  code: varchar('code', { length: 255 }).unique().notNull(),
  description: text('description'),
});

export const division = pgTable('division', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  departmentId: integer('departmentId').references(() => department.id, { onDelete: 'cascade' }).notNull(),
});

export const role = pgTable('role', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  permissions: jsonb('permissions').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const activity = pgTable('activity', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  imageUrl: varchar('imageUrl', { length: 500 }),
  date: timestamp('date', { mode: 'date' }).notNull(),
  type: varchar('type', { length: 255 }).notNull(), // e.g., Internal, External, Workshop, Meeting
  link: varchar('link', { length: 1000 }),
  linkType: varchar('linkType', { length: 50 }).default('detail').notNull(),
  isPriority: boolean('isPriority').default(false).notNull(),
  isAnnouncementModal: boolean('isAnnouncementModal').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 2. User & Member Profiles
export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  npm: varchar('npm', { length: 255 }).unique(),
  positionName: varchar('positionName', { length: 255 }),
  isActive: boolean('isActive').default(true).notNull(),
  mustChangePassword: boolean('mustChangePassword').default(false).notNull(),
  roleId: integer('roleId').references(() => role.id).notNull(),
  departmentId: integer('departmentId').references(() => department.id, { onDelete: 'set null' }),
  divisionId: integer('divisionId').references(() => division.id, { onDelete: 'set null' }),
  profilePictureUrl: varchar('profilePictureUrl', { length: 500 }),
  totalPoints: integer('totalPoints').default(0).notNull(), // kept for legacy
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const memberProfile = pgTable('memberProfile', {
  userId: integer('userId').references(() => user.id, { onDelete: 'cascade' }).primaryKey(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
});

// 3. Announcements
export const announcement = pgTable('announcement', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  imageUrl: varchar('imageUrl', { length: 1000 }),
  actionLink: varchar('actionLink', { length: 1000 }),
  content: text('content').notNull(),
  targetAudience: varchar('targetAudience', { length: 255 }),
  isActive: boolean('isActive').default(true).notNull(),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 4. Contents (Articles & Categories)
export const contentCategory = pgTable('contentCategory', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  color: varchar('color', { length: 50 }).default('emerald'),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  categoryId: integer('categoryId').references(() => contentCategory.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(), // English title (Default)
  titleId: varchar('titleId', { length: 255 }),        // Indonesian title
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  body: text('body').notNull(),                        // English body (Default)
  bodyId: text('bodyId'),                              // Indonesian body
  imageUrl: varchar('imageUrl', { length: 1000 }),
  isPublished: boolean('isPublished').default(false).notNull(),
  updatedById: integer('updatedById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 5. Tasks & Submissions
export const formTemplate = pgTable('formTemplate', {
  id: serial('id').primaryKey(),
  uuid: varchar('uuid', { length: 64 }).unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  questions: jsonb('questions').notNull().default([]),
  isPublished: boolean('isPublished').default(true).notNull(),
  collectUserData: boolean('collectUserData').default(false).notNull(),
  isQuiz: boolean('isQuiz').default(false).notNull(),
  limitOneResponse: boolean('limitOneResponse').default(false).notNull(),
  spreadsheetId: varchar('spreadsheetId', { length: 255 }),
  spreadsheetUrl: varchar('spreadsheetUrl', { length: 500 }),
  driveFolderId: varchar('driveFolderId', { length: 255 }),
  driveFolderUrl: varchar('driveFolderUrl', { length: 500 }),
  successMessage: text('successMessage'),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const formSubmission = pgTable('formSubmission', {
  id: serial('id').primaryKey(),
  formTemplateId: integer('formTemplateId').references(() => formTemplate.id, { onDelete: 'cascade' }).notNull(),
  memberId: integer('memberId').references(() => user.id, { onDelete: 'set null' }),
  responderName: varchar('responderName', { length: 255 }),
  responderEmail: varchar('responderEmail', { length: 255 }),
  answers: jsonb('answers').notNull().default([]),
  score: integer('score'),
  submittedAt: timestamp('submittedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const task = pgTable('task', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  introduction: text('introduction'),
  instructions: text('instructions'),
  submissionGuidelines: text('submissionGuidelines'),
  rewardXp: integer('rewardXp').default(0).notNull(),
  category: varchar('category', { length: 50 }).default('MAIN').notNull(), // 'MAIN' | 'SIDE'
  isRequired: boolean('isRequired').default(true).notNull(), // true = Wajib, false = Opsional
  formTemplateId: integer('formTemplateId').references(() => formTemplate.id, { onDelete: 'set null' }),
  ttsCrosswordId: integer('ttsCrosswordId').references(() => ttsCrossword.id, { onDelete: 'set null' }),
  pptModuleId: integer('pptModuleId').references(() => pptModule.id, { onDelete: 'set null' }),
  ttsScoringMode: varchar('ttsScoringMode', { length: 50 }).default('COMPLETION').notNull(), // 'COMPLETION' | 'PROPORTIONAL' | 'PERFECT'
  formScoringMode: varchar('formScoringMode', { length: 50 }).default('COMPLETION').notNull(), // 'COMPLETION' | 'PROPORTIONAL' | 'PERFECT'
  folderId: varchar('folderId', { length: 255 }),
  spreadsheetId: varchar('spreadsheetId', { length: 255 }),
  spreadsheetUrl: varchar('spreadsheetUrl', { length: 500 }),
  maxUploadSizeMb: integer('maxUploadSizeMb'),
  allowMultipleFiles: boolean('allowMultipleFiles').default(false),
  submissionType: varchar('submissionType', { length: 50 }).default('FILE'), // 'FILE' | 'LINK' | 'TTS' | 'FORM' | 'BOTH'
  prerequisiteTaskId: integer('prerequisiteTaskId').references(() => task.id, { onDelete: 'set null' }),
  deadline: timestamp('deadline', { mode: 'date' }).notNull(),
  enableSpeedBonus: boolean('enableSpeedBonus').default(true).notNull(),
  allowLateSubmission: boolean('allowLateSubmission').default(true).notNull(),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const taskSubmission = pgTable('taskSubmission', {
  id: serial('id').primaryKey(),
  taskId: integer('taskId').references(() => task.id, { onDelete: 'cascade' }).notNull(),
  memberId: integer('memberId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  fileUrl: varchar('fileUrl', { length: 1000 }),
  status: varchar('status', { length: 50 }).notNull(), // 'PENDING', 'APPROVED', 'REJECTED'
  feedback: text('feedback'),
  answers: jsonb('answers'), // For TTS / Form answers details
  score: integer('score'), // Score percentage (0 - 100)
  correctCount: integer('correctCount'),
  wrongCount: integer('wrongCount'),
  totalQuestions: integer('totalQuestions'),
  xpEarned: integer('xpEarned'),
  timeTakenSeconds: integer('timeTakenSeconds'),
  reviewedById: integer('reviewedById').references(() => user.id, { onDelete: 'set null' }),
  submittedAt: timestamp('submittedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 6. Attendances
export const attendanceSession = pgTable('attendanceSession', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: timestamp('date', { mode: 'date' }).notNull(),
  startTime: timestamp('startTime', { mode: 'date' }),
  endTime: timestamp('endTime', { mode: 'date' }),
  token: varchar('token', { length: 50 }),
  isActive: boolean('isActive').default(true).notNull(),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  sessionId: integer('sessionId').references(() => attendanceSession.id, { onDelete: 'cascade' }).notNull(),
  memberId: integer('memberId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'PRESENT', 'ABSENT', etc.
  notes: text('notes'),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 7. Events
export const event = pgTable('event', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  bannerUrl: varchar('bannerUrl', { length: 1000 }),
  eventDate: timestamp('eventDate', { mode: 'date' }).notNull(),
  location: varchar('location', { length: 255 }),
  category: varchar('category', { length: 255 }),
  registrationType: varchar('registrationType', { length: 255 }),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 8. Partners
export const partner = pgTable('partner', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: varchar('logoUrl', { length: 1000 }),
  websiteUrl: varchar('websiteUrl', { length: 1000 }),
  tier: varchar('tier', { length: 50 }),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 9. System Settings
export const systemSetting = pgTable('systemSetting', {
  id: serial('id').primaryKey(),
  keyName: varchar('keyName', { length: 255 }).unique().notNull(),
  valueData: text('valueData').notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 10. Merchandise
export const merchandise = pgTable('merchandise', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  imageUrl: varchar('imageUrl', { length: 1000 }),
  linkUrl: varchar('linkUrl', { length: 1000 }),
  isAvailable: boolean('isAvailable').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});


// RELATIONS
export const departmentRelations = relations(department, ({ many }) => ({
  divisions: many(division),
  users: many(user),
}));

export const divisionRelations = relations(division, ({ one, many }) => ({
  department: one(department, {
    fields: [division.departmentId],
    references: [department.id],
  }),
  users: many(user),
}));

export const roleRelations = relations(role, ({ many }) => ({
  users: many(user),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  role: one(role, { fields: [user.roleId], references: [role.id] }),
  department: one(department, { fields: [user.departmentId], references: [department.id] }),
  division: one(division, { fields: [user.divisionId], references: [division.id] }),
  memberProfile: one(memberProfile, { fields: [user.id], references: [memberProfile.userId] }),
  announcementsCreated: many(announcement),
  contentsUpdated: many(content),
  tasksCreated: many(task),
  taskSubmissions: many(taskSubmission, { relationName: 'MemberSubmissions' }),
  tasksReviewed: many(taskSubmission, { relationName: 'ReviewerSubmissions' }),
  attendances: many(attendance),
  documentItemsUploaded: many(documentItem),
  shortlinksCreated: many(shortlink),
}));

export const memberProfileRelations = relations(memberProfile, ({ one }) => ({
  user: one(user, { fields: [memberProfile.userId], references: [user.id] }),
}));

export const announcementRelations = relations(announcement, ({ one }) => ({
  createdBy: one(user, { fields: [announcement.createdById], references: [user.id] }),
}));

export const contentCategoryRelations = relations(contentCategory, ({ many }) => ({
  contents: many(content),
}));

export const contentRelations = relations(content, ({ one }) => ({
  updatedBy: one(user, { fields: [content.updatedById], references: [user.id] }),
  category: one(contentCategory, { fields: [content.categoryId], references: [contentCategory.id] }),
}));

export const formTemplateRelations = relations(formTemplate, ({ one, many }) => ({
  createdBy: one(user, { fields: [formTemplate.createdById], references: [user.id] }),
  submissions: many(formSubmission),
  tasks: many(task),
}));

export const formSubmissionRelations = relations(formSubmission, ({ one, many }) => ({
  formTemplate: one(formTemplate, { fields: [formSubmission.formTemplateId], references: [formTemplate.id] }),
  member: one(user, { fields: [formSubmission.memberId], references: [user.id] }),
  taskSubmissions: many(taskSubmission),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  createdBy: one(user, { fields: [task.createdById], references: [user.id] }),
  formTemplate: one(formTemplate, { fields: [task.formTemplateId], references: [formTemplate.id] }),
  ttsCrossword: one(ttsCrossword, { fields: [task.ttsCrosswordId], references: [ttsCrossword.id] }),
  prerequisiteTask: one(task, { fields: [task.prerequisiteTaskId], references: [task.id] }),
  pptModule: one(pptModule, { fields: [task.pptModuleId], references: [pptModule.id] }),
  submissions: many(taskSubmission),
}));

export const taskSubmissionRelations = relations(taskSubmission, ({ one }) => ({
  task: one(task, { fields: [taskSubmission.taskId], references: [task.id] }),
  member: one(user, { fields: [taskSubmission.memberId], references: [user.id], relationName: 'MemberSubmissions' }),
  reviewer: one(user, { fields: [taskSubmission.reviewedById], references: [user.id], relationName: 'ReviewerSubmissions' }),
}));

export const attendanceSessionRelations = relations(attendanceSession, ({ one, many }) => ({
  createdBy: one(user, { fields: [attendanceSession.createdById], references: [user.id] }),
  attendances: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  session: one(attendanceSession, { fields: [attendance.sessionId], references: [attendanceSession.id] }),
  member: one(user, { fields: [attendance.memberId], references: [user.id] }),
}));

// 11. Additional Tables & Relations

export const testimonial = pgTable('testimonial', {
  id: serial('id').primaryKey(),
  authorName: varchar('authorName', { length: 255 }).notNull(),
  authorPosition: varchar('authorPosition', { length: 255 }).notNull(),
  authorPhotoUrl: varchar('authorPhotoUrl', { length: 1000 }),
  content: text('content').notNull(),
  isPublished: boolean('isPublished').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const memberApplication = pgTable('memberApplication', {
  id: serial('id').primaryKey(),
  fullName: varchar('fullName', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  npm: varchar('npm', { length: 255 }).notNull(),
  faculty: varchar('faculty', { length: 255 }).notNull(),
  motivation: text('motivation').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  reviewedById: integer('reviewedById').references(() => user.id, { onDelete: 'set null' }),
  appliedAt: timestamp('appliedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const eventRegistration = pgTable('eventRegistration', {
  id: serial('id').primaryKey(),
  eventId: integer('eventId').references(() => event.id, { onDelete: 'cascade' }).notNull(),
  fullName: varchar('fullName', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  teamName: varchar('teamName', { length: 255 }),
  registrationType: varchar('registrationType', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  submittedAt: timestamp('submittedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const memberApplicationRelations = relations(memberApplication, ({ one }) => ({
  reviewedBy: one(user, {
    fields: [memberApplication.reviewedById],
    references: [user.id],
  }),
}));

export const eventRegistrationRelations = relations(eventRegistration, ({ one }) => ({
  event: one(event, {
    fields: [eventRegistration.eventId],
    references: [event.id],
  }),
}));

// 12. Literature Bank
export const literatureCategory = pgTable('literatureCategory', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  imageUrl: varchar('imageUrl', { length: 1000 }),
  description: text('description'),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

export const literatureItem = pgTable('literatureItem', {
  id: serial('id').primaryKey(),
  categoryId: integer('categoryId').references(() => literatureCategory.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }),
  year: integer('year'),
  driveUrl: varchar('driveUrl', { length: 1000 }).notNull(),
  type: varchar('type', { length: 50 }),
  abstract: text('abstract'),       // English / Default abstract (optional)
  abstractId: text('abstractId'),   // Indonesian abstract (optional)
  keywords: text('keywords'),       // English / Default keywords (optional)
  keywordsId: text('keywordsId'),   // Indonesian keywords (optional)
  isPublished: boolean('isPublished').default(false).notNull(),
  uploadedById: integer('uploadedById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

// 13. PPT Phases & Modules
export const pptPhase = pgTable('pptPhase', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

export const pptModule = pgTable('pptModule', {
  id: serial('id').primaryKey(),
  phaseId: integer('phaseId').references(() => pptPhase.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  description: text('description'),
  notes: text('notes'),
  coverImageUrl: varchar('coverImageUrl', { length: 1000 }),
  isPublished: boolean('isPublished').default(false).notNull(),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

export const pptSlide = pgTable('pptSlide', {
  id: serial('id').primaryKey(),
  moduleId: integer('moduleId').references(() => pptModule.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').notNull(),
  title: varchar('title', { length: 255 }),
  fileUrl: varchar('fileUrl', { length: 1000 }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

export const pptModuleProgress = pgTable('pptModuleProgress', {
  id: serial('id').primaryKey(),
  userId: integer('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  moduleId: integer('moduleId').references(() => pptModule.id, { onDelete: 'cascade' }).notNull(),
  currentSlideIdx: integer('currentSlideIdx').default(0).notNull(),
  maxSlideIdx: integer('maxSlideIdx').default(0).notNull(),
  isCompleted: boolean('isCompleted').default(false).notNull(),
  completedAt: timestamp('completedAt', { mode: 'date' }),
  lastAccessedAt: timestamp('lastAccessedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// 14. Quiz System
export const quiz = pgTable('quiz', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  timeLimitMinutes: integer('timeLimitMinutes'),
  passingScore: integer('passingScore').default(70),
  rewardXp: integer('rewardXp').default(0).notNull(),
  isPublished: boolean('isPublished').default(false).notNull(),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

export const quizQuestion = pgTable('quizQuestion', {
  id: serial('id').primaryKey(),
  quizId: integer('quizId').references(() => quiz.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'MULTIPLE_CHOICE' | 'ESSAY'
  question: text('question').notNull(),
  options: jsonb('options').default([]),            // [{id, text}] for MCQ
  correctOptionId: varchar('correctOptionId', { length: 50 }), // null for essay
  points: integer('points').default(1).notNull(),
});

export const quizSubmission = pgTable('quizSubmission', {
  id: serial('id').primaryKey(),
  quizId: integer('quizId').references(() => quiz.id, { onDelete: 'cascade' }).notNull(),
  memberId: integer('memberId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  answers: jsonb('answers').notNull().default([]), // [{questionId, selectedOptionId?, essayText?}]
  mcqScore: integer('mcqScore'),                   // auto-calculated on submit
  essayScore: integer('essayScore'),               // manually set by grader
  totalScore: integer('totalScore'),
  isPassed: boolean('isPassed'),
  gradedById: integer('gradedById').references(() => user.id, { onDelete: 'set null' }),
  submittedAt: timestamp('submittedAt', { mode: 'date' }).$defaultFn(() => new Date()),
  gradedAt: timestamp('gradedAt', { mode: 'date' }),
});

// 15. XP Transaction Log
export const xpTransaction = pgTable('xpTransaction', {
  id: serial('id').primaryKey(),
  userId: integer('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  sourceType: varchar('sourceType', { length: 50 }), // 'task' | 'quiz' | 'attendance' | 'manual'
  sourceId: integer('sourceId'),
  grantedById: integer('grantedById').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

// 16. Documents
export const documentCategory = pgTable('documentCategory', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

export const documentItem = pgTable('documentItem', {
  id: serial('id').primaryKey(),
  categoryId: integer('categoryId').references(() => documentCategory.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: varchar('fileUrl', { length: 1000 }).notNull(),
  uploadedById: integer('uploadedById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()),
});

// 17. Shortlinks
export const shortlink = pgTable('shortlink', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  originalUrl: text('originalUrl').notNull(),
  description: varchar('description', { length: 255 }),
  clicks: integer('clicks').default(0).notNull(),
  isActive: boolean('isActive').default(true),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

// Relations (12-17)

export const literatureCategoryRelations = relations(literatureCategory, ({ many }) => ({
  items: many(literatureItem),
}));

export const literatureItemRelations = relations(literatureItem, ({ one }) => ({
  category: one(literatureCategory, {
    fields: [literatureItem.categoryId],
    references: [literatureCategory.id],
  }),
  uploadedBy: one(user, {
    fields: [literatureItem.uploadedById],
    references: [user.id],
  }),
}));

export const pptPhaseRelations = relations(pptPhase, ({ many }) => ({
  modules: many(pptModule),
}));

export const pptModuleRelations = relations(pptModule, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [pptModule.createdById],
    references: [user.id],
  }),
  phase: one(pptPhase, {
    fields: [pptModule.phaseId],
    references: [pptPhase.id],
  }),
  slides: many(pptSlide),
  tasks: many(task),
  progress: many(pptModuleProgress),
}));

export const pptSlideRelations = relations(pptSlide, ({ one }) => ({
  module: one(pptModule, {
    fields: [pptSlide.moduleId],
    references: [pptModule.id],
  }),
}));

export const pptModuleProgressRelations = relations(pptModuleProgress, ({ one }) => ({
  user: one(user, {
    fields: [pptModuleProgress.userId],
    references: [user.id],
  }),
  module: one(pptModule, {
    fields: [pptModuleProgress.moduleId],
    references: [pptModule.id],
  }),
}));

export const quizRelations = relations(quiz, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [quiz.createdById],
    references: [user.id],
  }),
  questions: many(quizQuestion),
  submissions: many(quizSubmission),
}));

export const quizQuestionRelations = relations(quizQuestion, ({ one }) => ({
  quiz: one(quiz, {
    fields: [quizQuestion.quizId],
    references: [quiz.id],
  }),
}));

export const quizSubmissionRelations = relations(quizSubmission, ({ one }) => ({
  quiz: one(quiz, {
    fields: [quizSubmission.quizId],
    references: [quiz.id],
  }),
  member: one(user, {
    fields: [quizSubmission.memberId],
    references: [user.id],
    relationName: 'MemberQuizSubmissions',
  }),
  gradedBy: one(user, {
    fields: [quizSubmission.gradedById],
    references: [user.id],
    relationName: 'GraderQuizSubmissions',
  }),
}));

export const xpTransactionRelations = relations(xpTransaction, ({ one }) => ({
  user: one(user, {
    fields: [xpTransaction.userId],
    references: [user.id],
    relationName: 'UserXpTransactions',
  }),
  grantedBy: one(user, {
    fields: [xpTransaction.grantedById],
    references: [user.id],
    relationName: 'GranterXpTransactions',
  }),
}));

export const documentCategoryRelations = relations(documentCategory, ({ many }) => ({
  items: many(documentItem),
}));

export const documentItemRelations = relations(documentItem, ({ one }) => ({
  category: one(documentCategory, {
    fields: [documentItem.categoryId],
    references: [documentCategory.id],
  }),
  uploadedBy: one(user, {
    fields: [documentItem.uploadedById],
    references: [user.id],
  }),
}));

export const shortlinkRelations = relations(shortlink, ({ one }) => ({
  createdBy: one(user, {
    fields: [shortlink.createdById],
    references: [user.id],
  }),
}));

// 18. Page Views (Visitor Tracking)
export const pageView = pgTable('pageView', {
  id: serial('id').primaryKey(),
  path: text('path').notNull(),
  visitorId: varchar('visitorId', { length: 36 }).notNull(), // UUID dari cookie sre_vid
  userId: integer('userId').references(() => user.id, { onDelete: 'set null' }),       // nullable — hanya kalau visitor login
  deviceType: varchar('deviceType', { length: 20 }),         // mobile | desktop | tablet
  browser: varchar('browser', { length: 100 }),
  referrer: text('referrer'),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const pageViewRelations = relations(pageView, ({ one }) => ({
  user: one(user, {
    fields: [pageView.userId],
    references: [user.id],
  }),
}));

// 19. Featured Projects
export const featuredProject = pgTable('featuredProject', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // e.g., Infrastructure, Research, Social Impact
  status: varchar('status', { length: 50 }).notNull().default('ONGOING'), // ONGOING | COMPLETED | PLANNED
  description: text('description').notNull(),
  imageUrl: varchar('imageUrl', { length: 1000 }),
  isPublished: boolean('isPublished').default(false).notNull(),
  order: integer('order').default(0).notNull(), // display ordering
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const featuredProjectRelations = relations(featuredProject, ({ one }) => ({
  createdBy: one(user, {
    fields: [featuredProject.createdById],
    references: [user.id],
  }),
}));

// Password Reset Tokens
export const passwordResetToken = pgTable('passwordResetToken', {
  id: serial('id').primaryKey(),
  userId: integer('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const passwordResetTokenRelations = relations(passwordResetToken, ({ one }) => ({
  user: one(user, {
    fields: [passwordResetToken.userId],
    references: [user.id],
  }),
}));

// 20. Teka-Teki Silang (TTS)
export const ttsCrossword = pgTable('ttsCrossword', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  timeLimitMinutes: integer('timeLimitMinutes'),
  rewardXp: integer('rewardXp').default(0).notNull(),
  validationMode: varchar('validationMode', { length: 50 }).default('MODAL').notNull(), // 'MODAL' | 'END'
  wrongAnswerBehavior: varchar('wrongAnswerBehavior', { length: 50 }).default('RETRY').notNull(), // 'RETRY' | 'REVEAL'
  maxRetryAttempts: integer('maxRetryAttempts'), // null or 0 = unlimited retry, or positive number (e.g. 3)
  isPublished: boolean('isPublished').default(true).notNull(),
  createdById: integer('createdById').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const ttsQuestion = pgTable('ttsQuestion', {
  id: serial('id').primaryKey(),
  crosswordId: integer('crosswordId').references(() => ttsCrossword.id, { onDelete: 'cascade' }).notNull(),
  clue: text('clue').notNull(),
  answer: varchar('answer', { length: 100 }).notNull(),
  points: integer('points').default(10).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const ttsCrosswordRelations = relations(ttsCrossword, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [ttsCrossword.createdById],
    references: [user.id],
  }),
  questions: many(ttsQuestion),
  tasks: many(task),
}));

export const ttsQuestionRelations = relations(ttsQuestion, ({ one }) => ({
  crossword: one(ttsCrossword, {
    fields: [ttsQuestion.crosswordId],
    references: [ttsCrossword.id],
  }),
}));

// 21. Kelompok & Mentoring (Mentor Groups)
export const mentorGroup = pgTable('mentorGroup', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }),
  description: text('description'),
  mentorId: integer('mentorId').references(() => user.id, { onDelete: 'set null' }),
  coMentorId: integer('coMentorId').references(() => user.id, { onDelete: 'set null' }),
  batch: varchar('batch', { length: 100 }).default('Batch 2025/2026'),
  whatsappGroupUrl: varchar('whatsappGroupUrl', { length: 500 }),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const mentorGroupMember = pgTable('mentorGroupMember', {
  id: serial('id').primaryKey(),
  groupId: integer('groupId').references(() => mentorGroup.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('MEMBER').notNull(), // 'MEMBER' | 'LEADER'
  joinedAt: timestamp('joinedAt', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const mentorGroupRelations = relations(mentorGroup, ({ one, many }) => ({
  mentor: one(user, {
    fields: [mentorGroup.mentorId],
    references: [user.id],
    relationName: 'mentorGroup_mentor',
  }),
  coMentor: one(user, {
    fields: [mentorGroup.coMentorId],
    references: [user.id],
    relationName: 'mentorGroup_coMentor',
  }),
  members: many(mentorGroupMember),
}));

export const mentorGroupMemberRelations = relations(mentorGroupMember, ({ one }) => ({
  group: one(mentorGroup, {
    fields: [mentorGroupMember.groupId],
    references: [mentorGroup.id],
  }),
  user: one(user, {
    fields: [mentorGroupMember.userId],
    references: [user.id],
  }),
}));


