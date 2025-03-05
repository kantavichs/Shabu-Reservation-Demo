// File: app/components/ReservationManagement.tsx

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
                // **Improved Error Handling:**
                try {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || 'Failed to confirm reservation'; // Fallback message
                    console.error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
                    alert(`Failed to confirm reservation: ${errorMessage}`); // Show user the error
                } catch (parseError) {
                    console.error(`HTTP error! status: ${response.status}, but failed to parse error response.`);
                    alert('Failed to confirm reservation.  Please check console for details.'); // Generic message
                }
            }
        } catch (error) {
            console.error('Error confirming reservation:', error);
            alert('Error confirming reservation. Please check console for details.');
        }
    };

    const handleCancel = async (resID: number) => {
        // Inside handleCancel function in ReservationManagement.tsx
        console.log(`Confirming reservation with resID: ${resID} and resStatus: confirmed`); // Add this logging
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
