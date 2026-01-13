CREATE TABLE `game_scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`story_type` text NOT NULL,
	`dm_system_prompt` text NOT NULL,
	`writer_system_prompt` text NOT NULL,
	`visual_style_prompt` text NOT NULL,
	`model_config` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`parent_id` text,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	`slot_id` integer DEFAULT 0,
	`is_active_path` integer DEFAULT true NOT NULL,
	`chapter_number` integer,
	`render_data` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_path_idx` ON `messages` (`game_id`,`is_active_path`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `messages` (`parent_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scenario_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`slot_index` integer,
	`current_chapter` integer DEFAULT 1 NOT NULL,
	`current_volume` integer DEFAULT 1 NOT NULL,
	`story_metadata` text,
	`book_metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scenario_id`) REFERENCES `game_scenarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "user_id", "scenario_id", "title", "status", "slot_index", "current_chapter", "current_volume", "story_metadata", "book_metadata", "created_at", "completed_at") SELECT "id", "user_id", "scenario_id", "title", "status", "slot_index", "current_chapter", "current_volume", "story_metadata", "book_metadata", "created_at", "completed_at" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
PRAGMA foreign_keys=ON;