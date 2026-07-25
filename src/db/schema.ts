import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (Firebase Auth linked via uid)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('candidate'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Jobs table
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  type: text('type').notNull(),
  salary: text('salary'),
  description: text('description').notNull(),
  requirements: text('requirements'),
  department: text('department'),
  postedAt: timestamp('posted_at').defaultNow(),
});

// Job Applications table
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id),
  userId: integer('user_id').references(() => users.id),
  candidateName: text('candidate_name').notNull(),
  candidateEmail: text('candidate_email').notNull(),
  matchScore: integer('match_score').default(0),
  status: text('status').default('Applied'),
  resumeUrl: text('resume_url'),
  driveFileId: text('drive_file_id'),
  appliedAt: timestamp('applied_at').defaultNow(),
});

// Chat Activity / Messages log
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  senderName: text('sender_name').notNull(),
  text: text('text').notNull(),
  spaceName: text('space_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  chatMessages: many(chatMessages),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  applicant: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));
