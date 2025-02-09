import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { resID: string } }) {
    try {
        const { resID } = params;

        const reservation = await prisma.reservations.findUnique({
            where: { resID: parseInt(resID, 10) },
        });

        if (!reservation) {
            return new NextResponse(JSON.stringify({ message: 'Reservation not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        return NextResponse.json(reservation);
    } catch (error: any) {
        console.error('Error fetching reservation:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PATCH(req: Request, { params }: { params: { resID: string } }) {
    try {
        const { resID } = params;
        const { resStatus } = await req.json();

        if (!resID || !resStatus) {
            return new NextResponse(JSON.stringify({ message: 'Missing resID or resStatus' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const resIDInt = parseInt(resID, 10);

        if (isNaN(resIDInt)) {
            return new NextResponse(JSON.stringify({ message: 'Invalid resID' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const updatedReservation = await prisma.reservations.update({
            where: { resID: resIDInt },
            data: { resStatus },
        });

        return NextResponse.json(updatedReservation);
    } catch (error: any) {
        console.error('Error updating reservation:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    } finally {
        await prisma.$disconnect();
    }
}