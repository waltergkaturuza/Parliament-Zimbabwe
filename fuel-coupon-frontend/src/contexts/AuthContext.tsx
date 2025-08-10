import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
    useRef,
    FC,
  } from 'react';
  import axios from 'axios';
  import { toast } from 'react-toastify';
  import { decodeJWT } from '@/utils/jwt';
import apiClient from '@/api';
  
  type Role = 'SUPERUSER' | 'ADMIN' | 'MAIN_CENTER' | 'SUB_CENTER' | 'BENEFICIARY' | 'AUDITOR' | 'MAIN_CENTER_APPROVER' | 'SUB_CENTER_APPROVER';
  
  interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    role: Role;
    is_superuser?: boolean;
    centerId?: number;
    permissions?: string[];
  }
  
  interface TokenData {
    access: string;
    refresh: string;
  }
  
  interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    userRole: Role | null;
    accessToken: string | null;
    login: (tokenData: TokenData, onSuccess?: () => void) => Promise<void>;
    logout: (onLogout?: () => void) => void;
    checkAuth: () => boolean;
    isAuthLoading: boolean;
    refreshToken: () => Promise<string | undefined>;
    hasRole: (roles: Role[]) => boolean;
    isSuperAdmin: () => boolean;
    isMainCenter: () => boolean;
    isSubCenter: () => boolean;
    isBeneficiary: () => boolean;
    isAuditor: () => boolean;
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
    const isInitializing = useRef(false); // Flag to prevent multiple initializations
  
    const storeTokens = (access: string, refresh: string) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    };
  
    const clearTokens = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    };
  
    const logout = useCallback((onLogout?: () => void) => {
      clearTokens();
      setAccessToken(null);
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
      setIsAuthLoading(false); // Ensure loading is false on logout
      toast.info('You have been logged out');
      onLogout?.();
    }, []); // logout doesn't depend on anything that changes externally
  
    const refreshToken = useCallback(async (): Promise<string | undefined> => {
      const now = Date.now();
      // Prevent rapid refresh attempts
      if (now - lastRefreshTime < 30000) {
          console.log('Skipping token refresh due to rate limit.');
          return; // Return undefined as no new token was obtained
      }
      setLastRefreshTime(now); // Update last refresh time
  
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.warn('No refresh token available for refresh.');
          // If no refresh token, force logout (which sets loading to false)
          logout();
          return undefined;
        }
  
        const response = await axios.post('/api/token/refresh/', { refresh: refreshToken });
        const newAccessToken = response.data.access;        // Store the new access token, keep the existing refresh token
        localStorage.setItem('access_token', newAccessToken);
        setAccessToken(newAccessToken);
  
        console.log('Token refreshed successfully.');
        return newAccessToken;
      } catch (error) {
        console.error('Refresh token failed:', error);
        // If refresh fails, force logout (which sets loading to false)
        logout();
        // Don't re-throw here, just log and let the promise resolve to undefined
        return undefined;
      }
    }, [logout, lastRefreshTime]); // Added lastRefreshTime to dependencies
  
    const initializeAuth = useCallback(async (): Promise<boolean> => {
      if (isInitializing.current) {
          console.log('Initialization already in progress.');
          return isAuthenticated; // Return current state if already initializing
      }
  
      isInitializing.current = true;
      setIsAuthLoading(true); // Start loading
  
      console.log('Starting authentication initialization.');
      const token = localStorage.getItem('access_token');
      setAccessToken(token);
  
      if (!token) {
        console.log('No access token found during initialization.');
        setIsAuthLoading(false); // No token, set loading to false
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
        isInitializing.current = false;
        return false;
      }
  
      try {
        const decoded = decodeJWT(token);
        if (decoded && decoded.user_id) {
          console.log('Token decoded successfully during initialization.');
          const userData: User = { ...decoded } as User;
          setUser(userData);
          setUserRole(decoded.role as Role);
          setIsAuthenticated(true);
          setIsAuthLoading(false); // SUCCESS PATH: Set loading to false
          isInitializing.current = false;
          return true;
        } else {
          console.error('Invalid token payload after decoding during initialization.');
          // If token exists but payload is invalid, treat as unauthenticated
          console.log('Attempting token refresh after invalid payload.');
          const newAccessToken = await refreshToken(); // refreshToken handles logout if needed
          if (newAccessToken) {
             console.log('Token refreshed successfully after invalid payload.');
             // If refresh was successful, try initializing again with the new token
             const success = await initializeAuth();
             isInitializing.current = false; // Ensure flag is reset
             return success;
          } else {
             console.error('Refresh token failed after invalid payload.');
             // refreshToken or logout would have set loading to false
             isInitializing.current = false;
             return false;
          }
        }
      } catch (error) {
        console.error('Token decode failed during initialization:', error);
        // If decode fails entirely, attempt refresh or force logout
         console.log('Attempting token refresh after decode error.');
        const newAccessToken = await refreshToken(); // refreshToken handles logout if needed
         if (newAccessToken) {
           console.log('Token refreshed successfully after decode error.');
           const success = await initializeAuth();
           isInitializing.current = false;
           return success;
         } else {
           console.error('Refresh token failed after decode error.');
           // refreshToken or logout would have set loading to false
           isInitializing.current = false;
           return false;
         }
      } finally {
          // Ensure isInitializing flag is reset even if there's an unexpected issue
          // This might be redundant with the explicit settings above, but adds safety
          // isInitializing.current = false;
          // Ensure loading is false on unexpected exit
          // if (isAuthLoading) setIsAuthLoading(false);
      }
    }, [logout, refreshToken]); // Removed isAuthenticated from dependencies
  
    const checkAuth = useCallback(() => isAuthenticated, [isAuthenticated]);
  
    const hasRole = useCallback((roles: Role[]) => {
      return user ? roles.includes(user.role) : false;
    }, [user]);
    const isSuperAdmin = useCallback(() => hasRole(['SUPERUSER']), [hasRole]);
    const isMainCenter = useCallback(() => hasRole(['MAIN_CENTER']), [hasRole]);
    const isSubCenter = useCallback(() => hasRole(['SUB_CENTER']), [hasRole]);
    const isBeneficiary = useCallback(() => hasRole(['BENEFICIARY']), [hasRole]);
    const isAuditor = useCallback(() => hasRole(['AUDITOR']), [hasRole]);
  
    // Sync auth across tabs
    useEffect(() => {
      const handleStorage = (event: StorageEvent) => {
        if (['access_token', 'refresh_token'].includes(event.key || '')) {
            console.log(`Storage event detected for ${event.key}. Re-initializing auth.`);
          const access = localStorage.getItem('access_token');
          const refresh = localStorage.getItem('refresh_token');
          if (!access || !refresh) {
            logout(); // Storage cleared in another tab, log out here
          } else {
            initializeAuth(); // Storage updated, re-initialize
          }
        }
      };
  
      console.log('Setting up storage listener.');
      window.addEventListener('storage', handleStorage);
      return () => {
          console.log('Cleaning up storage listener.');
          window.removeEventListener('storage', handleStorage);
      };
    }, [logout, initializeAuth]); // Dependencies are correct here
  
    // Initial authentication check and setup for periodic refresh
    useEffect(() => {
      console.log('Auth initialization useEffect running.');
      // Perform initial authentication check when the component mounts
      initializeAuth();
  
      // Setup the interval for refreshing tokens
      const interval = setInterval(() => {
        // Only attempt refresh if a refresh token exists (implies user was logged in)
        if (localStorage.getItem('refresh_token')) {
          console.log('Attempting background token refresh due to interval.');
          refreshToken().catch(console.error);
        }
      }, 25 * 60 * 1000); // Refresh every 25 minutes
  
      return () => {
          console.log('Auth initialization useEffect cleanup.');
          clearInterval(interval); // Clear the interval on component unmount
      }
    }, [initializeAuth, refreshToken]); // Dependencies needed: initializeAuth and refreshToken
  
  
    // Axios interceptor to retry on 401
    useEffect(() => {
       console.log('Setting up Axios interceptor.');
      const interceptor = axios.interceptors.response.use(
        response => response,
        async error => {
          const originalRequest = error.config;
  
          // If the error is a 401 and we haven't already retried this request
          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark this request as retried
  
            try {
              console.log('401 error, attempting token refresh from interceptor.');
              const newAccessToken = await refreshToken(); // Attempt to refresh the token
              if (newAccessToken) {
                // Update default headers for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                // Update header for the original failed request
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                console.log('Retrying original request with new token.');
                return axios(originalRequest); // Retry the original request
              } else {
                   console.error('Refresh token failed from interceptor, forcing logout.');
                   // If refresh fails, navigate to login page
                   logout(() => (window.location.href = '/login'));
                   // Do not retry, reject the original error
                   return Promise.reject(error);
               }
            } catch (refreshError) {
              console.error('Error during token refresh or retrying original request:', refreshError);
              // If there's an error during refresh or retry, force logout
              logout(() => (window.location.href = '/login'));
              // Reject the original error
              return Promise.reject(error);
            }
          }
          // For all other errors, or if retry failed, just reject the error
          return Promise.reject(error);
        }
      );
  
      return () => {
          console.log('Ejecting Axios interceptor.');
          axios.interceptors.response.eject(interceptor); // Clean up the interceptor
      };
    }, [refreshToken, logout]); // Dependencies: refreshToken and logout are used inside the interceptor
      const login = useCallback(
      async (tokenData: TokenData, onSuccess?: () => void) => {
        setIsAuthLoading(true); // Start loading
        console.log('Attempting login with token data:', tokenData);
        try {
          storeTokens(tokenData.access, tokenData.refresh);
          setAccessToken(tokenData.access);
  
          const decoded = decodeJWT(tokenData.access);
          console.log('Decoded JWT:', decoded);
          
          if (!decoded || !decoded.user_id) {
              console.error('Invalid token payload after login:', decoded);
              throw new Error('Invalid token payload'); // Throw to enter catch block
          }
  
          // Create user object from JWT payload and any additional data from login response
          const userData: User = {
            id: decoded.user_id,
            username: decoded.username || '',
            email: '', // Will be populated from API if needed
            name: decoded.username || '',
            role: decoded.role as Role,
            is_superuser: decoded.is_superuser || false,
            centerId: decoded.sub_center_id || undefined,
            permissions: decoded.permissions || []
          };
          
          console.log('Created user data:', userData);
          
          setUser(userData);
          setUserRole(decoded.role as Role);
          setIsAuthenticated(true);
          console.log('Auth context login successful, calling onSuccess callback');
          onSuccess?.();
        } catch (error) {
          console.error('Login failed:', error);
          toast.error('Login failed. Please try again.');
          logout(); // logout handles setting loading to false and clearing tokens
        } finally {
          // Ensure loading is false after login attempt completes (success or failure)
          setIsAuthLoading(false);
        }
      },
      [logout] // Removed isAuthLoading from dependency array to avoid issues
    );
  
    return (
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated,
          userRole,
          accessToken,
          login,
          logout,
          checkAuth,
          isAuthLoading, // Provide the loading state
          refreshToken,
          hasRole,
          isSuperAdmin,
          isMainCenter,
          isSubCenter,
          isBeneficiary,
          isAuditor,
        }}
      >
        {/* Optionally render a loading spinner here if isAuthLoading is true */}
        {/* {isAuthLoading ? <div>Loading Authentication...</div> : children} */}
        {children} {/* Render children whether loading or not, DashboardRedirect handles showing content */}
      </AuthContext.Provider>
    );
  };
  
  export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }
