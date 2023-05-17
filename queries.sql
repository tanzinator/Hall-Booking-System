
CREATE TABLE `venues`
(
  `venue_id` int(11) NOT NULL AUTO_INCREMENT,
  `venue_name` text,
  `venue_price`  double DEFAULT NULL,
  `venue_image` text,
  `venue_description` text,
  `visibility` text,
  `miscellaneous` text,
  `additional_field` text,
  `venue_creation_date` date,
  PRIMARY KEY(`venue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `venue_bookings`
(
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` double DEFAULT NULL,
  `first_name`  text,
  `last_name`  text,
  `email` text,
  `aadhar` text,
  `pan` text,
  `billing_address` text,
  `gstin` text,
  `venue_name` text,
  `occasion_type` text,
  `original_amount` double DEFAULT NULL,
  `approved_amount` double DEFAULT NULL,
  `discount` double DEFAULT NULL,
  `approved_by` text,
  `booking_date` date,
  `booking_status` text,
  `discount_recommended_by` text
  PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `venue_bookings` ADD `mobile_number` text;




  insert into venues values(1,'Babu Naik Hall',40000 ,'hall1.jpg','1st Floor AC Hall with capacity of 500
                            chairs, Ground Floor for Dining Non AC with 150 chairs.','active', 'Generator Backup, Veg/Non-Veg','','2020-06-25');
  insert into venues values(2,'Mandir Hall',5000,'hall2.jpg','Ground floor of temple with 150 chairs','active','Non AC, No Generator, Packing facility common','', '2020-06-25');


CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` text,
  `password` text,
  `active` text,
  `role_name` text,
  `user_creation_date` date,
   PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into user values(1,'amonkar.tanay6@gmail.com', '$2b$10$fpv5KiY4nRfJfqvm7KIdmuxeKL36fn3nPpJwRLoiV74DpXjFtLEw2', 'YES', 'trustee','2020-06-25')


CREATE TABLE `approval_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` text,
  `booking_id` text,
  `venue_name` text,
  `from_state` text,
  `to_state` text,
  `approval_type` text,
  `approval_date` date,
   PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `venue_blockings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venue_name` text,
  `from_date` date,
  `to_date` date,
  `requested_by` text,
  `approved_by` text,
  `reason` text,
  `approval_status` text,
  `blocking_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `cash_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` double DEFAULT NULL,
  `customer_name` text,
  `received_by` text,
  `received_from` text,
  `executed_by` text,
  `approved_amount` double DEFAULT NULL,
  `reference_no` text,
  `cash_payment_date` date,
   PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `adhoc_requests`
(
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name`  text,
  `last_name`  text,
  `email` text,
  `billing_address` text,
  `venue_name` text,
  `occasion_type` text,
  `booking_date` date,
  `booking_status` text,
  `request_submitted_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `adhoc_requests` ADD `mobile_number` text;

/*
Approval States

Awaiting Approval        
A1
A2
Paid
Awaiting Cancellation Approval
Cancelled

Awaiting Approval
A2
AD2
Paid

Awaiting Approval
ABL
Paid
*/