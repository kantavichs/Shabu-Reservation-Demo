/*
  Warnings:

  - A unique constraint covering the columns `[CustomerEmail]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Customer_CustomerEmail_key` ON `Customer`(`CustomerEmail`);
