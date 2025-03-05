// File: app/reservationmanagement/page.tsx

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
