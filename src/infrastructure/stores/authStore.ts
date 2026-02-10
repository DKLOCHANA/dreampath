// src/infrastructure/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/domain/entities/User';
import { setCurrentUserId } from '@/data/localDataService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
      
      setUser: (user) => {
        // Set the current user ID for user-specific storage
        setCurrentUserId(user?.id || null);
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false,
        });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setInitialized: (isInitialized) => set({ isInitialized, isLoading: false }),
      
      updateUserProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { 
              ...currentUser, 
              ...updates, 
              updatedAt: new Date() 
            } 
          });
        }
      },
      
      logout: () => {
        // Clear the current user ID but keep data persisted
        setCurrentUserId(null);
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'dreampath-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsOnboardingCompleted = () => useAuthStore((state) => state.user?.onboardingCompleted ?? false);
