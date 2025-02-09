import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { TableID: string } }) {
  try {
    const { TableID } = params;
    const { resStatus } = await req.json();

    if (!TableID || !resStatus) {
      return new NextResponse(JSON.stringify({ message: 'Missing TableID or resStatus' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const tableID = parseInt(TableID, 10);

    if (isNaN(tableID)) {
      return new NextResponse(JSON.stringify({ message: 'Invalid TableID' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Find the reservation for the table
    const reservation = await prisma.reservations.findFirst({
        where: {
            Tables_tabID: tableID,
            resStatus: "pending"
        }
    })

    //if you cannot find any tables, then error
    if (!reservation){
        return new NextResponse(JSON.stringify({ message: 'There is no reservation associated with tabID. Cannot patch' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }


    const updatedReservation = await prisma.reservations.update({
      where: {
        resID: reservation.resID
      },
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