CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guest_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text,
	`revoked_at` text
);
--> statement-breakpoint
CREATE TABLE `game_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`description` text NOT NULL,
	`player_count_label` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`status` text NOT NULL,
	`room_status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`expires_at` text,
	`closed_at` text,
	`participant_count` integer NOT NULL,
	`spectator_count` integer NOT NULL,
	`durable_object_name` text
);
--> statement-breakpoint
CREATE TABLE `session_players` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` text NOT NULL,
	`left_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`invite_code_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text,
	`revoked_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `puzzle_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`puzzle_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	`move_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `puzzle_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle_session_id` text NOT NULL,
	`progress_json` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`puzzle_session_id`) REFERENCES `puzzle_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `review_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`game_id` text NOT NULL,
	`summary_json` text NOT NULL,
	`created_at` text NOT NULL
);