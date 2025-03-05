-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `resCustomerPhone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tables` MODIFY `tabCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
