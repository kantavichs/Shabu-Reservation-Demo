//app\api\auth\login\route.ts

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
//app\api\auth\logout\route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Clear Cookie (Example - depends on how you set the cookie)
    // You might need to set the cookie with Max-Age=0 or Expires in the past

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
//app\api\auth\register\route.ts

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
//app\api\reservations\byTable\TableID\route.ts

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
//app\api\reservations\getbycustomer\route.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse, NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return new NextResponse(JSON.stringify({ message: 'Missing customerId parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const customerIDInt = parseInt(customerId, 10);

        if (isNaN(customerIDInt)) {
            return new NextResponse(JSON.stringify({ message: 'Invalid customerId, must be an integer' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const reservations = await prisma.reservations.findMany({
             where: {
                Customer_customerID: customerIDInt,
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
      const { deletedAt } = await req.json(); // Get deletedAt from request body

      console.log(`PATCH /api/reservations/${resID} - resID:`, resIDInt);
      console.log(`PATCH /api/reservations/${resID} - deletedAt:`, deletedAt);

      if (!deletedAt) {
          console.log(`PATCH /api/reservations/${resID} - Error: Missing deletedAt in request body`);
          return NextResponse.json({ error: "Missing deletedAt" }, { status: 400 });
      }

      // Validate that deletedAt is a valid date
      const deletedAtDate = new Date(deletedAt);
      if (isNaN(deletedAtDate.getTime())) {
          console.log(`PATCH /api/reservations/${resID} - Error: Invalid deletedAt date`);
          return NextResponse.json({ error: "Invalid deletedAt date" }, { status: 400 });
      }

      const updatedReservation = await prisma.reservations.update({
          where: { resID: resIDInt },
          data: { deletedAt: deletedAtDate }, // Store as Date
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
//app\api\tables\[tabID]\route.ts

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
}
//app\components\AuthProvider.tsx

"use client";

import { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
    customerID: number;
    firstName: string;
    lastName: string;
    CustomerEmail: string;
    token: string; // Add the token property
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = Cookies.get('user');
        console.log('Stored User:', storedUser); // Log the value of storedUser
    
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('Parsed User:', parsedUser); // Log the parsed user object
                setUser(parsedUser);
            } catch (error: any) {
                console.error('Error parsing stored user:', error);
                console.error('Raw cookie value:', storedUser); // Log the raw cookie value
    
                // Handle parsing error (e.g., clear cookie)
                Cookies.remove('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        console.log("Saving user to localStorage: " + JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);  // Set state *before* navigating
    
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        Cookies.remove('user');
        router.push('/login');
    };

    const value: AuthContextType = { user, login, logout, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
//app/components/ConfirmDialog.tsx

interface ConfirmDialogProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-bold text-gray-800">Confirmation</h3>
                <div className="mt-2 text-gray-600">
                    {message}
                </div>
                <div className="items-center px-4 py-3">
                    <button
                        className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                    <button
                        className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
//app/components/Navbar.tsx

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-gray-800 p-4 text-white">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">
                    ShabuBuffet
                </Link>
                <div className="flex items-center space-x-4">
                    <Link href="/reservation">Reservation</Link>
                    <Link href="/reservationhistory">Reservation History</Link>
                    {user ? (
                        <>
                            <span>Welcome, {user.firstName}</span>
                            <button onClick={logout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">Login</Link>
                            <Link href="/register">Register</Link>
                        </>
                    )}
                    {user?.CustomerEmail === "admin" ? (
                        <Link href="/tablemanagement">Table Management</Link>
                    ) : null}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
// ReservationForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import moment from 'moment-timezone';

interface Table {
    tabID: number;
    tabTypes: string;
    tabStatus: string | null;
}

const ReservationForm = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [resName, setResName] = useState('');
    const [resCustomerPhone, setResCustomerPhone] = useState(''); //CHANGED
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [tabID, setTabID] = useState('');
    const [resDate, setResDate] = useState('');
    const [resTime, setResTime] = useState('');

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch('/api/tables');
                if (!response.ok) {
                    const message = await response.text()
                    throw new Error(`HTTP error! status: ${response.status}, message: ${message}`);
                }
                const data = await response.json();
                if (!Array.isArray(data)){
                    throw new Error('Data is not an array');
                }
                setTables(data);
                console.log("All tables: "+JSON.stringify(data));
            } catch (error:any) {
                console.error("Could not fetch tables:", error);
            }
        };

        fetchTables();
    }, []);

    const generateTimeOptions = () => {
        const startTime = 10 * 60; // 10:00 AM in minutes
        const endTime = 21 * 60; // 9:00 PM in minutes
        const interval = 5; // 5 minutes interval
        const options = [];

        for (let i = startTime; i <= endTime; i += interval) {
            const hours = Math.floor(i / 60);
            const minutes = i % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            options.push(<option key={timeString} value={timeString}>{timeString}</option>);
        }
        return options;
    };

    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const confirmReservation = async (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams({
            resName: resName,
            resCustomerPhone: resCustomerPhone,
            numberOfPeople: String(numberOfPeople),
            tabID: tabID,
            resDate: resDate, // Send Date String
            resTime: resTime, // Send Time String
            Customer_customerID: String(user?.customerID),
            user: JSON.stringify(user)
        });

        router.push(`/reservationsummary?${params.toString()}`);
    };

    //Date time from the user, is local time
const thaiTimeZone = 'Asia/Bangkok';

       

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reservation Form</h1>
            <form onSubmit={confirmReservation} className="space-y-4">
                <div>
                    <label htmlFor="resName" className="block text-gray-700 text-sm font-bold mb-2">Reservation Name:</label>
                    <input
                        type="text"
                        id="resName"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={resName}
                        onChange={(e) => setResName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="resCustomerPhone" className="block text-gray-700 text-sm font-bold mb-2">Phone Number:</label>
                    <input
                        type="tel"
                        id="resCustomerPhone" //CHANGED
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={resCustomerPhone} //CHANGED
                        onChange={(e) => setResCustomerPhone(e.target.value)} //CHANGED
                        required
                    />
                </div>
                <div>
                    <label htmlFor="numberOfPeople" className="block text-gray-700 text-sm font-bold mb-2">Number of People:</label>
                    <input
                        type="number"
                        id="numberOfPeople"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={numberOfPeople}
                        onChange={(e) => setNumberOfPeople(Number(e.target.value))}
                        min="1"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="tabID" className="block text-gray-700 text-sm font-bold mb-2">Table Number:</label>
                    <select
                        id="tabID"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={tabID}
                        onChange={(e) => setTabID(e.target.value)}
                        required
                    >
                        <option value="">Select a Table</option>
                        {tables.map((table) => (
                            <option key={table.tabID} value={table.tabID} disabled={table.tabStatus === 'unavailable'}>
                                Table {table.tabID} ({table.tabTypes}) - {table.tabStatus === 'unavailable' ? 'Unavailable' : 'Available'}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="resDate" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
                    <input
                        type="date"
                        id="resDate"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={resDate}
                        onChange={(e) => setResDate(e.target.value)}
                        min={getCurrentDate()} // กำหนดค่า min
                        required
                    />
                </div>
                <div>
                    <label htmlFor="resTime" className="block text-gray-700 text-sm font-bold mb-2">Time:</label>
                    <select
                      id="resTime"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={resTime}
                      onChange={(e) => setResTime(e.target.value)}
                      required
                    >
                      <option value="">Select Time</option>
                      {generateTimeOptions()}
                    </select>
                </div>
                <div>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Submit Reservation
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReservationForm;
//app/components/ReservationHistory.tsx

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import moment from 'moment-timezone';

interface Reservation {
    resID: number;
    resName: string;
    resDate: string;
    resTime: string;
    numberOfPeople: number;
    resStatus: string;
    Tables_tabID: number;
    resCreatedAt: string; // Date to String
    resCustomerPhone: string; // Added customerPhone
}

const ReservationHistory = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await fetch(`/api/reservations/getbycustomer?customerId=${user?.customerID}`);  //<---- CHANGED URL
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setReservations(data);
            } catch (error) {
                console.error("Could not fetch reservations:", error);
            }
        };

        fetchReservations();
    }, [user]);

    const handleCancelReservation = async (resID: number) => {
        const confirmCancel = window.confirm("Are you sure you want to cancel this reservation?");
        if (confirmCancel) {
            try {
                const response = await fetch(`/api/reservations/${resID}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ resStatus: 'cancelled' }),
                });

                if (response.ok) {
                    setReservations(prevReservations =>
                        prevReservations.map(res =>
                            res.resID === resID ? { ...res, resStatus: 'cancelled' } : res
                        )
                    );
                } else {
                    console.error('Failed to cancel reservation');
                }
            } catch (error) {
                console.error('Error cancelling reservation:', error);
            }
        }
    };


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reservation History</h1>
            {reservations.length === 0 ? (
                <p>No reservations found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Reservation Name
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Table Number
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Created At
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((reservation) => (
                                <tr key={reservation.resID}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {reservation.resName}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {reservation.Tables_tabID}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {reservation.resDate}  {/* Directly Display */}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {reservation.resTime}  {/* Directly Display */}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {reservation.resStatus}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {moment(reservation.resCreatedAt).format('DD/MM/YYYY HH:mm:ss')}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {reservation.resStatus === 'pending' && (
                                            <button
                                                onClick={() => handleCancelReservation(reservation.resID)}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReservationHistory;
//app/components/ReservationManagement.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import moment from 'moment-timezone';

interface Reservation {
    resID: number;
    resName: string;
    resDate: string;
    resTime: string;
    numberOfPeople: number;
    resStatus: string;
    Tables_tabID: number;
    Customer_customerID: number;
    resCreatedAt: Date;
    deletedAt: Date | null; // Add this line
}

const ReservationManagement = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);

    const fetchReservations = useCallback(async () => {
        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const sortedReservations = data.sort((a: Reservation, b: Reservation) => b.resID - a.resID); // Sort by resID descending
            setReservations(sortedReservations);
        } catch (error) {
            console.error("Could not fetch reservations:", error);
        }
    }, []);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

     const handleSoftDelete = async (resID: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this reservation?");
        if (confirmDelete) {
            try {
                const response = await fetch(`/api/reservations/${resID}`, {
                    method: 'PATCH', // Use PATCH to update the deletedAt date
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ deletedAt: new Date() }), // Soft delete: set deletedAt to current date
                });

                if (response.ok) {
                    const data = await response.json();
                      fetchReservations();

                } else {
                      const errorData = await response.json();
                     console.error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                    console.error('Failed to delete reservation');
                }
            } catch (error) {
                console.error('Error deleting reservation:', error);
            }
        }
    };


    const handleConfirm = async (resID: number) => {
        try {
            const response = await fetch(`/api/reservations/${resID}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resStatus: 'confirmed' }),
            });
       
            if (response.ok) {
                const data = await response.json();
    
                setReservations(prevReservations =>
                    prevReservations.map(res =>
                        res.resID === resID ? { ...res, resStatus: 'confirmed' } : res
                    )
                );
            } else {
               // Try to parse JSON, but handle potential parsing errors
                   try {
                       const errorData = await response.json();
                         console.error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                   } catch (jsonError) {
                       console.error(`HTTP error! status: ${response.status}, but failed to parse error response.`);
                   }
                console.error('Failed to confirm reservation');
            }
        } catch (error) {
            console.error('Error confirming reservation:', error);
        }
       
    };

    const handleCancel = async (resID: number) => {
        // Inside handleCancel function in ReservationManagement.tsx
        try {
            const response = await fetch(`/api/reservations/${resID}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resStatus: 'cancelled' }),
            });
       
            if (response.ok) {
                const data = await response.json();
       
                setReservations(prevReservations =>
                    prevReservations.map(res =>
                        res.resID === resID ? { ...res, resStatus: 'cancelled' } : res
                    )
                );
            } else {
                // Attempt to parse the error message from the response
                try {
                    const errorData = await response.json();
                    console.error(`Failed to confirm reservation: ${response.status} - ${errorData.message}`);
                    // Display errorData.message to the user or handle it appropriately
                } catch (parseError) {
                    console.error(`Failed to confirm reservation: ${response.status} - Could not parse error message`);
                }
                console.error('Failed to confirm reservation'); // Fallback error message
            }
        } catch (error) {
            console.error('Error confirming reservation:', error);
        }
            };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reservation Management</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Time
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                People
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Table ID
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Customer ID
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Created At
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((reservation) => (
                            <tr key={reservation.resID}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.resID}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.resName}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.resDate}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.resTime}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.numberOfPeople}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.Tables_tabID}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.Customer_customerID}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.resStatus}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {moment.utc(reservation.resCreatedAt).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm:ss')}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {reservation.resStatus === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleConfirm(reservation.resID)}
                                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => handleCancel(reservation.resID)}
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : null}
                                    <button
                                        onClick={() => handleSoftDelete(reservation.resID)}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReservationManagement;
//app/components/ReservationSummary.tsx

"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';
import moment from 'moment-timezone';

const ReservationSummaryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth(); // Rename the user from auth

  const [error, setError] = useState<string | null>(null);

  const resName = searchParams?.get('resName') || '';
  const resCustomerPhone = searchParams?.get('resCustomerPhone') || ''; // Corrected
  const numberOfPeople = searchParams?.get('numberOfPeople') || '';
  const tabID = searchParams?.get('tabID') || '';
  const resDate = searchParams?.get('resDate') || '';
  const resTime = searchParams?.get('resTime') || '';

  const customerID = authUser?.customerID; // Safely access the customerID from the authUser object

  const handleConfirm = async () => {
    try {
      console.log('handleConfirm - Starting reservation creation...');
      console.log('handleConfirm - resName:', resName);
      console.log('handleConfirm - resDate:', resDate);
      console.log('handleConfirm - resTime:', resTime);
      console.log('handleConfirm - customerID:', customerID);

      // Check that the body variables
      // Verify user ID is passed

      if (!customerID) {
        setError("CustomerID is missing, please log in again");
        return;
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resName,
          resCustomerPhone: resCustomerPhone, // NEW
          numberOfPeople,
          tabID,
          resDate,
          resTime,
          Customer_customerID: customerID,
        }),
      });

      if (response.ok) {
        console.log('handleConfirm - Reservation created successfully!');
        const data = await response.json();
        if (data && data.resID && data.temporaryToken) {
          console.log('handleConfirm - resID:', data.resID);
          console.log('handleConfirm - temporaryToken:', data.temporaryToken);
          router.push(`/reservationsummary/${data.resID}?token=${data.temporaryToken}`);
        } else {
          console.error('handleConfirm - resID or temporaryToken is missing from the response:', data);
          setError('Failed to create reservation: resID or token missing in response');
        }
      } else {
        console.error('handleConfirm - Failed to create reservation');
        // Improved error message handling
        let errorMessage = 'Failed to create reservation';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('handleConfirm - Failed to parse error response:', e);
        }
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('handleConfirm - Error creating reservation:', error);
      setError(`Error creating reservation: ${error.message}`);
    }
  };

  const handleCancel = () => {
    router.push('/reservation');
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Reservation Summary</h1>
        <div>
          <p>Reservation Name: {resName}</p>
          <p>Phone Number: {resCustomerPhone}</p> {/* Corrected */}
          <p>Number of People: {numberOfPeople}</p>
          <p>Table Number: {tabID}</p>
          <p>Date: {resDate}</p>
          <p>Time: {resTime}</p>
        </div>
        <p>Please capture this page to identify your reservation</p>
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          onClick={() => router.push('/reservation')}
        >
          Back to Form
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default ReservationSummaryPage;
//app/components/Sidebar.tsx

import { useState, useEffect, useCallback } from 'react';
import moment from 'moment-timezone';

interface Reservation {
 resID: number;
 resName: string;
 resDate: string;
 resTime: string;
 numberOfPeople: number;
 resStatus: string;
 Tables_tabID: number;
 Customer_customerID:number;
 resCreatedAt:Date;
  deletedAt: Date | null; // Add this line
}

const Sidebar = () => {
 const [confirmedReservations, setConfirmedReservations] = useState<Reservation[]>([]);

 const fetchConfirmedReservations = useCallback(async () => {
     try {
         const response = await fetch('/api/reservations');
         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
         }
         const data = await response.json();
         const sortedConfirmed = data
             .filter((reservation: Reservation) => reservation.resStatus === 'confirmed')
             .sort((a: Reservation, b: Reservation) => b.resID - a.resID); // Sort by resID descending
         setConfirmedReservations(sortedConfirmed);
     } catch (error) {
         console.error("Could not fetch confirmed reservations:", error);
     }
 }, []);

 useEffect(() => {
     fetchConfirmedReservations();
 }, [fetchConfirmedReservations]);

const handleSoftDelete = async (resID: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this reservation?");
    if (confirmDelete) {
         try {
          const deletedAtDate = new Date()
              const response = await fetch(`/api/reservations/${resID}`, {
                  method: 'PATCH', // Use PATCH to update the deletedAt date
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ deletedAt:  deletedAtDate}), // Soft delete: set deletedAt to current date
              });

              if (response.ok) {
                 fetchConfirmedReservations(); // Refresh the reservation list
              } else {
                   // Parse the error response
                   try {
                       const errorData = await response.json();
                       console.error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                   } catch (jsonError) {
                       console.error(`HTTP error! status: ${response.status}, but failed to parse error response.`, response);
                   }
                   console.error('Failed to delete reservation');
              }
          } catch (error) {
              console.error('Error deleting reservation:', error);
          }
      }
  };

 return (
     <div className="bg-gray-100 p-4 h-screen w-64">
         <h2 className="text-lg font-bold mb-4">Confirmed Reservations</h2>
         <ul>
             {confirmedReservations.map(reservation => (
                 <li key={reservation.resID} className="mb-2 p-2 bg-white rounded shadow">
                     <div>{reservation.resName}</div>
                     <div>Table: {reservation.Tables_tabID}</div>
                     <div>Time: {reservation.resTime}</div>
                      <div>Created At: {moment.utc(reservation.resCreatedAt).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm:ss')}</div>
                     <button
                         onClick={() => handleSoftDelete(reservation.resID)}
                         className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mt-2 text-xs"
                     >
                         Delete
                     </button>
                 </li>
             ))}
         </ul>
     </div>
 );
};

export default Sidebar;
//app/components/TableManagement.tsx

"use client";

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import ConfirmDialog from '@/app/components/ConfirmDialog'; // Import ConfirmDialog

interface Table {
    tabID: number;
    tabTypes: string;
    tabStatus: string; // Add tabStatus property
}

type ActionType = 'confirm' | 'cancel' | 'available' | 'unavailable' | null;

const TableManagement = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<ActionType | null>(null); // Make sure the type includes null
    const [reservations, setReservations] = useState<any[]>([]);
    const [confirmMessage, setConfirmMessage] = useState('');
    
    const fetchTables = useCallback(async () => {
        try {
            const response = await fetch('/api/tables');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setTables(data);
        } catch (error) {
            console.error("Could not fetch tables:", error);
        }
    }, []);

    const fetchAllReservations = useCallback(async () => {
        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setReservations(data);
        } catch (error) {
            console.error("Could not fetch reservations:", error);
        }
    }, []);

    useEffect(() => {
        fetchTables();
        fetchAllReservations();
    }, [fetchTables, fetchAllReservations]);

    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
        setActionType(null);
    };

    const getTableImage = (table: Table) => {
        if (table.tabTypes === 'VIP') {
            return table.tabStatus === 'available' ? '/darkgrey_vip_table.png' : '/lightgrey_vip_table.png';
        }
        return table.tabStatus === 'available' ? '/darkgreytable.png' : '/lightgreytable.png';
    };

    const getAvailableActions = (table: Table) => {
        const isTableReserved = reservations.some(
            (reservation) => reservation.Tables_tabID === table.tabID && reservation.resStatus === 'pending'
        );

        if (table.tabStatus === 'available') {
            return ['unavailable'];
        }
        if (isTableReserved) {
            return ['confirm', 'cancel'];
        }
        return ['available'];
    };

     const handleOptionChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const action = e.target.value as ActionType;
        setActionType(action);

        // Set the confirmation message based on the selected action
        let message = `Are you sure you want to ${action} Table ${selectedTable?.tabID}?`;
        setConfirmMessage(message);

        // Open the confirmation dialog
        setConfirmDialogOpen(true);
    };

    const confirmAction = async () => {
       if (!selectedTable || !actionType) {
            console.log("No selected table or action type");
            return;
        }

        try {
            let newStatus: string | undefined;
            let resStatus: string | undefined;
            let reservationIdToUpdate: number | undefined;

            if (actionType === 'available') {
                newStatus = 'available';
            } else if (actionType === 'unavailable') {
                newStatus = 'unavailable';
            } else if (actionType === 'confirm') {
                resStatus = 'confirmed';
                reservationIdToUpdate = reservations.find(
                    (reservation) =>
                        reservation.Tables_tabID === selectedTable.tabID && reservation.resStatus === 'pending'
                )?.resID;
            } else if (actionType === 'cancel') {
                newStatus = 'available';
                resStatus = 'cancelled';
                reservationIdToUpdate = reservations.find(
                    (reservation) =>
                        reservation.Tables_tabID === selectedTable.tabID && reservation.resStatus === 'pending'
                )?.resID;
            }

            // Optimistic update
            const updatedTables = tables.map((table) =>
                table.tabID === selectedTable.tabID ? { ...table, tabStatus: newStatus ?? table.tabStatus } : table
            );
            setTables(updatedTables);

            const updateTable = async () => {
                if (newStatus) {
                    const response = await fetch(`/api/tables/${selectedTable.tabID}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tabStatus: newStatus }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                        throw new Error(`HTTP error! status: ${response.status}, message: errorText`);
                    }
                } else {
                    console.log("No newStatus to update.");
                }
            };

            const updateReservation = async () => {
                if (resStatus && reservationIdToUpdate) {
                    try {
                        const response = await fetch(
                            `/api/reservations/${reservationIdToUpdate}`,
                            {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ resStatus: resStatus }),
                            }
                        );

                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                            throw new Error(`HTTP error! status: ${response.status}, message: errorData.message}`);
                        }
                    } catch (error) {
                        console.error("Could not update reservation status:", error);
                        throw error; // Re-throw to be caught by the outer catch
                    }
                } else {
                    console.log("No reservation to update.");
                }
            };

            await Promise.all([updateTable(), updateReservation()]);
        } catch (error) {
            console.error("Could not update reservation status:", error);
        } finally {
            setConfirmDialogOpen(false);
            setActionType(null);
            setSelectedTable(null);
        }
    };

    const cancelAction = () => {
        setConfirmDialogOpen(false);
        setActionType(null);
    };


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Table Management</h1>
            <div className="grid grid-cols-4 gap-4">
                {tables.map((table) => (
                    <div key={table.tabID} className="cursor-pointer relative">
                        <img
                            src={getTableImage(table)}
                            alt={`Table ${table.tabID}`}
                            className="w-full h-auto"
                            onClick={() => handleTableClick(table)}
                        />
                        <p className="text-center">
                            Table {table.tabID} ({table.tabTypes})
                        </p>

                        {selectedTable?.tabID === table.tabID && (
                            <div
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    zIndex: 10,
                                }}
                            >
                                <select
                                    id={`tableActions-${table.tabID}`}
                                    className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    onChange={handleOptionChange}
                                    defaultValue=""
                                >
                                    <option value="" disabled>
                                        Select an action
                                    </option>
                                    {getAvailableActions(table).map((action) => (
                                        <option key={action} value={action}>
                                            {action.charAt(0).toUpperCase() + action.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}
            </div>

              {confirmDialogOpen && (
                <ConfirmDialog
                    isOpen={confirmDialogOpen}
                    message={confirmMessage}
                    onConfirm={confirmAction}
                    onCancel={cancelAction}
                />
            )}
        </div>
    );
};

export default TableManagement;
//app/context/AuthContext.tsx

"use client";

import { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    customerID: number;
    firstName: string;
    lastName: string;
    CustomerEmail: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        console.log('Stored User from localStorage:', storedUser);

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing stored user from localStorage:', error);
                localStorage.removeItem('user'); // Clear invalid data
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        console.log("Saving user to localStorage: " + JSON.stringify(userData));
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        router.push('/login');
    };

    const value: AuthContextType = { user, login, logout, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
//app/context/AuthProvider.tsx

"use client";

import { AuthProvider } from '../context/AuthContext';

interface Props {
    children: React.ReactNode;
}

const Provider = ({ children }: Props) => {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    )
}

export default Provider;
//app/lib/utils.ts

// Example function to verify JWT token
import { verify } from 'jsonwebtoken';

export function verifyToken(token: string): any {
  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
    return decoded;
  } catch (error) {
    return null;
  }
}
//app/login/page.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';

// Function to safely parse JSON
async function safeJsonParse(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error("safeJsonParse", e);
        return false;
    }
}

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // 1. Make the API Call
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ CustomerEmail: email, password }),
            });

            // 2. Handle Response Status
            if (response.ok) {
                // 3. Parse Response Body
                 const data = await response.json();
                 const userData = {
                  customerID: data.customerID,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  CustomerEmail: data.CustomerEmail,
                  token: data.token, // Assuming the API returns a token
                };

                login(userData);
                router.push('/reservation');
            } else {
                // 5. Handle Unsuccessful Login
                let errorMessage = 'Login failed'; // Default error message

                try {
                    // Attempt to parse JSON for structured error message
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage; // Use server-provided message, if available
                } catch (jsonError) {
                    // If JSON parsing fails, use response status and text
                    console.error('Failed to parse JSON:', jsonError);
                    errorMessage = `Login failed with status ${response.status}`;

                    try {
                        const errorText = await response.text();
                        errorMessage += `: ${errorText}`; // Append error text, if available
                    } catch (textError) {
                        console.error('Failed to parse response text:', textError);
                        errorMessage += ': and could not retrieve detailed error.'; // Indicate text retrieval failure
                    }
                }

                setError(errorMessage); // Set comprehensive error message
                console.error('Login failed:', errorMessage);
            }
        } catch (fetchError: any) {
            // Handle fetch errors
            const message = fetchError.message || 'An unexpected error occurred';
            setError(`Error logging in: ${message}`);
            console.error('Fetch error:', fetchError);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Login</h1>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
//app/register/page.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

const RegisterPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, CustomerEmail: email, password, customerPhone }),
            });

            if (response.ok) {
                // Registration successful, redirect to login page
                router.push('/login');
            } else {
                // Log the full response for debugging
                console.error('Registration failed:', response);

                // Attempt to parse the error message from the response
                try {
                    const errorData = await response.json();
                    setError(`Registration failed: ${errorData.message || JSON.stringify(errorData)}`);
                } catch (parseError) {
                    // If JSON parsing fails, get text and show response status
                    const errorText = await response.text();
                    console.error('Failed to parse JSON:', parseError);
                    setError(`Registration failed with status: ${response.status}, text: ${errorText}`);
                }
            }
        } catch (fetchError: any) {
            console.error('Error during fetch:', fetchError);
            setError(`Error registering: ${fetchError.message || 'Unknown error'}`);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Register</h1>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">First Name:</label>
                        <input
                            type="text"
                            id="firstName"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">Last Name:</label>
                        <input
                            type="text"
                            id="lastName"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="customerPhone" className="block text-gray-700 text-sm font-bold mb-2">Phone Number:</label>
                        <input
                            type="tel"
                            id="customerPhone"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
// app/reservation/page.tsx
"use client";

import Navbar from '../components/Navbar';
import ReservationForm from '../components/ReservationForm';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ReservationPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ReservationPage: User:', user); // Log user object
    console.log('ReservationPage: Is Loading:', isLoading); // Log isLoading value

    if (!isLoading) {
      console.log("ReservationPage: isLoading is false")
      if (!user) {
        console.log("ReservationPage: No user, redirecting to /login");
        router.push('/login');
      } else{
         console.log("ReservationPage: User found: " + JSON.stringify(user));
      }
    } else {
        console.log("ReservationPage: still loading. Please wait.");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If user is null, then return null
  if (!user) {
    console.log("ReservationPage: User is null after isLoading check, rendering null");
    return null;
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <ReservationForm />
      </div>
    </div>
  );
};

export default ReservationPage;
//app/reservation/page.tsx
"use client";

import Navbar from '../components/Navbar';
import ReservationHistory from '../components/ReservationHistory';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ReservationPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('User:', user);
    console.log('Is Loading:', isLoading);

    if (!isLoading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Ensure that "user" is available before rendering components
  if (!user) {
    return null; // or return a different component if needed
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <ReservationHistory />
      </div>
    </div>
  );
};

export default ReservationPage;
// app/reservationmanagement/page.tsx
"use client";

import Navbar from '../components/Navbar';
import ReservationManagement from '../components/ReservationManagement';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ReservationManagementPage = () => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.CustomerEmail !== 'admin@gmail.com') {
                router.push('/login');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return null; // Or a redirect component
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <ReservationManagement />
            </div>
        </div>
    );
};

