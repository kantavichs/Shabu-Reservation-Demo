// File: app/api/auth/login/route.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { CustomerEmail, password } = body;

    console.log('Received data:', body);

    // Validate Input
    if (!CustomerEmail || !password) {
      console.log('Missing Credentials');
      return new NextResponse(JSON.stringify({ message: 'Missing Credentials' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Find the user by email
    console.log('Finding user with email:', CustomerEmail);
    const user = await prisma.customer.findUnique({
      where: { CustomerEmail: CustomerEmail },
    });

    console.log('User found:', user);

    if (!user) {
      console.log('Invalid Credentials');
      return new NextResponse(JSON.stringify({ message: 'Invalid Credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
          // Check if password is null or undefined
    if (!user.password) {
        console.error("User's password is null or undefined");
        return new NextResponse(JSON.stringify({ message: "Internal Server Error: Password not set" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Compare the provided password with the hashed password
    console.log('Comparing passwords...');
    const passwordMatch = await bcrypt.compare(password, user.password);

    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      console.log('Invalid Credentials');
      return new NextResponse(JSON.stringify({ message: 'Invalid Credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

        // app\api\auth\login\route.ts
    // Create JWT Token
    console.log('Creating JWT token...');
    const token = sign(
      {
        customerID: user.customerID,
        email: user.CustomerEmail,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
      { expiresIn: '1h' }
    );

    console.log('JWT token created:', token);

    // Return user and token
    console.log('Returning user and token...');
    const res = {
      customerID: user.customerID,
      firstName: user.firstName,
      lastName: user.lastName,
      CustomerEmail: user.CustomerEmail,
      token: token,
    };
    console.log("Results: " + JSON.stringify(res));
    return new NextResponse(JSON.stringify(res), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    await prisma.$disconnect();
  }
}
