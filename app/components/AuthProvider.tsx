"use client";

import { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
    customerID: number;
    firstName: string;
    lastName: string;
    CustomerEmail: string;
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
        const storedUser = Cookies.get('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        Cookies.set('user', JSON.stringify(userData));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        Cookies.remove('user');
        router.push('/login');
    };

    const value: AuthContextType = { user, login, logout, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};