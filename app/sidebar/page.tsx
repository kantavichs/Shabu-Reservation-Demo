// File: app/sidebar/page.tsx

"use client";

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SidebarPage = () => {
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

if (!user) {
    return null; // Or a redirect component
}

return (
    <div>
        <Navbar />
        <div className="container mx-auto p-4">
            <Sidebar />
        </div>
    </div>
);
};

export default SidebarPage;
