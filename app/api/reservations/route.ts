// app/api/reservations/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    try {
        if (customerId) {
            const reservations = await prisma.reservations.findMany({
                where: {
                    Customer_customerID: parseInt(customerId)
                },
            });
            return NextResponse.json(reservations);
        } else {
            const reservations = await prisma.reservations.findMany();
            return NextResponse.json(reservations);
        }
    } catch (error) {
        console.error("Error fetching reservations:", error);
        return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}


export async function POST(request: Request) {
  try {
      const json = await request.json();

      // Validate input data
      if (!json.tabID || !json.numberOfPeople || !json.resName || !json.resDate || !json.resTime || !json.Customer_customerID) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const tabID = parseInt(json.tabID, 10);
      const numberOfPeople = parseInt(json.numberOfPeople, 10);
      const Customer_customerID = parseInt(json.Customer_customerID, 10);

      if (isNaN(tabID) || isNaN(numberOfPeople) || isNaN(Customer_customerID)) {
          return NextResponse.json({ error: "Invalid tabID or numberOfPeople or Customer_customerID" }, { status: 400 });
      }

      const reservation = await prisma.reservations.create({
          data: {
              resName: json.resName, // Sanitize input if needed
              resDate: json.resDate, // Sanitize input if needed
              resTime: json.resTime, // Sanitize input if needed
              numberOfPeople: numberOfPeople,
              Tables_tabID: tabID,
              Customer_customerID: Customer_customerID,
              resCreatedAt: new Date(),
              resStatus: "pending"
          },
      });

       // Update table status to unavailable
       await prisma.tables.update({
          where: {
              tabID: tabID,
          },
          data: {
              tabStatus: "unavailable",
          },
      });

      return NextResponse.json(reservation);
  } catch (error) {
      console.error("Error creating reservation:", error);
      return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  } finally {
      await prisma.$disconnect();
  }
}