// File: app/reservationsummary/page.tsx

"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';
import moment from 'moment-timezone';

const ReservationSummaryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth(); // Rename the user from auth

  const [error, setError] = useState<string | null>(null);

  // Safely access search parameters using the nullish coalescing operator (??)
  const resName = searchParams?.get('resName') || '';
  const resCustomerPhone = searchParams?.get('resCustomerPhone') || '';
  const numberOfPeople = searchParams?.get('numberOfPeople') || '';
  const tabID = searchParams?.get('tabID') || '';
  const resDate = searchParams?.get('resDate') || '';
  const resTime = searchParams?.get('resTime') || '';

  const customerID = authUser?.customerID; // Safely access the customerID from the authUser object

  const handleConfirm = async () => {
    try {
      console.log('handleConfirm - Starting reservation creation...');
      console.log('handleConfirm - resName:', resName);
      console.log('handleConfirm - resDate:', resDate);
      console.log('handleConfirm - resTime:', resTime);
      console.log('handleConfirm - customerID:', customerID);

      // Check that the body variables
      // Verify user ID is passed

      if (!customerID) {
        setError("CustomerID is missing, please log in again");
        return;
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resName,
          resCustomerPhone: resCustomerPhone,
          numberOfPeople,
          tabID,
          resDate,
          resTime,
          Customer_customerID: customerID,
        }),
      });

      if (response.ok) {
        console.log('handleConfirm - Reservation created successfully!');
        const data = await response.json();
        if (data && data.resID && data.temporaryToken) {
          console.log('handleConfirm - resID:', data.resID);
          console.log('handleConfirm - temporaryToken:', data.temporaryToken);
          router.push(`/reservationsummary/${data.resID}?token=${data.temporaryToken}`);
        } else {
          console.error('handleConfirm - resID or temporaryToken is missing from the response:', data);
          setError('Failed to create reservation: resID or token missing in response');
        }
      } else {
        console.error('handleConfirm - Failed to create reservation');
        // Improved error message handling
        let errorMessage = 'Failed to create reservation';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('handleConfirm - Failed to parse error response:', e);
        }
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('handleConfirm - Error creating reservation:', error);
      setError(`Error creating reservation: ${error.message}`);
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
          <p>Phone Number: {resCustomerPhone}</p>
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
