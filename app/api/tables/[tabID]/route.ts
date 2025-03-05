// File: app\api\tables\[tabID]\route.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Retrieve a specific table by tabID (Optional)
export async function GET(req: Request, { params }: { params: { tabID: string } }) {
    try {
        const { tabID } = params;

        const table = await prisma.tables.findUnique({
            where: { tabID: parseInt(tabID, 10) },
        });

        if (!table) {
            return new NextResponse(JSON.stringify({ message: 'Table not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        return NextResponse.json(table);
    } catch (error: any) {
        console.error('Error fetching table:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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

        console.log("tabID = " + tabID);
        console.log("body = " + body);
        console.log("tabStatus = " + tabStatus)

        if (!tabID || !tabStatus) {
            return new NextResponse(JSON.stringify({ message: 'Missing tabID or tabStatus' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const tabIDInt = parseInt(tabID, 10);

        if (isNaN(tabIDInt)) {
            return new NextResponse(JSON.stringify({ message: 'Invalid tabID, must be an integer' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const updatedTable = await prisma.tables.update({
            where: { tabID: tabIDInt },
            data: { tabStatus },
        });

        return NextResponse.json(updatedTable);
    } catch (error: any) {
        console.error('Error updating table:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    } finally {
        await prisma.$disconnect();
    }
}