CREATE TABLE `day_seen` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_id` integer NOT NULL,
	`by_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`target_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`by_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_seen_unique` ON `day_seen` (`target_id`,`by_id`,`date`);--> statement-breakpoint
CREATE TABLE `month_goal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`title` text NOT NULL,
	`emoji` text DEFAULT '🏕' NOT NULL,
	`kind` text NOT NULL,
	`target` integer NOT NULL,
	`reward` text DEFAULT '' NOT NULL,
	`given` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `month_goal_unique` ON `month_goal` (`month`);--> statement-breakpoint
ALTER TABLE `chest_opened` ADD `holder` integer;--> statement-breakpoint
ALTER TABLE `member` ADD `simple` integer DEFAULT false NOT NULL;