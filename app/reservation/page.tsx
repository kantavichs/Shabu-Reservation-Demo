// File: app/reservation/page.tsx

"use client";

import Navbar from '../components/Navbar';
import ReservationForm from '../components/ReservationForm';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ReservationPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ReservationPage: User:', user); // Log user object
    console.log('ReservationPage: Is Loading:', isLoading); // Log isLoading value

    if (!isLoading) {
      console.log("ReservationPage: isLoading is false")
      if (!user) {
        console.log("ReservationPage: No user, redirecting to /login");
        router.push('/login');
      } else{
         console.log("ReservationPage: User found: " + JSON.stringify(user));
      }
    } else {
        console.log("ReservationPage: still loading. Please wait.");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If user is null, then return null
  if (!user) {
    console.log("ReservationPage: User is null after isLoading check, rendering null");
    return null;
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <ReservationForm />
      </div>
    </div>
  );
};

export default ReservationPage;
