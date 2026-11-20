CREATE TABLE `chest_grant` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`count` integer NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`date` text NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `day_task` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`title` text NOT NULL,
	`emoji` text DEFAULT '📌' NOT NULL,
	`repeat` text DEFAULT 'daily' NOT NULL,
	`days` text NOT NULL,
	`date` text,
	`from_date` text NOT NULL,
	`until_date` text,
	`points` integer DEFAULT 0 NOT NULL,
	`chests` integer DEFAULT 0 NOT NULL,
	`need_confirm` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `day_task_member` ON `day_task` (`member_id`);--> statement-breakpoint
CREATE TABLE `task_done` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`date` text NOT NULL,
	`confirmed` integer DEFAULT true NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `day_task`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_done_unique` ON `task_done` (`task_id`,`date`);