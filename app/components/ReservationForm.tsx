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

    const generateTimeOptions = () => {
        const startTime = 10 * 60; // 10:00 AM in minutes
        const endTime = 21 * 60; // 9:00 PM in minutes
        const interval = 5; // 5 minutes interval
        const options = [];

        for (let i = startTime; i <= endTime; i += interval) {
            const hours = Math.floor(i / 60);
            const minutes = i % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            options.push(<option key={timeString} value={timeString}>{timeString}</option>);
        }
        return options;
    };

    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const confirmReservation = async (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams({
            resName: resName,
            customerPhone: customerPhone,
            numberOfPeople: String(numberOfPeople),
            tabID: tabID,
            resDate: resDate,
            resTime: resTime,
            Customer_customerID: String(user?.customerID),
        });

        router.push(`/reservationsummary?${params.toString()}`);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reservation Form</h1>
            <form onSubmit={confirmReservation} className="space-y-4">
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
                        min={getCurrentDate()} // กำหนดค่า min
                        required
                    />
                </div>
                <div>
                    <label htmlFor="resTime" className="block text-gray-700 text-sm font-bold mb-2">Time:</label>
                    <select
                      id="resTime"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={resTime}
                      onChange={(e) => setResTime(e.target.value)}
                      required
                    >
                      <option value="">Select Time</option>
                      {generateTimeOptions()}
                    </select>
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
        </div>
    );
};

export default ReservationForm;