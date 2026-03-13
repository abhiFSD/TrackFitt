import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenAPI } from '../services/api';
import { UserTokenBalance } from '../interfaces';
import { useAuth } from './AuthContext';

// Add debounce utility
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

interface TokenContextType {
  tokenBalance: number;
  refreshTokenBalance: () => Promise<void>;
  isLoading: boolean;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

interface TokenProviderProps {
  children: ReactNode;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated, currentUser } = useAuth();
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Minimum time between fetches in milliseconds (5 seconds)
  const MIN_FETCH_INTERVAL = 5000;

  const fetchTokenBalance = async () => {
    // Check if we should throttle the request
    const now = Date.now();
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      console.log("Throttling token balance fetch - too soon since last fetch");
      return;
    }
    
    if (!isAuthenticated || !currentUser) {
      console.log("Not authenticated or no current user, setting token balance to 0");
      setTokenBalance(0);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Fetching token balance...");
      setLastFetchTime(now);
      
      const balanceData = await tokenAPI.getBalance();
      console.log("Token balance received:", balanceData);
      
      if (balanceData && typeof balanceData.balance === 'number') {
        setTokenBalance(balanceData.balance);
      } else {
        console.error('Invalid token balance data:', balanceData);
        // Set a default value if the data is invalid
        setTokenBalance(0);
      }
    } catch (err) {
      console.error('Error fetching token balance:', err);
      // Set a default value if there was an error
      setTokenBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Create debounced version of the fetch function
  const debouncedFetchTokenBalance = React.useCallback(
    debounce(fetchTokenBalance, 300),
    [isAuthenticated, currentUser]
  );

  // Fetch token balance when auth state changes
  useEffect(() => {
    console.log("Auth state changed, isAuthenticated:", isAuthenticated);
    debouncedFetchTokenBalance();
  }, [isAuthenticated, currentUser, debouncedFetchTokenBalance]);

  // Refresh token balance less frequently (every 60 seconds instead of 30)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const intervalId = setInterval(() => {
      console.log("Refreshing token balance on interval");
      fetchTokenBalance();
    }, 60000); // Changed from 30000 to 60000
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const refreshTokenBalance = async () => {
    console.log("Manually refreshing token balance");
    await fetchTokenBalance();
  };

  return (
    <TokenContext.Provider
      value={{
        tokenBalance,
        refreshTokenBalance,
        isLoading
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = (): TokenContextType => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}; 