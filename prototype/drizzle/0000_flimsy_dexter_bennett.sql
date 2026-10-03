CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`nationality` text DEFAULT '' NOT NULL,
	`level` text DEFAULT '' NOT NULL,
	`field` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved_scholarships` (
	`user_id` text NOT NULL,
	`scholarship_id` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `scholarship_id`)
);