export default ReservationManagementPage;
// app/reservationsummary/[resID]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import moment from 'moment-timezone';
import { useAuth } from '@/app/context/AuthContext';

interface Reservation {
    resID: number;
    resName: string;
    numberOfPeople: number;
    tabID: string;
    resDate: string;
    resTime: string;
    resStatus: string;
    resCreatedAt: string;
    resCustomerPhone: string;
}

const ReservationSummaryDetailPage = () => {
    const router = useRouter();
    const params = useParams<{ resID: string }>();
    const resID = params?.resID;
    const searchParams = useSearchParams();
    const token = searchParams?.get('token');
    const { user } = useAuth();

    const [reservationDetails, setReservationDetails] = useState<Reservation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchReservation = async () => {
            setIsLoading(true);
            try {
                if (!token) {
                    setError('Token is missing.');
                    setIsLoading(false);
                    return;
                }

                const jwtToken = user?.token;
                if (!jwtToken) {
                    setError('Not authenticated.');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`/api/reservations/${resID}?token=${token}`, {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                });

                if (!response.ok) {
                    setError(`HTTP error! status: ${response.status}`);
                    setIsLoading(false);
                    return;
                }

                const data = await response.json();
                console.log("Reservation data: " + JSON.stringify(data));
                setReservationDetails(data);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Error fetching reservation details:', error);
                setError(`Error fetching reservation details: ${error.message}`);
                setIsLoading(false);
            }
        };

        fetchReservation();
    }, [resID, token, user?.token]);

    if (isLoading) {
        return (
            <div>
                <Navbar />
                <div className="container mx-auto p-4">
                    <p>Loading reservation details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Navbar />
                <div className="container mx-auto p-4">
                    <h1>Error</h1>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!reservationDetails) {
        return (
            <div>
                <Navbar />
                <div className="container mx-auto p-4">
                    <p>Reservation details not found.</p>
                </div>
            </div>
        );
    }

    const thaiTimeZone = 'Asia/Bangkok';

    // Only format if reservationDetails exists
    console.log(reservationDetails.resTime);
    const thaiResTime = reservationDetails.resTime ? moment.utc(reservationDetails.resTime).tz(thaiTimeZone).format('HH:mm') : '';
    const thaiResDate = reservationDetails.resDate ? moment.utc(reservationDetails.resDate).tz(thaiTimeZone).format('YYYY-MM-DD') : '';
    const thaiResCreatedAt = reservationDetails.resCreatedAt ? moment.utc(reservationDetails.resCreatedAt).tz(thaiTimeZone).format('YYYY-MM-DD HH:mm:ss') : '';


    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Reservation Summary Detail</h1>
                <div>
                    <p>Reservation Name: {reservationDetails.resName}</p>
                    <p>Phone Number: {reservationDetails.resCustomerPhone}</p>
                    <p>Number of People: {reservationDetails.numberOfPeople}</p>
                    <p>Table Number: {reservationDetails.tabID}</p>
                    <p>Date: {thaiResDate}</p>
                    <p>Time: {thaiResTime}</p>
                    {/* ... other details ... */}
                </div>
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
                    onClick={() => router.push('/reservationhistory')}
                >
                    Back to Reservation History
                </button>
            </div>
        </div>
    );
};

