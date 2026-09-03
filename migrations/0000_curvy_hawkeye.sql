CREATE TABLE `work_centers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`account_code` text NOT NULL,
	`us_billing_code` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_centers_code_unique` ON `work_centers` (`code`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_no` text NOT NULL,
	`name` text NOT NULL,
	`employment_type` text NOT NULL,
	`work_center_id` integer NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`base_salary` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`work_center_id`) REFERENCES `work_centers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_no_unique` ON `employees` (`employee_no`);--> statement-breakpoint
CREATE TABLE `payroll_periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year_month` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer NOT NULL,
	`finalized_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payroll_periods_year_month_unique` ON `payroll_periods` (`year_month`);--> statement-breakpoint
CREATE TABLE `attendance_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`regular_hours` real DEFAULT 0 NOT NULL,
	`overtime_hours` real DEFAULT 0 NOT NULL,
	`night_hours` real DEFAULT 0 NOT NULL,
	`holiday_hours` real DEFAULT 0 NOT NULL,
	`is_anomalous` integer DEFAULT false NOT NULL,
	`anomaly_details` text,
	`adjustment_reason` text,
	FOREIGN KEY (`period_id`) REFERENCES `payroll_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `insurance_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`national_pension` real DEFAULT 0 NOT NULL,
	`health_insurance` real DEFAULT 0 NOT NULL,
	`long_term_care` real DEFAULT 0 NOT NULL,
	`employment_insurance` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`period_id`) REFERENCES `payroll_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`work_center_id` integer NOT NULL,
	`gross_pay` real NOT NULL,
	`base_pay` real NOT NULL,
	`overtime_allowance` real DEFAULT 0 NOT NULL,
	`meal_allowance` real DEFAULT 0 NOT NULL,
	`total_deductions` real DEFAULT 0 NOT NULL,
	`net_pay` real NOT NULL,
	`us_billing_amount` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`period_id`) REFERENCES `payroll_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_center_id`) REFERENCES `work_centers`(`id`) ON UPDATE no action ON DELETE no action
);
