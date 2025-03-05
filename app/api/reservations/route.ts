// File: app/api/reservations/route.ts

import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Retrieve all reservations
export async function GET() {
  try {
      const reservations = await prisma.reservations.findMany({
         where: {
             deletedAt: null
         }
     });
      return NextResponse.json(reservations);
  } catch (error: any) {
      console.error('Error fetching reservations:', error);
      return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
      await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();

    console.log('POST /api/reservations - Received data:', json);
    console.log('POST /api/reservations - body:', json);
    // Validate required fields  Include customerPhone
    if (!json.tabID || !json.numberOfPeople || !json.resName || !json.resDate || !json.resTime || !json.Customer_customerID || !json.resCustomerPhone) {
      console.log('POST /api/reservations - Missing required fields:', json);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Parse numeric values
    const tabID = parseInt(json.tabID, 10);
    const numberOfPeople = parseInt(json.numberOfPeople, 10);
    const Customer_customerID = parseInt(json.Customer_customerID, 10);

    if (isNaN(tabID) || isNaN(numberOfPeople) || isNaN(Customer_customerID)) {
      console.log('POST /api/reservations - Invalid tabID or numberOfPeople or Customer_customerID:', { tabID, numberOfPeople, Customer_customerID });
      return NextResponse.json({ error: "Invalid tabID or numberOfPeople or Customer_customerID" }, { status: 400 });
    }

    const thaiTimeZone = 'Asia/Bangkok';

    // Combine resDate and resTime into a single string
    const combinedDateTimeString = `${json.resDate} ${json.resTime}`;

    // Convert to a moment object in Thai time
    const resTimeMoment = moment.tz(combinedDateTimeString, 'YYYY-MM-DD HH:mm', thaiTimeZone);

    // Convert to UTC
    const resTimeUTC = resTimeMoment.utc();
    console.log("resTimeUTC: " + resTimeUTC);

    // Store UTC time as string without formatting it
    const resTimeString = resTimeUTC.toISOString();
    console.log("resTimeString: " + resTimeString);

    const resDateUTC = moment.tz(json.resDate, thaiTimeZone).utc();
    const resDateString = resDateUTC.format('YYYY-MM-DD');

    // Explicitly create resCreatedAt in UTC
    const resCreatedAt = moment.utc().toISOString();
    console.log("ResCreatedAt Explicit Timezone to UTC: " + resCreatedAt)

    // Create reservation
    const reservation = await prisma.reservations.create({
      data: {
        resName: json.resName,
        resDate: resDateString, // Store Date as String
        resTime: resTimeString, // Store Time as String
        numberOfPeople: numberOfPeople,
        Tables_tabID: tabID,
        Customer_customerID: Customer_customerID,
        resCreatedAt: resCreatedAt, // Store as UTC
        resStatus: "pending",
        resCustomerPhone: json.resCustomerPhone
      },
    });

    // Generate token
    const temporaryToken = uuidv4();

    // Calculate token expiration in UTC
    const expiresAt = new Date(Date.now() + 300000).toISOString(); // Already in UTC
    console.log("expiresAt : " + expiresAt);
    // Store the token
    await prisma.tempToken.create({
      data: {
        resID: reservation.resID,
        token: temporaryToken,
        expiresAt: expiresAt, // Store as UTC
      },
    });

    // Update table status
    await prisma.tables.update({
      where: { tabID: tabID },
      data: { tabStatus: "unavailable" },
    });

    return NextResponse.json({ ...reservation, temporaryToken });

  } catch (error: any) {
    console.error("Error creating reservation:", error);
    return NextResponse.json({ error: "Failed to create reservation", message: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
