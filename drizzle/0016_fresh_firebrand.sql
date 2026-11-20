CREATE TABLE `deed_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	`kind` text NOT NULL,
	`note` text,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deed_member_date` ON `deed_entry` (`member_id`,`date`);