export default ReservationSummaryDetailPage;
// app/reservationsummary/page.tsx
"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';
import moment from 'moment-timezone';

const ReservationSummaryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth(); // Rename the user from auth

  const [error, setError] = useState<string | null>(null);

  // Safely access search parameters using the nullish coalescing operator (??)
  const resName = searchParams?.get('resName') || '';
  const resCustomerPhone = searchParams?.get('resCustomerPhone') || '';
  const numberOfPeople = searchParams?.get('numberOfPeople') || '';
  const tabID = searchParams?.get('tabID') || '';
  const resDate = searchParams?.get('resDate') || '';
  const resTime = searchParams?.get('resTime') || '';

  const customerID = authUser?.customerID; // Safely access the customerID from the authUser object

  const handleConfirm = async () => {
    try {
      console.log('handleConfirm - Starting reservation creation...');
      console.log('handleConfirm - resName:', resName);
      console.log('handleConfirm - resDate:', resDate);
      console.log('handleConfirm - resTime:', resTime);
      console.log('handleConfirm - customerID:', customerID);

      // Check that the body variables
      // Verify user ID is passed

      if (!customerID) {
        setError("CustomerID is missing, please log in again");
        return;
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resName,
          resCustomerPhone: resCustomerPhone,
          numberOfPeople,
          tabID,
          resDate,
          resTime,
          Customer_customerID: customerID,
        }),
      });

      if (response.ok) {
        console.log('handleConfirm - Reservation created successfully!');
        const data = await response.json();
        if (data && data.resID && data.temporaryToken) {
          console.log('handleConfirm - resID:', data.resID);
          console.log('handleConfirm - temporaryToken:', data.temporaryToken);
          router.push(`/reservationsummary/${data.resID}?token=${data.temporaryToken}`);
        } else {
          console.error('handleConfirm - resID or temporaryToken is missing from the response:', data);
          setError('Failed to create reservation: resID or token missing in response');
        }
      } else {
        console.error('handleConfirm - Failed to create reservation');
        // Improved error message handling
        let errorMessage = 'Failed to create reservation';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('handleConfirm - Failed to parse error response:', e);
        }
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('handleConfirm - Error creating reservation:', error);
      setError(`Error creating reservation: ${error.message}`);
    }
  };

  const handleCancel = () => {
    router.push('/reservation');
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Reservation Summary</h1>
        <div>
          <p>Reservation Name: {resName}</p>
          <p>Phone Number: {resCustomerPhone}</p>
          <p>Number of People: {numberOfPeople}</p>
          <p>Table Number: {tabID}</p>
          <p>Date: {resDate}</p>
          <p>Time: {resTime}</p>
        </div>
        <p>Please capture this page to identify your reservation</p>
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          onClick={() => router.push('/reservation')}
        >
          Back to Form
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default ReservationSummaryPage;
// app/sidebar/page.tsx
"use client";

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SidebarPage = () => {
const { user, isLoading } = useAuth();
const router = useRouter();

useEffect(() => {
    if (!isLoading) {
        if (!user || user.CustomerEmail !== 'admin@gmail.com') {
            router.push('/login');
        }
    }
}, [user, isLoading, router]);

if (isLoading) {
    return <div>Loading...</div>;
}

if (!user) {
    return null; // Or a redirect component
}

return (
    <div>
        <Navbar />
        <div className="container mx-auto p-4">
            <Sidebar />
        </div>
    </div>
);
};

export default SidebarPage;
//app/tablemanagement/page.tsx

"use client";

import Navbar from '../components/Navbar';
import TableManagement from '../components/TableManagement';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const TableManagementPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
      if (!isLoading) {
          if (!user || user.CustomerEmail !== 'admin@gmail.com') {
              router.push('/login');
          }
      }
  }, [user, isLoading, router]);

  if (isLoading) {
      return <div>Loading...</div>;
  }

  return (
    <div>
        <Navbar />
        <div className="container mx-auto p-4">
            <TableManagement />
        </div>
    </div>
  );
};

