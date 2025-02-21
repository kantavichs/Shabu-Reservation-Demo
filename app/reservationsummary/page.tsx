"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';

const ReservationSummaryPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const resName = searchParams.get('resName') || '';
    const customerPhone = searchParams.get('customerPhone') || '';
    const numberOfPeople = searchParams.get('numberOfPeople') || '';
    const tabID = searchParams.get('tabID') || '';
    const resDate = searchParams.get('resDate') || '';
    const resTime = searchParams.get('resTime') || '';
    const customerID = searchParams.get('Customer_customerID') || '';

    const handleConfirm = async () => {
        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resName,
                    customerPhone,
                    numberOfPeople,
                    tabID,
                    resDate,
                    resTime,
                    Customer_customerID: customerID,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/reservationdetail/${data.resID}`); // เปลี่ยนตรงนี้
            } else {
                console.error('Failed to create reservation');
                setError('Failed to create reservation');
            }
        } catch (error) {
            console.error('Error creating reservation:', error);
            setError('Error creating reservation');
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
                    <p>Phone Number: {customerPhone}</p>
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