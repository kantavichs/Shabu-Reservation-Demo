import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

const RESERVATION_STATUS_PENDING = "pending";
const RESERVATION_STATUS_CANCELLED = "cancelled";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  try {
    if (customerId) {
      const customerID = parseInt(customerId, 10);

      if (isNaN(customerID)) {
        return NextResponse.json({ error: "Invalid customerId" }, { status: 400 });
      }

      const reservations = await prisma.reservations.findMany({
        where: {
          Customer_customerID: customerID,
        },
      });

      return NextResponse.json(reservations);
    } else {
      const reservations = await prisma.reservations.findMany();
      return NextResponse.json(reservations);
    }
  } catch (error: any) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ error: "Failed to fetch reservations", message: error.message }, { status: 500 });
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
        resStatus: RESERVATION_STATUS_PENDING,
      },
    });

    const table = await prisma.tables.update({
      where: {
        tabID: tabID,
      },
      data: {
        tabStatus: "unavailable",
      },
    });

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    return NextResponse.json({ error: "Failed to create reservation", message: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resId = searchParams.get('resId');
    const resStatus = searchParams.get('resStatus'); // Extract resStatus from query params

    if (!resId) {
      return NextResponse.json({ error: "Missing resId" }, { status: 400 });
    }

    const resID = parseInt(resId, 10);

    if (isNaN(resID)) {
      return NextResponse.json({ error: "Invalid resId" }, { status: 400 });
    }

    let updateData: any = {};

    if (resStatus === RESERVATION_STATUS_CANCELLED) {
      updateData.resStatus = RESERVATION_STATUS_CANCELLED;

      // Optionally, update table status to available if canceling
      const reservation = await prisma.reservations.findUnique({
        where: { resID: resID },
      });

      if (reservation) {
        await prisma.tables.update({
          where: { tabID: reservation.Tables_tabID },
          data: { tabStatus: "available" },
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid resStatus" }, { status: 400 });
    }

    const updatedReservation = await prisma.reservations.update({
      where: { resID: resID },
      data: updateData,
    });

    return NextResponse.json(updatedReservation);
  } catch (error: any) {
    console.error("Error updating reservation:", error);
    return NextResponse.json({ error: "Failed to update reservation", message: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}