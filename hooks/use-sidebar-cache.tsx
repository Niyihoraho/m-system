"use client";

import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRoleAccess } from "@/components/providers/role-access-provider";
import {
  Grid3x3,
  UserCircle,
  Building2,
  Calendar,
  PieChart,
  Table,
  Plug,
  Target,
  type LucideIcon,
} from "lucide-react";

// Define the NavItem type
interface NavItem {
  icon: LucideIcon;
  name: string;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro: boolean;
    icon?: LucideIcon;
  }[];
}

interface SidebarCache {
  navItems: NavItem[];
  userRole: string;
  userId: string | null;
  timestamp: number;
  version: number;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_VERSION = 1;

// Global cache store
let globalCache: SidebarCache | null = null;

export function useSidebarCache() {
  const { data: session, status } = useSession();
  const { userRole, isLoading: roleLoading } = useRoleAccess();
  const cacheRef = useRef<SidebarCache | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Listen for cache invalidation events
  useEffect(() => {
    const handleInvalidate = () => {
      globalCache = null;
      cacheRef.current = null;
      setForceRefresh(prev => prev + 1);
    };

    const handleRefresh = () => {
      globalCache = null;
      cacheRef.current = null;
      setForceRefresh(prev => prev + 1);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('sidebar-cache-invalidate', handleInvalidate);
      window.addEventListener('sidebar-cache-refresh', handleRefresh);
      
      return () => {
        window.removeEventListener('sidebar-cache-invalidate', handleInvalidate);
        window.removeEventListener('sidebar-cache-refresh', handleRefresh);
      };
    }
  }, []);

  // Check if cache is valid
  const isCacheValid = useCallback((cache: SidebarCache | null): boolean => {
    if (!cache) return false;
    
    const now = Date.now();
    const isExpired = now - cache.timestamp > CACHE_DURATION;
    const isVersionMismatch = cache.version !== CACHE_VERSION;
    const isUserMismatch = cache.userId !== session?.user?.id;
    const isRoleMismatch = cache.userRole !== userRole;
    
    return !isExpired && !isVersionMismatch && !isUserMismatch && !isRoleMismatch;
  }, [session?.user?.id, userRole]);

  // Generate navigation items based on user role
  const generateNavItems = useCallback((): NavItem[] => {
    const userScopedRole = userRole || "user";

    const baseItems: NavItem[] = [
      {
        icon: Grid3x3,
        name: "Home",
        path: "/dashboard",
      },
      {
        icon: UserCircle,
        name: "People Management",
        subItems: (() => {
          const baseItems = [
            {
              name: "Member Directory",
              path: "/links/people/members",
              pro: false,
            },
          ];

          // Only add Member Import for specific roles
          if (
            userScopedRole === "superadmin" ||
            userScopedRole === "region" ||
            userScopedRole === "university"
          ) {
            baseItems.push({
              name: "Member Import",
              path: "/links/people/import",
              pro: false,
            });
          }

          return baseItems;
        })(),
      },
      // Only show Organization for users with specific roles
      ...(userScopedRole === "superadmin" ||
      userScopedRole === "national"
        ? [
            {
              icon: Building2,
              name: "Organization",
              subItems: (() => {
                const baseItems = [
                  {
                    name: "Regions",
                    path: "/links/organization/regions",
                    pro: false,
                  },
                  {
                    name: "Universities",
                    path: "/links/organization/universities",
                    pro: false,
                  },
                  {
                    name: "Small Groups",
                    path: "/links/organization/small-groups",
                    pro: false,
                  },
                  {
                    name: "Alumni Small Groups",
                    path: "/links/organization/alumni-small-groups",
                    pro: false,
                  },
                ];
                return baseItems;
              })(),
            },
          ]
        : []),

        {
          icon: Calendar,
          name: "Activities",
          subItems: (() => {
            const baseItems = [
              {
                name: "Attendance Tracking",
                path: "/links/activities/attendance",
                pro: false,
              },
            ];
  
            // Only add Events for specific roles
            if (
              userScopedRole === "superadmin" ||
              userScopedRole === "region" ||
              userScopedRole === "university"
            ) {
              baseItems.push({
                name: "Events",
                path: "/links/activities/events",
                pro: false,
              });
            }
  
            return baseItems;
          })(),
        },
      // Only show Financial Management for users with specific roles
      ...(userScopedRole === "superadmin" ||
      userScopedRole === "national"
        ? [
            {
              icon: PieChart,
              name: "Financial Management",
              subItems: (() => {
                const baseItems: {
                  name: string;
                  path: string;
                  pro: boolean;
                  icon?: LucideIcon;
                }[] = [
                  {
                    name: "Contributions",
                    path: "/links/financial/contributions",
                    pro: false,
                  },

                  {
                    name: "Designations",
                    path: "/links/activities/designation",
                    pro: false,
                    icon: Target,
                  },
                  {
                    name: "Reports",
                    path: "/links/reports/Designations_Reports",
                    pro: false,
                  }
                ];
                return baseItems;
              })(),
            },
          ]
        : []),
      ...(userScopedRole === "superadmin" ||
        userScopedRole === "national" || 
        userScopedRole === "region" ||
        userScopedRole === "university"
          ? [{
              icon: Table,
              name: "Reports & Analytics",
              subItems: (() => {
                const baseItems = [
                  {
                    name: "Engagement Reports",
                    path: "/links/reports/engagement",
                    pro: false,
                  },
                ];

                // Only add Membership Reports for specific roles
                if (
                  userScopedRole === "superadmin" ||
                  userScopedRole === "region" ||
                  userScopedRole === "university"
                ) {
                  baseItems.push(
                    {
                      name: "Membership Reports",
                      path: "/links/reports/membership",
                      pro: false,
                    },
                
                  );
                }
                return baseItems;
              })(),
            }]
          : []),
      ...(userScopedRole === "superadmin"
          ? [{
              icon: Plug,
              name: "System Administration",
              subItems: (() => {
                const baseItems = [
                  {
                    name: "User Management",
                    path: "/links/admin/user-management",
                    pro: false,
                  },
                ];
                return baseItems;
              })(),
            }]
          : []),
    ];
    
    return baseItems;
  }, [userRole]);

  // Get cached or generate new navigation items
  const navItems = useMemo(() => {
    // If still loading session or role, return cached items to prevent flickering
    if (status === "loading" || roleLoading) {
      return globalCache?.navItems || [];
    }

    // Check if we have a valid cache
    if (isCacheValid(globalCache)) {
      return globalCache!.navItems;
    }

    // Generate new navigation items
    const newNavItems = generateNavItems();
    
    // Update cache
    const newCache: SidebarCache = {
      navItems: newNavItems,
      userRole: userRole || "user",
      userId: session?.user?.id || null,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    
    globalCache = newCache;
    cacheRef.current = newCache;
    
    return newNavItems;
  }, [status, roleLoading, userRole, session?.user?.id, isCacheValid, generateNavItems, forceRefresh]);

  // Invalidate cache function
  const invalidateCache = useCallback(() => {
    globalCache = null;
    cacheRef.current = null;
  }, []);

  // Force refresh function
  const refreshCache = useCallback(() => {
    invalidateCache();
    // The next render will generate new items
  }, [invalidateCache]);

  // Check if we're using cached data
  const isUsingCache = useMemo(() => {
    return isCacheValid(globalCache) && globalCache !== null;
  }, [isCacheValid]);

  return {
    navItems,
    isLoading: status === "loading" || roleLoading,
    isUsingCache,
    invalidateCache,
    refreshCache,
  };
}