export default TableManagementPage;
//app/layout.tsx

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Provider from './context/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
        {children}
        </Provider>
        </body>
    </html>
  )
}
//app/page.tsx

import Navbar from './components/Navbar';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <Navbar />
            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4">Welcome to Shabu Buffet Reservation System</h1>
                {user ? (
                    <p>Hello, {user.firstName}!</p>
                ) : (
                    <p>Please log in to make a reservation.</p>
                )}
            </main>
        </div>
    );
}

//pages/_app.tsx
import type { AppProps } from 'next/app'
import { AuthProvider } from '../app/context/AuthContext'; // Adjust the path if necessary

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp

//prisma\schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Customer {
  customerID    Int      @id @default(autoincrement())
  firstName     String
  lastName      String
  customerPhone String
  CustomerEmail String   @unique // ตรวจสอบว่ามี @unique attribute หรือไม่
  password      String
  cusCreatedAt  DateTime @default(now())
  reservations  Reservations[]
}

model Tables {
  tabID       Int           @id @default(autoincrement())
  tabTypes    String
  tabStatus   String?
  tabCreatedAt DateTime @default(dbgenerated("CURRENT_TIMESTAMP"))
  reservations Reservations[]
  orders       Orders[]
}

model Reservations {
  resID          Int      @id @default(autoincrement())
  resName        String
  resDate        String
  resTime        String
  numberOfPeople Int
  resStatus      String?
  resCreatedAt   DateTime @default(now())
  customer       Customer @relation(fields: [Customer_customerID], references: [customerID])
  table         Tables   @relation(fields: [Tables_tabID], references: [tabID])
  Customer_customerID Int
  Tables_tabID Int
  deletedAt      DateTime?
  tempToken      TempToken?
  resCustomerPhone String? // New field
}

