import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod'; // Import Zod
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Define a Zod schema for data validation
const registrationSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  CustomerEmail: z.string().email(),
  password: z.string().min(8), // Adjust password strength requirements
  customerPhone: z.string().min(8).max(20),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log('Received data:', body); // Log received data

    // Validate Data using Zod
    try {
      console.log('Validating data with Zod...');
      registrationSchema.parse(body);
      console.log('Data validation successful.');
    } catch (error: any) {
      console.error('Zod Validation Error:', error.errors); // Log validation errors
      return new NextResponse(JSON.stringify({ message: 'Invalid Data', errors: error.errors }), { status: 400 }); // Send JSON response
    }

    const { firstName, lastName, CustomerEmail, password, customerPhone } = body;

    // Check if email exists
    console.log('Checking if email exists...');
    const existingUser = await prisma.customer.findUnique({
      where: {
        CustomerEmail: CustomerEmail, // ใช้ CustomerEmail โดยตรง
      },
    });

    console.log('Existing user:', existingUser);

    if (existingUser) {
      console.log('Email already exists'); // Log existing email
      return new NextResponse(JSON.stringify({ message: 'Email already exists' }), { status: 400 }); // Send JSON response
    }

    const saltRounds = 12; // Set salt rounds
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Hashed password:', hashedPassword); // Log hashed password

    console.log('Creating user...');
    const user = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        CustomerEmail,
        password: hashedPassword,
        customerPhone,
        cusCreatedAt: new Date(),
      },
    });

    console.log('User created:', user); // Log created user

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error in registration:', error); // Log error
    console.error('Error Message:', error.message); // Log error message
    console.error('Error Stack:', error.stack); // Log error stack trace

    // Check if the error is a Prisma Client Known Request Error
    if (error instanceof PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors (e.g., unique constraint violation)
      console.error('Prisma Error Code:', error.code);
      return new NextResponse(JSON.stringify({ message: `Database Error: ${error.message}`, code: error.code }), { status: 500 }); // Send JSON response
    }

    return new NextResponse(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 }); // Send JSON response
  } finally {
    console.log('Disconnecting Prisma...');
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
  }
}