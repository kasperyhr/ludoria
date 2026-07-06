import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

function nowIso() {
  return new Date().toISOString();
}

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => nowIso()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => nowIso()),
});

export const guestSessions = sqliteTable("guest_sessions", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => nowIso()),
  expiresAt: text("expires_at"),
  revokedAt: text("revoked_at"),
});

export const gameCatalog = sqliteTable("game_catalog", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mode: text("mode", { enum: ["multiplayer", "solo"] }).notNull(),
  status: text("status", { enum: ["planned", "preview", "available"] }).notNull(),
  description: text("description").notNull().$defaultFn(() => ""),
  playerCountLabel: text("player_count_label").notNull().$defaultFn(() => ""),
  createdAt: text("created_at").notNull().$defaultFn(() => nowIso()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => nowIso()),
}, (table) => [
  index("idx_game_catalog_mode").on(table.mode),
  index("idx_game_catalog_status").on(table.status),
]);

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  status: text("status", { enum: ["active", "idle_checking", "closed", "abandoned"] }).notNull().$defaultFn(() => "active"),
  roomStatus: text("room_status", { enum: ["active", "idle_checking", "closed", "abandoned"] }).notNull().$defaultFn(() => "active"),
  createdAt: text("created_at").notNull().$defaultFn(() => nowIso()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => nowIso()),
  expiresAt: text("expires_at"),
  closedAt: text("closed_at"),
  participantCount: integer("participant_count").notNull().$defaultFn(() => 0),
  spectatorCount: integer("spectator_count").notNull().$defaultFn(() => 0),
  durableObjectName: text("durable_object_name"),
}, (table) => [
  index("idx_game_sessions_game_id").on(table.gameId),
  index("idx_game_sessions_status").on(table.status),
  index("idx_game_sessions_room_status").on(table.roomStatus),
]);

export const sessionPlayers = sqliteTable("session_players", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => gameSessions.id),
  actorId: text("actor_id").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["player", "spectator"] }).notNull(),
  joinedAt: text("joined_at").notNull().$defaultFn(() => nowIso()),
  leftAt: text("left_at"),
}, (table) => [
  index("idx_session_players_session_id").on(table.sessionId),
  index("idx_session_players_actor_id").on(table.actorId),
]);

export const sessionInvites = sqliteTable("session_invites", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => gameSessions.id),
  inviteCodeHash: text("invite_code_hash").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => nowIso()),
  expiresAt: text("expires_at"),
  revokedAt: text("revoked_at"),
}, (table) => [
  index("idx_session_invites_session_id").on(table.sessionId),
]);

export const puzzleSessions = sqliteTable("puzzle_sessions", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  puzzleId: text("puzzle_id").notNull(),
  status: text("status", { enum: ["active", "completed", "abandoned"] }).notNull().$defaultFn(() => "active"),
  createdAt: text("created_at").notNull().$defaultFn(() => nowIso()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => nowIso()),
  completedAt: text("completed_at"),
  moveCount: integer("move_count").notNull().$defaultFn(() => 0),
}, (table) => [
  index("idx_puzzle_sessions_game_id").on(table.gameId),
  index("idx_puzzle_sessions_status").on(table.status),
]);

export const puzzleProgress = sqliteTable("puzzle_progress", {
  id: text("id").primaryKey(),
  puzzleSessionId: text("puzzle_session_id").notNull().references(() => puzzleSessions.id),
  progressJson: text("progress_json").notNull().$defaultFn(() => "{}"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => nowIso()),
}, (table) => [
  index("idx_puzzle_progress_session_id").on(table.puzzleSessionId),
]);

export const reviewSummaries = sqliteTable("review_summaries", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  gameId: text("game_id").notNull(),
  summaryJson: text("summary_json").notNull().$defaultFn(() => "{}"),
  createdAt: text("created_at").notNull().$defaultFn(() => nowIso()),
}, (table) => [
  index("idx_review_summaries_session_id").on(table.sessionId),
]);