model Employee {
  empID        Int           @id @default(autoincrement())
  empFname     String
  empLname     String
  empPhone     String
  position     String
  salary       Float
  orders       Orders[]
  stockIns     Stock_In[]
  timeScription TimeScription[]
}

model Orders {
  orderID      Int           @id @default(autoincrement())
  orderStatus  String?
  orderCreatedAt DateTime      @default(now())
  table        Tables        @relation(fields: [Tables_tabID], references: [tabID])
  employee     Employee      @relation(fields: [Employee_empID], references: [empID])
  orderItems   orderItem[]
  bill         Bill?
  Tables_tabID  Int
  Employee_empID Int
}

model BuffetTypes {
  buffetTypeID   Int           @id @default(autoincrement())
  buffetTypePrice Int
  buffetTypesName String        @unique
  menuItems      MenuItems[]
}

model MenuItems {
  menuItemsID     Int           @id @default(autoincrement())
  menuItemNameTHA String
  menuItemNameENG String
  menuItemsPrice  Int
  itemImage       String
  description     String?
  menuItemCreateAt DateTime      @default(now())
  category        String
  buffetType      BuffetTypes   @relation(fields: [BuffetTypes_buffetTypeID], references: [buffetTypeID])
  orderItems      orderItem[]
  BuffetTypes_buffetTypeID Int
}

