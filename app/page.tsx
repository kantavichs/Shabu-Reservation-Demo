// File: app/page.tsx

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
