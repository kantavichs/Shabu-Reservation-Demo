"use client";

import { AuthProvider } from '../context/AuthContext';

interface Props {
    children: React.ReactNode;
}

const Provider = ({ children }: Props) => {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    )
}

export default Provider;