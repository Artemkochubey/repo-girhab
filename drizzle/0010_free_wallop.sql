ALTER TABLE `chest_opened` ADD `status` text DEFAULT 'bag' NOT NULL;--> statement-breakpoint
ALTER TABLE `chest_opened` ADD `delivered_on` text;