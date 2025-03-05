// File: app\api\reservations\[resID]\route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest
import moment from 'moment-timezone';
import { verifyToken } from '@/app/lib/utils'; // Assuming you have a verifyToken function

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { resID: string } }) {
  try {
    const { resID } = params; // Await the params object
    const resIDInt = parseInt(resID, 10);
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    console.log('GET /api/reservations/[resID] - resID:', resIDInt);
    console.log('GET /api/reservations/[resID] - token:', token);

    if (!token) {
      console.log('GET /api/reservations/[resID] - Error: Token is missing');
      return NextResponse.json({ error: "Token is missing" }, { status: 400 });
    }

    const tempToken = await prisma.tempToken.findUnique({
      where: {
        token: token,
      },
    });

    if (!tempToken) {
      console.log('GET /api/reservations/[resID] - Error: Token not found in database');
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    console.log('GET /api/reservations/[resID] - tempToken:', tempToken);

    const now = moment.utc();
    const expiresAt = moment.utc(tempToken.expiresAt);

    console.log('GET /api/reservations/[resID] - now (UTC):', now.toISOString());
    console.log('GET /api/reservations/[resID] - expiresAt (UTC):', expiresAt.toISOString());

    if (now.isAfter(expiresAt)) {
      console.log('GET /api/reservations/[resID] - Error: Token has expired');
      return NextResponse.json({ error: "Token has expired" }, { status: 403 });
    }

    // Verify JWT token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('GET /api/reservations/[resID] - Error: Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtToken = authHeader.split(' ')[1];
    const decodedToken = verifyToken(jwtToken);

    if (!decodedToken) {
      console.log('GET /api/reservations/[resID] - Error: Invalid JWT token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user ID
    const customerID = decodedToken.customerID; // Assuming JWT contains customerID
    if (!customerID) {
      console.log('GET /api/reservations/[resID] - Error: Missing customerID in JWT');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch reservation details
    const reservationDetails = await prisma.reservations.findUnique({
      where: { resID: resIDInt },
    });

    if (!reservationDetails) {
      console.log('GET /api/reservations/[resID] - Error: Reservation not found');
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Verify that the reservation belongs to the current user
    if (reservationDetails.Customer_customerID !== customerID) {
      console.log('GET /api/reservations/[resID] - Error: Unauthorized access');
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    return NextResponse.json(reservationDetails);

  } catch (error: any) {
    console.error('GET /api/reservations/[resID] - Error:', error);
    return NextResponse.json({ error: "Failed to fetch reservation details", message: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { resID: string } }) {
    try {
        const { resID } = params;
        const resIDInt = parseInt(resID, 10);
        const { deletedAt, resStatus } = await req.json(); // Get deletedAt and resStatus from request body

        console.log(`PATCH /api/reservations/${resID} - resID:`, resIDInt);
        console.log(`PATCH /api/reservations/${resID} - deletedAt:`, deletedAt);
        console.log(`PATCH /api/reservations/${resID} - resStatus:`, resStatus);

        if (!resStatus && !deletedAt) { // Check if both are missing
            console.log(`PATCH /api/reservations/${resID} - Error: Missing deletedAt or resStatus in request body`);
            return NextResponse.json({ error: "Missing deletedAt or resStatus" }, { status: 400 });
        }

        let updateData: any = {}; // Object to hold update data

        if (deletedAt) {
            // Validate that deletedAt is a valid date
            const deletedAtDate = new Date(deletedAt);
            if (isNaN(deletedAtDate.getTime())) {
                console.log(`PATCH /api/reservations/${resID} - Error: Invalid deletedAt date`);
                return NextResponse.json({ error: "Invalid deletedAt date" }, { status: 400 });
            }
            updateData.deletedAt = deletedAtDate;
        }

        if (resStatus) {
            updateData.resStatus = resStatus;
        }

        const updatedReservation = await prisma.reservations.update({
            where: { resID: resIDInt },
            data: updateData, // Use the updateData object
        });

        console.log(`PATCH /api/reservations/${resID} - Updated reservation:`, updatedReservation);
        return NextResponse.json(updatedReservation); // Return the updated reservation

    } catch (error: any) {
        console.error('PATCH /api/reservations/[resID] - Error:', error);
        console.error('PATCH /api/reservations/[resID] - Error Message:', error.message);
        console.error('PATCH /api/reservations/[resID] - Error Stack:', error.stack);
         return NextResponse.json({ error: "Failed to update reservation", message: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}