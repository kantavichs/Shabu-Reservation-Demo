"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';
import { useParams } from 'next/navigation';

interface Reservation {
    resID: number;
    resName: string;
    customerPhone: string;
    numberOfPeople: number;
    tabID: string;
    resDate: string;
    resTime: string;
    resStatus: string; // เพิ่ม resStatus
}

const ReservationDetailPage = () => {
    const router = useRouter();
    const { resID } = useParams<{ resID: string }>();
    const [reservationDetails, setReservationDetails] = useState<Reservation | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReservation = async () => {
            try {
                const response = await fetch(`/api/reservations/${resID}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setReservationDetails(data);
            } catch (error) {
                console.error('Error fetching reservation details:', error);
                setError('Error fetching reservation details');
            }
        };

        fetchReservation();
    }, [resID]);

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
                    <p>Loading reservation details...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Reservation Detail</h1>
                <div>
                    <p>Reservation Name: {reservationDetails.resName}</p>
                    <p>Phone Number: {reservationDetails.customerPhone}</p>
                    <p>Number of People: {reservationDetails.numberOfPeople}</p>
                    <p>Table Number: {reservationDetails.tabID}</p>
                    <p>Date: {reservationDetails.resDate}</p>
                    <p>Time: {reservationDetails.resTime}</p>
                    <p>Status: {reservationDetails.resStatus}</p> {/* แสดงสถานะ */}
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

export default ReservationDetailPage;