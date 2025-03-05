// File: app/api/tables/route.ts

//app\api\tables\route.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Retrieve all tables
export async function GET() {
  try {
    const tables = await prisma.tables.findMany();
    //Make sure that you are sending JSON, as it is JSON Response
    return NextResponse.json(tables);
  } catch (error:any) {
    console.error('Error fetching tables:', error);
    return new NextResponse(JSON.stringify({message: "Internal Server Error", error:error.message}), { status: 500,headers: {'Content-Type': 'application/json'} });
  } finally {
    await prisma.$disconnect();
  }
}



// PATCH: Update a specific table by tabID
export async function PATCH(req: Request, { params }: { params: { tabID: string } }) {
  try {
    const { tabID } = params;
    const body = await req.json();
    const { tabStatus } = body;

    if (!tabID || !tabStatus) {
      return new NextResponse('Missing tabID or tabStatus', { status: 400 });
    }

    const updatedTable = await prisma.tables.update({
      where: { tabID: parseInt(tabID) },
      data: { tabStatus },
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
