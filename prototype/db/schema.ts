import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const authUsers = sqliteTable('auth_users', {
  id: text('id').primaryKey(), name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', {mode:'boolean'}).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at',{mode:'timestamp_ms'}).notNull(),
  updatedAt: integer('updated_at',{mode:'timestamp_ms'}).notNull(),
});
export const authSessions = sqliteTable('auth_sessions', {
  id: text('id').primaryKey(), token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(()=>authUsers.id,{onDelete:'cascade'}),
  expiresAt: integer('expires_at',{mode:'timestamp_ms'}).notNull(),
  createdAt: integer('created_at',{mode:'timestamp_ms'}).notNull(),
  updatedAt: integer('updated_at',{mode:'timestamp_ms'}).notNull(),
  ipAddress: text('ip_address'), userAgent: text('user_agent'),
},t=>[index('idx_auth_sessions_user_id').on(t.userId)]);
export const authAccounts = sqliteTable('auth_accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(), providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(()=>authUsers.id,{onDelete:'cascade'}),
  accessToken: text('access_token'), refreshToken: text('refresh_token'), idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at',{mode:'timestamp_ms'}),
  refreshTokenExpiresAt: integer('refresh_token_expires_at',{mode:'timestamp_ms'}),
  scope: text('scope'), password: text('password'),
  createdAt: integer('created_at',{mode:'timestamp_ms'}).notNull(),
  updatedAt: integer('updated_at',{mode:'timestamp_ms'}).notNull(),
},t=>[index('idx_auth_accounts_user_id').on(t.userId),uniqueIndex('idx_auth_accounts_provider_account').on(t.providerId,t.accountId)]);
export const authVerifications = sqliteTable('auth_verifications', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(),
  expiresAt: integer('expires_at',{mode:'timestamp_ms'}).notNull(),
  createdAt: integer('created_at',{mode:'timestamp_ms'}).notNull(),
  updatedAt: integer('updated_at',{mode:'timestamp_ms'}).notNull(),
},t=>[index('idx_auth_verifications_identifier').on(t.identifier)]);
export const authRateLimits = sqliteTable('auth_rate_limits', {
  id: text('id').primaryKey(), key: text('key').notNull().unique(),
  count: integer('count').notNull(), lastRequest: integer('last_request').notNull(),
});
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
