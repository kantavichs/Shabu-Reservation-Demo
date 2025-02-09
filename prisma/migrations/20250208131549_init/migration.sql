-- CreateTable
CREATE TABLE `Customer` (
    `customerID` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `CustomerEmail` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `cusCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`customerID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tables` (
    `tabID` INTEGER NOT NULL AUTO_INCREMENT,
    `tabTypes` VARCHAR(191) NOT NULL,
    `tabStatus` VARCHAR(191) NULL,
    `tabCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`tabID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservations` (
    `resID` INTEGER NOT NULL AUTO_INCREMENT,
    `resName` VARCHAR(191) NOT NULL,
    `resDate` VARCHAR(191) NOT NULL,
    `resTime` VARCHAR(191) NOT NULL,
    `numberOfPeople` INTEGER NOT NULL,
    `resStatus` VARCHAR(191) NULL,
    `resCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Customer_customerID` INTEGER NOT NULL,
    `Tables_tabID` INTEGER NOT NULL,

    PRIMARY KEY (`resID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `empID` INTEGER NOT NULL AUTO_INCREMENT,
    `empFname` VARCHAR(191) NOT NULL,
    `empLname` VARCHAR(191) NOT NULL,
    `empPhone` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `salary` DOUBLE NOT NULL,

    PRIMARY KEY (`empID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orders` (
    `orderID` INTEGER NOT NULL AUTO_INCREMENT,
    `orderStatus` VARCHAR(191) NULL,
    `orderCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Tables_tabID` INTEGER NOT NULL,
    `Employee_empID` INTEGER NOT NULL,

    PRIMARY KEY (`orderID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuffetTypes` (
    `buffetTypeID` INTEGER NOT NULL AUTO_INCREMENT,
    `buffetTypePrice` INTEGER NOT NULL,
    `buffetTypesName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `BuffetTypes_buffetTypesName_key`(`buffetTypesName`),
    PRIMARY KEY (`buffetTypeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuItems` (
    `menuItemsID` INTEGER NOT NULL AUTO_INCREMENT,
    `menuItemNameTHA` VARCHAR(191) NOT NULL,
    `menuItemNameENG` VARCHAR(191) NOT NULL,
    `menuItemsPrice` INTEGER NOT NULL,
    `itemImage` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `menuItemCreateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `category` VARCHAR(191) NOT NULL,
    `BuffetTypes_buffetTypeID` INTEGER NOT NULL,

    PRIMARY KEY (`menuItemsID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orderItem` (
    `Orders_orderID` INTEGER NOT NULL,
    `MenuItems_menuItemsID` INTEGER NOT NULL,
    `Quantity` INTEGER NOT NULL,

    PRIMARY KEY (`Orders_orderID`, `MenuItems_menuItemsID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bill` (
    `billID` INTEGER NOT NULL AUTO_INCREMENT,
    `vat` INTEGER NOT NULL,
    `paymentStatus` VARCHAR(191) NULL,
    `netAmount` DOUBLE NOT NULL,
    `grandTotal` DOUBLE NOT NULL,
    `discount` DOUBLE NULL,
    `totalAmount` DOUBLE NOT NULL,
    `billCreateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `billStatus` VARCHAR(191) NOT NULL,
    `Orders_orderID` INTEGER NOT NULL,

    UNIQUE INDEX `Bill_Orders_orderID_key`(`Orders_orderID`),
    PRIMARY KEY (`billID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `paymentID` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentTypes` VARCHAR(191) NULL,
    `totalAmount` DOUBLE NOT NULL,
    `Bill_billID` INTEGER NOT NULL,

    UNIQUE INDEX `Payment_Bill_billID_key`(`Bill_billID`),
    PRIMARY KEY (`paymentID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stock` (
    `stockID` INTEGER NOT NULL AUTO_INCREMENT,
    `ingredientName` VARCHAR(191) NOT NULL,
    `costPrice` DOUBLE NOT NULL,
    `Unit` VARCHAR(191) NOT NULL,
    `Quantity` DOUBLE NOT NULL DEFAULT 0,
    `LastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Stock_ingredientName_key`(`ingredientName`),
    PRIMARY KEY (`stockID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeScription` (
    `Employee_empID` INTEGER NOT NULL,
    `Stock_stockID` INTEGER NOT NULL,
    `tsCreatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Unit` VARCHAR(191) NULL,
    `Quantity` DOUBLE NULL,

    PRIMARY KEY (`Employee_empID`, `Stock_stockID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stock_In` (
    `stockInID` INTEGER NOT NULL AUTO_INCREMENT,
    `stockInDateTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalPrice` DOUBLE NOT NULL,
    `Employee_empID` INTEGER NOT NULL,

    PRIMARY KEY (`stockInID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stock_In_Detail` (
    `stockInDetailID` INTEGER NOT NULL AUTO_INCREMENT,
    `ingredientName` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `pricePerUnit` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `Stock_In_stockInID` INTEGER NOT NULL,
    `Stock_stockID` INTEGER NOT NULL,

    PRIMARY KEY (`stockInDetailID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reservations` ADD CONSTRAINT `Reservations_Customer_customerID_fkey` FOREIGN KEY (`Customer_customerID`) REFERENCES `Customer`(`customerID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservations` ADD CONSTRAINT `Reservations_Tables_tabID_fkey` FOREIGN KEY (`Tables_tabID`) REFERENCES `Tables`(`tabID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orders` ADD CONSTRAINT `Orders_Tables_tabID_fkey` FOREIGN KEY (`Tables_tabID`) REFERENCES `Tables`(`tabID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orders` ADD CONSTRAINT `Orders_Employee_empID_fkey` FOREIGN KEY (`Employee_empID`) REFERENCES `Employee`(`empID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItems` ADD CONSTRAINT `MenuItems_BuffetTypes_buffetTypeID_fkey` FOREIGN KEY (`BuffetTypes_buffetTypeID`) REFERENCES `BuffetTypes`(`buffetTypeID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_Orders_orderID_fkey` FOREIGN KEY (`Orders_orderID`) REFERENCES `Orders`(`orderID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_MenuItems_menuItemsID_fkey` FOREIGN KEY (`MenuItems_menuItemsID`) REFERENCES `MenuItems`(`menuItemsID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_Orders_orderID_fkey` FOREIGN KEY (`Orders_orderID`) REFERENCES `Orders`(`orderID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_Bill_billID_fkey` FOREIGN KEY (`Bill_billID`) REFERENCES `Bill`(`billID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeScription` ADD CONSTRAINT `TimeScription_Employee_empID_fkey` FOREIGN KEY (`Employee_empID`) REFERENCES `Employee`(`empID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeScription` ADD CONSTRAINT `TimeScription_Stock_stockID_fkey` FOREIGN KEY (`Stock_stockID`) REFERENCES `Stock`(`stockID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock_In` ADD CONSTRAINT `Stock_In_Employee_empID_fkey` FOREIGN KEY (`Employee_empID`) REFERENCES `Employee`(`empID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock_In_Detail` ADD CONSTRAINT `Stock_In_Detail_Stock_In_stockInID_fkey` FOREIGN KEY (`Stock_In_stockInID`) REFERENCES `Stock_In`(`stockInID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock_In_Detail` ADD CONSTRAINT `Stock_In_Detail_Stock_stockID_fkey` FOREIGN KEY (`Stock_stockID`) REFERENCES `Stock`(`stockID`) ON DELETE RESTRICT ON UPDATE CASCADE;
