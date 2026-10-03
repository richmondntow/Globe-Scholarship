import { pgTable, text, integer, bigint, boolean, timestamp, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey(), name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at',{withTimezone:true,mode:'date'}).notNull(),
  updatedAt: timestamp('updated_at',{withTimezone:true,mode:'date'}).notNull(),
});
export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(), token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(()=>authUsers.id,{onDelete:'cascade'}),
  expiresAt: timestamp('expires_at',{withTimezone:true,mode:'date'}).notNull(),
  createdAt: timestamp('created_at',{withTimezone:true,mode:'date'}).notNull(),
  updatedAt: timestamp('updated_at',{withTimezone:true,mode:'date'}).notNull(),
  ipAddress: text('ip_address'), userAgent: text('user_agent'),
},t=>[index('idx_auth_sessions_user_id').on(t.userId)]);
export const authAccounts = pgTable('auth_accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(), providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(()=>authUsers.id,{onDelete:'cascade'}),
  accessToken: text('access_token'), refreshToken: text('refresh_token'), idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at',{withTimezone:true,mode:'date'}),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at',{withTimezone:true,mode:'date'}),
  scope: text('scope'), password: text('password'),
  createdAt: timestamp('created_at',{withTimezone:true,mode:'date'}).notNull(),
  updatedAt: timestamp('updated_at',{withTimezone:true,mode:'date'}).notNull(),
},t=>[index('idx_auth_accounts_user_id').on(t.userId),uniqueIndex('idx_auth_accounts_provider_account').on(t.providerId,t.accountId)]);
export const authVerifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(),
  expiresAt: timestamp('expires_at',{withTimezone:true,mode:'date'}).notNull(),
  createdAt: timestamp('created_at',{withTimezone:true,mode:'date'}).notNull(),
  updatedAt: timestamp('updated_at',{withTimezone:true,mode:'date'}).notNull(),
},t=>[index('idx_auth_verifications_identifier').on(t.identifier)]);
export const authRateLimits = pgTable('auth_rate_limits', {
  id: text('id').primaryKey(), key: text('key').notNull().unique(),
  count: integer('count').notNull(), lastRequest: bigint('last_request',{mode:'number'}).notNull(),
});
export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey().references(()=>authUsers.id,{onDelete:'cascade'}), name: text('name').notNull(),
  nationality: text('nationality').notNull().default(''),
  level: text('level').notNull().default(''), field: text('field').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
});
export const savedScholarships = pgTable('saved_scholarships', {
  userId: text('user_id').notNull().references(()=>authUsers.id,{onDelete:'cascade'}), scholarshipId: text('scholarship_id').notNull(),
  savedAt: text('saved_at').notNull(),
}, t => [primaryKey({columns:[t.userId,t.scholarshipId]})]);
