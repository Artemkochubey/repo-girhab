CREATE TABLE `artifact_use` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`key` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`active_for` text,
	`used_on` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artifact_use_unique` ON `artifact_use` (`member_id`,`key`);--> statement-breakpoint
CREATE TABLE `weekly_goal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`week_start` text NOT NULL,
	`kind` text NOT NULL,
	`tier` text NOT NULL,
	`target` integer NOT NULL,
	`title` text,
	`manual` integer DEFAULT false NOT NULL,
	`confirmed` integer DEFAULT false NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_goal_unique` ON `weekly_goal` (`member_id`,`week_start`);--> statement-breakpoint
ALTER TABLE `chest_opened` ADD `artifact` text;--> statement-breakpoint
ALTER TABLE `config` ADD `artifacts_since` text;