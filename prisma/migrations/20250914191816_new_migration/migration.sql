-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `refresh_token_expires_in` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Account_userId_key`(`userId`),
    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumnismallgroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `regionId` INTEGER NOT NULL,

    INDEX `AlumniSmallGroup_regionId_fkey`(`regionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approvalrequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('role_assignment', 'training', 'financial', 'group_creation', 'other') NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `requestedById` VARCHAR(191) NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `alumniGroupId` INTEGER NULL,
    `trainingsId` INTEGER NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,

    INDEX `ApprovalRequest_alumniGroupId_fkey`(`alumniGroupId`),
    INDEX `ApprovalRequest_regionId_fkey`(`regionId`),
    INDEX `ApprovalRequest_requestedById_fkey`(`requestedById`),
    INDEX `ApprovalRequest_reviewedById_fkey`(`reviewedById`),
    INDEX `ApprovalRequest_smallGroupId_fkey`(`smallGroupId`),
    INDEX `ApprovalRequest_trainingsId_fkey`(`trainingsId`),
    INDEX `ApprovalRequest_universityId_fkey`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `trainingId` INTEGER NULL,
    `permanentEventId` INTEGER NULL,
    `status` ENUM('present', 'absent', 'excused') NOT NULL DEFAULT 'present',
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,

    INDEX `Attendance_permanentEventId_fkey`(`permanentEventId`),
    INDEX `Attendance_trainingId_fkey`(`trainingId`),
    UNIQUE INDEX `Attendance_memberId_trainingId_key`(`memberId`, `trainingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditlog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authenticator` (
    `credentialID` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `credentialPublicKey` VARCHAR(191) NOT NULL,
    `counter` INTEGER NOT NULL,
    `credentialDeviceType` VARCHAR(191) NOT NULL,
    `credentialBackedUp` BOOLEAN NOT NULL,
    `transports` VARCHAR(191) NULL,

    UNIQUE INDEX `Authenticator_credentialID_key`(`credentialID`),
    PRIMARY KEY (`userId`, `credentialID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `allocatedAmount` DOUBLE NOT NULL,
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `alumniGroupId` INTEGER NULL,
    `trainingsId` INTEGER NULL,

    UNIQUE INDEX `Budget_trainingsId_key`(`trainingsId`),
    INDEX `Budget_alumniGroupId_fkey`(`alumniGroupId`),
    INDEX `Budget_regionId_fkey`(`regionId`),
    INDEX `Budget_smallGroupId_fkey`(`smallGroupId`),
    INDEX `Budget_universityId_fkey`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cells` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `sector_id` BIGINT UNSIGNED NOT NULL,

    INDEX `cells_sector_id_foreign`(`sector_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contribution` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contributorId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `method` ENUM('mobile_money', 'bank_transfer', 'card', 'worldremit') NOT NULL,
    `designationId` INTEGER NULL,
    `status` ENUM('pending', 'completed', 'failed', 'refunded', 'processing', 'cancelled') NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `paymentTransactionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `memberId` INTEGER NULL,

    UNIQUE INDEX `Contribution_transactionId_key`(`transactionId`),
    INDEX `Contribution_contributorId_fkey`(`contributorId`),
    INDEX `Contribution_designationId_fkey`(`designationId`),
    INDEX `Contribution_memberId_fkey`(`memberId`),
    INDEX `Contribution_paymentTransactionId_fkey`(`paymentTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contributiondesignation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `targetAmount` DOUBLE NULL,
    `currentAmount` DOUBLE NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContributionDesignation_name_key`(`name`),
    INDEX `ContributionDesignation_regionId_fkey`(`regionId`),
    INDEX `ContributionDesignation_smallGroupId_fkey`(`smallGroupId`),
    INDEX `ContributionDesignation_universityId_fkey`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contributionreceipt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contributionId` INTEGER NOT NULL,
    `receiptNumber` VARCHAR(191) NOT NULL,
    `pdfPath` VARCHAR(191) NULL,
    `emailSent` BOOLEAN NOT NULL DEFAULT false,
    `emailSentAt` DATETIME(3) NULL,
    `smsSent` BOOLEAN NOT NULL DEFAULT false,
    `smsSentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ContributionReceipt_contributionId_key`(`contributionId`),
    UNIQUE INDEX `ContributionReceipt_receiptNumber_key`(`receiptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contributor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `memberId` INTEGER NULL,

    UNIQUE INDEX `Contributor_email_key`(`email`),
    UNIQUE INDEX `Contributor_memberId_key`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `province_id` BIGINT UNSIGNED NOT NULL,

    INDEX `districts_province_id_foreign`(`province_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `url` VARCHAR(191) NOT NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `alumniGroupId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Document_alumniGroupId_fkey`(`alumniGroupId`),
    INDEX `Document_regionId_fkey`(`regionId`),
    INDEX `Document_smallGroupId_fkey`(`smallGroupId`),
    INDEX `Document_universityId_fkey`(`universityId`),
    INDEX `Document_uploadedById_fkey`(`uploadedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstname` VARCHAR(191) NULL,
    `secondname` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `birthdate` DATETIME(3) NULL,
    `placeOfBirthDistrict` VARCHAR(191) NULL,
    `placeOfBirthSector` VARCHAR(191) NULL,
    `placeOfBirthCell` VARCHAR(191) NULL,
    `placeOfBirthVillage` VARCHAR(191) NULL,
    `localChurch` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `type` ENUM('student', 'graduate', 'staff', 'volunteer', 'alumni') NOT NULL,
    `status` ENUM('active', 'pre_graduate', 'graduate', 'alumni', 'inactive') NOT NULL DEFAULT 'active',
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `alumniGroupId` INTEGER NULL,
    `graduationDate` DATETIME(3) NULL,
    `faculty` VARCHAR(191) NULL,
    `professionalism` VARCHAR(191) NULL,
    `maritalStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Member_email_key`(`email`),
    INDEX `Member_alumniGroupId_fkey`(`alumniGroupId`),
    INDEX `Member_regionId_fkey`(`regionId`),
    INDEX `Member_smallGroupId_fkey`(`smallGroupId`),
    INDEX `Member_universityId_fkey`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `fromGroupId` INTEGER NULL,
    `toGroupId` INTEGER NULL,
    `fromLocation` VARCHAR(191) NULL,
    `toLocation` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `movedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Movement_memberId_fkey`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NULL,
    `type` ENUM('email', 'sms', 'in_app') NOT NULL,
    `subject` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `status` ENUM('sent', 'pending', 'failed') NOT NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paymentgateway` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `configuration` LONGTEXT NOT NULL,
    `supportedMethods` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentGateway_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paymenttransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(191) NOT NULL,
    `gatewayId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'RWF',
    `phoneNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `payerName` VARCHAR(191) NULL,
    `status` ENUM('initiated', 'processing', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'initiated',
    `gatewayResponse` LONGTEXT NULL,
    `failureReason` VARCHAR(191) NULL,
    `webhookVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentTransaction_externalId_key`(`externalId`),
    INDEX `PaymentTransaction_gatewayId_fkey`(`gatewayId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permanentministryevent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('bible_study', 'discipleship', 'evangelism', 'cell_meeting', 'alumni_meeting', 'other') NOT NULL,
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `alumniGroupId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PermanentMinistryEvent_alumniGroupId_fkey`(`alumniGroupId`),
    INDEX `PermanentMinistryEvent_regionId_fkey`(`regionId`),
    INDEX `PermanentMinistryEvent_smallGroupId_fkey`(`smallGroupId`),
    INDEX `PermanentMinistryEvent_universityId_fkey`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provinces` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `region` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Region_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sectors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `district_id` BIGINT UNSIGNED NOT NULL,

    INDEX `sectors_district_id_foreign`(`district_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smallgroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `universityId` INTEGER NOT NULL,
    `regionId` INTEGER NOT NULL,

    INDEX `SmallGroup_regionId_fkey`(`regionId`),
    INDEX `SmallGroup_universityId_fkey`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staffprofile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `position` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `mentorship` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `StaffProfile_memberId_key`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `endDateTime` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `alumniGroupId` INTEGER NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Trainings_alumniGroupId_fkey`(`alumniGroupId`),
    INDEX `Trainings_createdById_fkey`(`createdById`),
    INDEX `Trainings_regionId_fkey`(`regionId`),
    INDEX `Trainings_smallGroupId_fkey`(`smallGroupId`),
    INDEX `Trainings_universityId_fkey`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `university` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `regionId` INTEGER NOT NULL,

    INDEX `University_regionId_fkey`(`regionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `password` VARCHAR(191) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userrole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `regionId` INTEGER NULL,
    `universityId` INTEGER NULL,
    `smallGroupId` INTEGER NULL,
    `alumniGroupId` INTEGER NULL,
    `scope` ENUM('superadmin', 'national', 'region', 'university', 'smallgroup', 'alumnismallgroup') NOT NULL DEFAULT 'superadmin',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `userrole_alumniGroupId_idx`(`alumniGroupId`),
    INDEX `userrole_regionId_idx`(`regionId`),
    INDEX `userrole_smallGroupId_idx`(`smallGroupId`),
    INDEX `userrole_universityId_idx`(`universityId`),
    INDEX `userrole_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verificationtoken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `villages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cell_id` BIGINT UNSIGNED NOT NULL,

    INDEX `villages_cell_id_foreign`(`cell_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `volunteerprofile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `skills` VARCHAR(191) NULL,
    `hours` INTEGER NOT NULL DEFAULT 0,
    `commitmentLevel` VARCHAR(191) NULL,
    `onboardingDate` DATETIME(3) NULL,
    `exitDate` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `VolunteerProfile_memberId_key`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumnismallgroup` ADD CONSTRAINT `AlumniSmallGroup_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvalrequest` ADD CONSTRAINT `ApprovalRequest_alumniGroupId_fkey` FOREIGN KEY (`alumniGroupId`) REFERENCES `alumnismallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvalrequest` ADD CONSTRAINT `ApprovalRequest_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvalrequest` ADD CONSTRAINT `ApprovalRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvalrequest` ADD CONSTRAINT `ApprovalRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvalrequest` ADD CONSTRAINT `ApprovalRequest_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvalrequest` ADD CONSTRAINT `ApprovalRequest_trainingsId_fkey` FOREIGN KEY (`trainingsId`) REFERENCES `trainings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvalrequest` ADD CONSTRAINT `ApprovalRequest_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_permanentEventId_fkey` FOREIGN KEY (`permanentEventId`) REFERENCES `permanentministryevent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `trainings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authenticator` ADD CONSTRAINT `Authenticator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `Budget_alumniGroupId_fkey` FOREIGN KEY (`alumniGroupId`) REFERENCES `alumnismallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `Budget_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `Budget_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `Budget_trainingsId_fkey` FOREIGN KEY (`trainingsId`) REFERENCES `trainings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget` ADD CONSTRAINT `Budget_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cells` ADD CONSTRAINT `cells_sector_id_foreign` FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `contribution` ADD CONSTRAINT `Contribution_contributorId_fkey` FOREIGN KEY (`contributorId`) REFERENCES `contributor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution` ADD CONSTRAINT `Contribution_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `contributiondesignation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution` ADD CONSTRAINT `Contribution_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution` ADD CONSTRAINT `Contribution_paymentTransactionId_fkey` FOREIGN KEY (`paymentTransactionId`) REFERENCES `paymenttransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contributiondesignation` ADD CONSTRAINT `ContributionDesignation_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contributiondesignation` ADD CONSTRAINT `ContributionDesignation_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contributiondesignation` ADD CONSTRAINT `ContributionDesignation_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contributionreceipt` ADD CONSTRAINT `ContributionReceipt_contributionId_fkey` FOREIGN KEY (`contributionId`) REFERENCES `contribution`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contributor` ADD CONSTRAINT `Contributor_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `districts` ADD CONSTRAINT `districts_province_id_foreign` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `document` ADD CONSTRAINT `Document_alumniGroupId_fkey` FOREIGN KEY (`alumniGroupId`) REFERENCES `alumnismallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document` ADD CONSTRAINT `Document_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document` ADD CONSTRAINT `Document_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document` ADD CONSTRAINT `Document_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document` ADD CONSTRAINT `Document_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member` ADD CONSTRAINT `Member_alumniGroupId_fkey` FOREIGN KEY (`alumniGroupId`) REFERENCES `alumnismallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member` ADD CONSTRAINT `Member_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member` ADD CONSTRAINT `Member_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member` ADD CONSTRAINT `Member_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement` ADD CONSTRAINT `Movement_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paymenttransaction` ADD CONSTRAINT `PaymentTransaction_gatewayId_fkey` FOREIGN KEY (`gatewayId`) REFERENCES `paymentgateway`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permanentministryevent` ADD CONSTRAINT `PermanentMinistryEvent_alumniGroupId_fkey` FOREIGN KEY (`alumniGroupId`) REFERENCES `alumnismallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permanentministryevent` ADD CONSTRAINT `PermanentMinistryEvent_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permanentministryevent` ADD CONSTRAINT `PermanentMinistryEvent_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permanentministryevent` ADD CONSTRAINT `PermanentMinistryEvent_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sectors` ADD CONSTRAINT `sectors_district_id_foreign` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `smallgroup` ADD CONSTRAINT `SmallGroup_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `smallgroup` ADD CONSTRAINT `SmallGroup_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffprofile` ADD CONSTRAINT `StaffProfile_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `Trainings_alumniGroupId_fkey` FOREIGN KEY (`alumniGroupId`) REFERENCES `alumnismallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `Trainings_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `Trainings_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `Trainings_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `Trainings_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `university` ADD CONSTRAINT `University_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userrole` ADD CONSTRAINT `userrole_alumniGroupId_fkey` FOREIGN KEY (`alumniGroupId`) REFERENCES `alumnismallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userrole` ADD CONSTRAINT `userrole_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userrole` ADD CONSTRAINT `userrole_smallGroupId_fkey` FOREIGN KEY (`smallGroupId`) REFERENCES `smallgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userrole` ADD CONSTRAINT `userrole_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `university`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userrole` ADD CONSTRAINT `userrole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `villages` ADD CONSTRAINT `villages_cell_id_foreign` FOREIGN KEY (`cell_id`) REFERENCES `cells`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `volunteerprofile` ADD CONSTRAINT `VolunteerProfile_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
