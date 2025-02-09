// app/reservation/page.tsx
"use client";

import Navbar from '../components/Navbar';
import ReservationForm from '../components/ReservationForm';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ReservationPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('User:', user); // Log user object
    console.log('Is Loading:', isLoading); // Log isLoading value

    if (!isLoading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If user is null, then return null
  if (!user) {
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