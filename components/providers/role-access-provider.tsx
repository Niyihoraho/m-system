"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

export type UserRole = 'superadmin' | 'national' | 'region' | 'university' | 'smallgroup' | 'alumnismallgroup';

interface UserScope {
  scope: UserRole;
  region?: { id: number; name: string };
  university?: { id: number; name: string; regionId: number };
  smallGroup?: { id: number; name: string; regionId: number; universityId: number };
  alumniGroup?: { id: number; name: string; regionId: number };
}

interface RoleAccessContextType {
  userScope: UserScope | null;
  isLoading: boolean;
  userRole: UserRole | null;
}

const RoleAccessContext = createContext<RoleAccessContextType>({
  userScope: null,
  isLoading: true,
  userRole: null,
});

export function RoleAccessProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userScope, setUserScope] = useState<UserScope | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserScope = async () => {
      if (status === "loading") return;
      
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/members/current-user-scope');
        if (response.ok) {
          const data = await response.json();
          setUserScope(data.scope);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch user scope:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
        }
      } catch (error) {
        console.error('Error fetching user scope:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserScope();
  }, [session, status]);

  const value = {
    userScope,
    isLoading: status === "loading" || isLoading,
    userRole: userScope?.scope || null,
  };

  return (
    <RoleAccessContext.Provider value={value}>
      {children}
    </RoleAccessContext.Provider>
  );
}

export function useRoleAccess() {
  const context = useContext(RoleAccessContext);
  if (context === undefined) {
    throw new Error('useRoleAccess must be used within a RoleAccessProvider');
  }
  return context;
}

