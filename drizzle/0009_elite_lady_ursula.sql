CREATE TABLE `review_ok` (
	`member_id` integer NOT NULL,
	`date` text NOT NULL,
	`points` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_ok_unique` ON `review_ok` (`member_id`,`date`);