CREATE TABLE `day_mvp` (
	`date` text PRIMARY KEY NOT NULL,
	`member_id` integer NOT NULL,
	`points` real NOT NULL,
	`ratio` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `config` ADD `mvp_since` text;