model orderItem {
  Orders_orderID    Int
  MenuItems_menuItemsID Int
  Quantity         Int
  order           Orders    @relation(fields: [Orders_orderID], references: [orderID])
  menuItem        MenuItems @relation(fields: [MenuItems_menuItemsID], references: [menuItemsID])

  @@id([Orders_orderID, MenuItems_menuItemsID])
}

model Bill {
  billID        Int      @id @default(autoincrement())
  vat           Int
  paymentStatus String?
  netAmount     Float
  grandTotal    Float
  discount      Float?
  totalAmount   Float
  billCreateAt  DateTime @default(now())
  billStatus    String
  Orders_orderID Int      @unique // เพิ่ม @unique ตรงนี้
  order         Orders   @relation(fields: [Orders_orderID], references: [orderID]) //เปลี่ยนจาก Orders เป็น Orders_orderID
  payment       Payment?
}

model Payment {
  paymentID     Int      @id @default(autoincrement())
  paymentTypes  String?
  totalAmount   Float
  Bill_billID   Int      @unique // เพิ่ม @unique ตรงนี้
  bill          Bill   @relation(fields: [Bill_billID], references: [billID])//เปลี่ยนจาก Bill เป็น Bill_billID
}

model Stock {
  stockID        Int      @id @default(autoincrement())
  ingredientName String   @unique
  costPrice      Float
  Unit           String
  Quantity       Float    @default(0)
  LastUpdated    DateTime @default(now())
  timeScription  TimeScription[]
  stockInDetail  Stock_In_Detail[]
}

