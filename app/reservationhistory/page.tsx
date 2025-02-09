// app/reservation/page.tsx
"use client";

import Navbar from '../components/Navbar';
import ReservationHistory from '../components/ReservationHistory';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ReservationPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('User:', user);
    console.log('Is Loading:', isLoading);

    if (!isLoading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Ensure that "user" is available before rendering components
  if (!user) {
    return null; // or return a different component if needed
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <ReservationHistory />
      </div>
    </div>
  );
};

export default ReservationPage;