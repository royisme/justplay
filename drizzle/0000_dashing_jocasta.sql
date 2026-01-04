CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`story_type` text NOT NULL,
	`writing_style` text,
	`author` text,
	`title` text,
	`story_map` text,
	`story_history` text DEFAULT '[]',
	`current_scene_json` text,
	`current_node_id` text DEFAULT 'start' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
