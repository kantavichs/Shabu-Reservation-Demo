-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `tables` MODIFY `tabCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE `TempToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resID` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TempToken_resID_key`(`resID`),
    UNIQUE INDEX `TempToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TempToken` ADD CONSTRAINT `TempToken_resID_fkey` FOREIGN KEY (`resID`) REFERENCES `Reservations`(`resID`) ON DELETE RESTRICT ON UPDATE CASCADE;
