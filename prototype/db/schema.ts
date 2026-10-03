import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {
  userId: text('user_id').primaryKey(), name: text('name').notNull(),
  nationality: text('nationality').notNull().default(''),
  level: text('level').notNull().default(''), field: text('field').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
});
export const savedScholarships = sqliteTable('saved_scholarships', {
  userId: text('user_id').notNull(), scholarshipId: text('scholarship_id').notNull(),
  savedAt: text('saved_at').notNull(),
}, t => [primaryKey({columns:[t.userId,t.scholarshipId]})]);
