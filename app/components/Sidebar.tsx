// File: app/components/Sidebar.tsx

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
 Customer_customerID:number;
 resCreatedAt:Date;
  deletedAt: Date | null; // Add this line
}

const Sidebar = () => {
 const [confirmedReservations, setConfirmedReservations] = useState<Reservation[]>([]);

 const fetchConfirmedReservations = useCallback(async () => {
     try {
         const response = await fetch('/api/reservations');
         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
         }
         const data = await response.json();
         const sortedConfirmed = data
             .filter((reservation: Reservation) => reservation.resStatus === 'confirmed')
             .sort((a: Reservation, b: Reservation) => b.resID - a.resID); // Sort by resID descending
         setConfirmedReservations(sortedConfirmed);
     } catch (error) {
         console.error("Could not fetch confirmed reservations:", error);
     }
 }, []);

 useEffect(() => {
     fetchConfirmedReservations();
 }, [fetchConfirmedReservations]);

const handleSoftDelete = async (resID: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this reservation?");
    if (confirmDelete) {
         try {
          const deletedAtDate = new Date()
              const response = await fetch(`/api/reservations/${resID}`, {
                  method: 'PATCH', // Use PATCH to update the deletedAt date
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ deletedAt:  deletedAtDate}), // Soft delete: set deletedAt to current date
              });

              if (response.ok) {
                 fetchConfirmedReservations(); // Refresh the reservation list
              } else {
                   // Parse the error response
                   try {
                       const errorData = await response.json();
                       console.error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                   } catch (jsonError) {
                       console.error(`HTTP error! status: ${response.status}, but failed to parse error response.`, response);
                   }
                   console.error('Failed to delete reservation');
              }
          } catch (error) {
              console.error('Error deleting reservation:', error);
          }
      }
  };

 return (
     <div className="bg-gray-100 p-4 h-screen w-64">
         <h2 className="text-lg font-bold mb-4">Confirmed Reservations</h2>
         <ul>
             {confirmedReservations.map(reservation => (
                 <li key={reservation.resID} className="mb-2 p-2 bg-white rounded shadow">
                     <div>{reservation.resName}</div>
                     <div>Table: {reservation.Tables_tabID}</div>
                     <div>Time: {reservation.resTime}</div>
                      <div>Created At: {moment.utc(reservation.resCreatedAt).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm:ss')}</div>
                     <button
                         onClick={() => handleSoftDelete(reservation.resID)}
                         className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mt-2 text-xs"
                     >
                         Delete
                     </button>
                 </li>
             ))}
         </ul>
     </div>
 );
};

export default Sidebar;