model TimeScription {
  Employee_empID Int
  Stock_stockID  Int
  tsCreatedAt    DateTime? @default(now())
  Unit           String?
  Quantity       Float?
  employee       Employee @relation(fields: [Employee_empID], references: [empID])
  stock         Stock      @relation(fields: [Stock_stockID], references: [stockID])

  @@id([Employee_empID, Stock_stockID])
}

model Stock_In {
  stockInID      Int      @id @default(autoincrement())
  stockInDateTime DateTime @default(now())
  totalPrice     Float
  employee       Employee @relation(fields: [Employee_empID], references: [empID])
  stockInDetail  Stock_In_Detail[]
  Employee_empID Int
}

model Stock_In_Detail {
  stockInDetailID Int      @id @default(autoincrement())
  stockIn        Stock_In @relation(fields: [Stock_In_stockInID], references: [stockInID])
  stock          Stock      @relation(fields: [Stock_stockID], references: [stockID])
  ingredientName String
  quantity       Float
  unit          String
  pricePerUnit  Float
  totalPrice    Float
  Stock_In_stockInID Int
  Stock_stockID Int
}

model TempToken {
    id        Int      @id @default(autoincrement())
    resID     Int      @unique
    token     String   @unique
    createdAt DateTime @default(now())
    expiresAt DateTime // Add an expiration time to the token
    reservation Reservations @relation(fields: [resID], references: [resID])
}