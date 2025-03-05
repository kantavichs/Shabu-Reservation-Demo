// File: app/lib/utils.ts

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
