CREATE INDEX `idx_game_catalog_mode` ON `game_catalog` (`mode`);--> statement-breakpoint
CREATE INDEX `idx_game_catalog_status` ON `game_catalog` (`status`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_game_id` ON `game_sessions` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_status` ON `game_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_room_status` ON `game_sessions` (`room_status`);--> statement-breakpoint
CREATE INDEX `idx_puzzle_progress_session_id` ON `puzzle_progress` (`puzzle_session_id`);--> statement-breakpoint
CREATE INDEX `idx_puzzle_sessions_game_id` ON `puzzle_sessions` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_puzzle_sessions_status` ON `puzzle_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_review_summaries_session_id` ON `review_summaries` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_session_invites_session_id` ON `session_invites` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_session_players_session_id` ON `session_players` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_session_players_actor_id` ON `session_players` (`actor_id`);