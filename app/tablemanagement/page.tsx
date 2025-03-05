// File: app/tablemanagement/page.tsx

"use client";

import Navbar from '../components/Navbar';
import TableManagement from '../components/TableManagement';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const TableManagementPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
      if (!isLoading) {
          if (!user || user.CustomerEmail !== 'admin@gmail.com') {
              router.push('/login');
          }
      }
  }, [user, isLoading, router]);

  if (isLoading) {
      return <div>Loading...</div>;
  }

  return (
    <div>
        <Navbar />
        <div className="container mx-auto p-4">
            <TableManagement />
        </div>
    </div>
  );
};

export default TableManagementPage;
