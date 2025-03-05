// File: app\reservationsummary\[resID]\page.tsx

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
