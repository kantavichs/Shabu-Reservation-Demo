"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';

// Function to safely parse JSON
// Function to safely parse JSON
async function safeJsonParse(str:string) {
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
                const responseBody = await response.text(); // Get the response body as text

                const data = await safeJsonParse(responseBody); // Then parse it safely

                // If parsing fails, handle it and exit
                if (!data) {
                    setError("Failed to parse login response");
                    return;
                }

                // 4. Handle Successful Login
                login(data.user);
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