"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

interface Table {
    tabID: number;
    tabTypes: string;
    tabStatus: string | null;
}

const ReservationForm = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [resName, setResName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [tabID, setTabID] = useState('');
    const [resDate, setResDate] = useState('');
    const [resTime, setResTime] = useState('');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [reservationSummary, setReservationSummary] = useState<any>(null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setReservationSummary({
            resName,
            customerPhone,
            numberOfPeople,
            tabID,
            resDate,
            resTime
        });
        setConfirmDialogOpen(true);
    };

    const confirmReservation = async () => {
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
                    Customer_customerID: user?.customerID,
                }),
            });

            if (response.ok) {
                setConfirmDialogOpen(false);
                router.push('/reservationhistory');
            } else {
                console.error('Failed to create reservation');
            }
        } catch (error) {
            console.error('Error creating reservation:', error);
        }
    };

    const cancelReservation = () => {
        setReservationSummary(null);
        setConfirmDialogOpen(false);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reservation Form</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                        required
                    />
                </div>
                <div>
                    <label htmlFor="resTime" className="block text-gray-700 text-sm font-bold mb-2">Time:</label>
                    <input
                        type="time"
                        id="resTime"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={resTime}
                        onChange={(e) => setResTime(e.target.value)}
                        required
                    />
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

            {confirmDialogOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-bold text-gray-800">Confirm Reservation</h3>
                        <div className="mt-2 text-gray-600">
                            <p>Please confirm your reservation details:</p>
                            <p>Reservation Name: {reservationSummary.resName}</p>
                            <p>Phone Number: {reservationSummary.customerPhone}</p>
                            <p>Number of People: {reservationSummary.numberOfPeople}</p>
                            <p>Table Number: {reservationSummary.tabID}</p>
                            <p>Date: {reservationSummary.resDate}</p>
                            <p>Time: {reservationSummary.resTime}</p>
                        </div>
                        <div className="items-center px-4 py-3">
                            <button
                                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                                onClick={confirmReservation}
                            >
                                Confirm
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mt-2"
                                onClick={cancelReservation}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationForm;