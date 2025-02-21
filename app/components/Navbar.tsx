import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-gray-800 p-4 text-white">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">
                    ShabuBuffet
                </Link>
                <div className="flex items-center space-x-4">
                    <Link href="/reservation">Reservation</Link>
                    <Link href="/reservationhistory">Reservation History</Link>
                    {user ? (
                        <>
                            <span>Welcome, {user.firstName}</span>
                            <button onClick={logout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">Login</Link>
                            <Link href="/register">Register</Link>
                        </>
                    )}
                    {user?.CustomerEmail === "admin" ? (
                        <Link href="/tablemanagement">Table Management</Link>
                    ) : null}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;