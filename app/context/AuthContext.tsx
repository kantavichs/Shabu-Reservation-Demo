// File: app/context/AuthContext.tsx

"use client";

import { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    customerID: number;
    firstName: string;
    lastName: string;
    CustomerEmail: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        console.log('Stored User from localStorage:', storedUser);

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing stored user from localStorage:', error);
                localStorage.removeItem('user'); // Clear invalid data
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        console.log("Saving user to localStorage: " + JSON.stringify(userData));
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        router.push('/login');
    };

    const value: AuthContextType = { user, login, logout, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
