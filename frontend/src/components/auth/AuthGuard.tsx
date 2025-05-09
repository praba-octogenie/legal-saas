import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import jwtDecode from 'jwt-decode';

import { selectAuth, refreshToken, logout } from '@/store/slices/authSlice';
import { isTokenExpired } from '@/utils/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

interface JwtPayload {
  exp: number;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(selectAuth);

  useEffect(() => {
    // Check if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Check if token is about to expire and refresh it
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const expiresIn = decoded.exp - Date.now() / 1000;

        // If token expires in less than 5 minutes, refresh it
        if (expiresIn < 300) {
          dispatch(refreshToken());
        }

        // If token is already expired, logout
        if (isTokenExpired(decoded.exp)) {
          dispatch(logout());
          router.push('/auth/login');
        }
      } catch (error) {
        dispatch(logout());
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, token, router, dispatch]);

  // If not authenticated, don't render children
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;