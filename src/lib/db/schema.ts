import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ==========================================
// Sessions Table
// ==========================================
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  consentResearch: boolean('consent_research').default(false).notNull(),
  demographics: jsonb('demographics').$type<{
    ageRange?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
    industry?: string;
    leadershipRole?: boolean;
  }>(),
});

// ==========================================
// Sorts Table
// ==========================================
export const sorts = pgTable('sorts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => sessions.id, { onDelete: 'cascade' })
    .notNull(),
  valueName: text('value_name').notNull(),
  category: text('category', { enum: ['very', 'somewhat', 'less'] }).notNull(),
  sortedAt: timestamp('sorted_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// Rankings Table
// ==========================================
export const rankings = pgTable('rankings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => sessions.id, { onDelete: 'cascade' })
    .notNull(),
  valueName: text('value_name').notNull(),
  rank: integer('rank').notNull(),
});

// ==========================================
// Definitions Table
// ==========================================
export const definitions = pgTable('definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => sessions.id, { onDelete: 'cascade' })
    .notNull(),
  valueName: text('value_name').notNull(),
  rank: integer('rank').notNull(),
  rawTranscript: text('raw_transcript'),
  refinedDefinition: jsonb('refined_definition').$type<{
    tagline: string;
    definition: string;
  }>(),
  userEdited: boolean('user_edited').default(false).notNull(),
});

// ==========================================
// Profiles Table
// ==========================================
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    profileJson: jsonb('profile_json')
      .$type<{
        top3: {
          rank: number;
          valueName: string;
          tagline: string;
          definition?: string;
          behavioralAnchors?: string[];
        }[];
        createdAt: string;
      }>()
      .notNull(),
    shareSlug: text('share_slug').unique(),
  },
  (table) => ({
    shareSlugIdx: uniqueIndex('profiles_share_slug_idx').on(table.shareSlug),
  })
);

// ==========================================
// Type Exports
// ==========================================
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Sort = typeof sorts.$inferSelect;
export type NewSort = typeof sorts.$inferInsert;
export type Ranking = typeof rankings.$inferSelect;
export type NewRanking = typeof rankings.$inferInsert;
export type Definition = typeof definitions.$inferSelect;
export type NewDefinition = typeof definitions.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
