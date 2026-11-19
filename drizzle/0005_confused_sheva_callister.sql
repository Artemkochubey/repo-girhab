CREATE TABLE `family_quest` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`xp` integer NOT NULL,
	`kind` text DEFAULT 'manual' NOT NULL,
	`target` integer DEFAULT 0 NOT NULL,
	`period` text DEFAULT 'day' NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`done_date` text,
	`created_at` text NOT NULL
);
