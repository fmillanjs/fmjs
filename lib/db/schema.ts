import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const updates = pgTable('updates', {
  id: serial('id').primaryKey(),
  time: text('time').notNull(), // e.g., "6:00 AM"
  content: text('content').notNull(),
  date: text('date').notNull(), // e.g., "Oct 12, 2025"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo').notNull(), // emoji or image URL
  revenue: text('revenue'), // e.g., "$100/mo"
  description: text('description').notNull(),
  link: text('link'),
  status: text('status').notNull().default('building'), // 'building', 'live', 'paused'
  daysToComplete: integer('days_to_complete').default(2),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const profile = pgTable('profile', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  tagline: text('tagline').notNull(),
  profileImage: text('profile_image'),
  twitterUrl: text('twitter_url'),
  githubUrl: text('github_url'),
  startDate: text('start_date').notNull(), // Date when you started building
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
