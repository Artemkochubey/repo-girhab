CREATE TABLE `battle_day` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`date` text NOT NULL,
	`horde_id` text NOT NULL,
	`total_hp` integer NOT NULL,
	`cleared` integer NOT NULL,
	`win` integer NOT NULL,
	`regen` integer NOT NULL,
	`hp_delta` integer NOT NULL,
	`xp` integer NOT NULL,
	`drop` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `battle_day_unique` ON `battle_day` (`member_id`,`date`);--> statement-breakpoint
CREATE TABLE `gear_equipped` (
	`member_id` integer NOT NULL,
	`slot` text NOT NULL,
	`key` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gear_equipped_slot` ON `gear_equipped` (`member_id`,`slot`);--> statement-breakpoint
CREATE UNIQUE INDEX `gear_equipped_key` ON `gear_equipped` (`member_id`,`key`);--> statement-breakpoint
ALTER TABLE `chest_opened` ADD `gear` text;--> statement-breakpoint
ALTER TABLE `config` ADD `battle_since` text;