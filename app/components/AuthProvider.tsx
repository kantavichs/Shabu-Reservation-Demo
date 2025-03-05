// File: app/components/AuthProvider.tsx

"use client";

import { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
    customerID: number;
    firstName: string;
    lastName: string;
    CustomerEmail: string;
    token: string; // Add the token property
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
        console.log('Stored User:', storedUser); // Log the value of storedUser
    
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('Parsed User:', parsedUser); // Log the parsed user object
                setUser(parsedUser);
            } catch (error: any) {
                console.error('Error parsing stored user:', error);
                console.error('Raw cookie value:', storedUser); // Log the raw cookie value
    
                // Handle parsing error (e.g., clear cookie)
                Cookies.remove('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        console.log("Saving user to localStorage: " + JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);  // Set state *before* navigating
    
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
