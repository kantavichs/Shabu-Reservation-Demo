// File: pages/_app.tsx
import type { AppProps } from 'next/app'
import { AuthProvider } from '../app/context/AuthContext'; // Adjust the path if necessary

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp