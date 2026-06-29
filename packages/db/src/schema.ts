export const schemaDraftTables = [
  'users',
  'guest_sessions',
  'game_catalog',
  'game_sessions',
  'session_players',
  'session_invites',
  'puzzle_instances',
  'puzzle_progress',
  'match_results',
  'review_summaries'
] as const;

export type SchemaDraftTable = typeof schemaDraftTables[number];
