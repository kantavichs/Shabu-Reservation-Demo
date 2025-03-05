// File: app/api/reservations/getbycustomer/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const customerId = url.searchParams.get('customerId');

        console.log("Fetching reservations for customerId:", customerId);

        if (!customerId) {
            return new NextResponse(JSON.stringify({ message: 'Missing customerId parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const customerIdInt = parseInt(customerId, 10);

        if (isNaN(customerIdInt)) {
            return new NextResponse(JSON.stringify({ message: 'Invalid customerId parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const reservations = await prisma.reservations.findMany({
            where: { Customer_customerID: customerIdInt },
        });

        console.log(`GET request successful for customerId: ${customerId}, Reservations: ${JSON.stringify(reservations)}`);
        return NextResponse.json(reservations);
    } catch (error: any) {
        console.error('Error fetching reservations:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    } finally {
        await prisma.$disconnect();
    }
}