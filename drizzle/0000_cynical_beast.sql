CREATE TABLE `book` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`title` text NOT NULL,
	`finished_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `book_unique` ON `book` (`member_id`,`title`);--> statement-breakpoint
CREATE TABLE `boss_week` (
	`week_start` text PRIMARY KEY NOT NULL,
	`boss_id` integer NOT NULL,
	`hp` integer NOT NULL,
	`damage_total` real DEFAULT 0 NOT NULL,
	`defeated` integer DEFAULT false NOT NULL,
	`mvp_member_id` integer,
	`finalized_at` text
);
--> statement-breakpoint
CREATE TABLE `chest_opened` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`n` integer NOT NULL,
	`rarity` text NOT NULL,
	`reward` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chest_unique` ON `chest_opened` (`member_id`,`n`);--> statement-breakpoint
CREATE TABLE `config` (
	`id` integer PRIMARY KEY NOT NULL,
	`timezone` text DEFAULT 'Asia/Novosibirsk' NOT NULL,
	`pin_hash` text,
	`minutes` integer DEFAULT 30 NOT NULL,
	`super_minutes` integer DEFAULT 60 NOT NULL,
	`loot` text NOT NULL,
	`loot_rare` text NOT NULL,
	`loot_legend` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`name` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `habit_check` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habit_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habit`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_check_unique` ON `habit_check` (`habit_id`,`date`);--> statement-breakpoint
CREATE TABLE `hero` (
	`member_id` integer PRIMARY KEY NOT NULL,
	`cls` text DEFAULT 'w' NOT NULL,
	`cls_changed_at` text NOT NULL,
	`sub` text,
	`talents` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT '🙂' NOT NULL,
	`color` text DEFAULT '#8b5cf6' NOT NULL,
	`is_parent` integer DEFAULT false NOT NULL,
	`goal` integer DEFAULT 60 NOT NULL,
	`super_goal` integer DEFAULT 100 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quest_override` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`date` text NOT NULL,
	`items` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quest_override_unique` ON `quest_override` (`member_id`,`date`);--> statement-breakpoint
CREATE TABLE `study_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	`kind` text NOT NULL,
	`minutes` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `study_member_date` ON `study_entry` (`member_id`,`date`);--> statement-breakpoint
CREATE TABLE `warmup_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warmup_member_date` ON `warmup_entry` (`member_id`,`date`);--> statement-breakpoint
CREATE TABLE `workout_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	`minutes` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_member_date` ON `workout_entry` (`member_id`,`date`);