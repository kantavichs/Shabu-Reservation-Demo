// File: app/components/ReservationHistory.tsx

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
                const url = `/api/reservations/getbycustomer?customerId=${user?.customerID}`;
            console.log("Fetching reservations from:", url); // Log the URL
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
