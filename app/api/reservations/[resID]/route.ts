import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { resID: string } }) {
    try {
        const { resID } = params;
        console.log(`GET request received for resID: ${resID}`);

        const resIDInt = parseInt(resID, 10);

        if (isNaN(resIDInt)) {
            console.error("Invalid resID (NaN)");
            return new NextResponse(JSON.stringify({ message: 'Invalid resID' }), { status: 400 });
        }

        const reservation = await prisma.reservations.findUnique({
            where: { resID: resIDInt },
        });

        if (!reservation) {
            console.error(`Reservation not found with resID: ${resIDInt}`);
            return new NextResponse(JSON.stringify({ message: 'Reservation not found' }), { status: 404 });
        }

        console.log(`GET request successful for resID: ${resID}, Reservation: ${JSON.stringify(reservation)}`);
        return NextResponse.json(reservation);
    } catch (error: any) {
        console.error('Error fetching reservation:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PATCH(req: Request, { params }: { params: { resID: string } }) {
    try {
        const { resID } = params;
        const { resStatus } = await req.json();

        console.log(`PATCH request received for resID: ${resID} with resStatus: ${resStatus}`); //ADDED LOG

        if (!resID) {
            console.error("Missing resID");
            return new NextResponse(JSON.stringify({ message: 'Missing resID' }), { status: 400 });
        }

        if (!resStatus) {
            console.error("Missing resStatus");
            return new NextResponse(JSON.stringify({ message: 'Missing resStatus' }), { status: 400 });
        }

        const resIDInt = parseInt(resID, 10);

        if (isNaN(resIDInt)) {
            console.error("Invalid resID (NaN)");
            return new NextResponse(JSON.stringify({ message: 'Invalid resID' }), { status: 400 });
        }

        try {
            const updatedReservation = await prisma.reservations.update({
                where: { resID: resIDInt },
                data: { resStatus: resStatus },
            });

             const reservation = await prisma.reservations.findUnique({
                where: { resID: resIDInt },
            });

            console.log(`Reservation updated successfully: ${JSON.stringify(updatedReservation)}`);

            return NextResponse.json(reservation);
        } catch (dbError: any) {
            console.error("Database update error:", dbError);
            return new NextResponse(JSON.stringify({ message: 'Database update error', error: dbError.message }), { status: 500 });
        }
    } catch (error: any) {
        console.error('Error updating reservation:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}