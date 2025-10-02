"use client";

import * as React from "react";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Grid3x3,
  UserCircle,
  Building2,
  Calendar,
  PieChart,
  Table,
  Plug,
  GalleryVerticalEnd,
  Target,
  type LucideIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { NoSSR } from "@/components/no-ssr";
import { useRoleAccess } from "@/components/providers/role-access-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

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

// Sample data for teams
const data = {
  teams: [
    {
      name: "GBUR Management",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status: _status } = useSession();
  const { userRole } = useRoleAccess();

  // Get user role from shared context with fallback - always render with available data
  const userScopedRole = userRole || "user";

  const navItems = useMemo((): NavItem[] => {
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
    // Dependency array ensures this only recalculates when userScopedRole changes
  }, [userScopedRole]);

  // Transform navItems to match NavMain expected format
  const navMainItems = navItems.map((item) => ({
    title: item.name,
    url: item.path || "#",
    icon: item.icon,
    isActive: false,
    items:
      item.subItems?.map((subItem) => ({
        title: subItem.name,
        url: subItem.path,
        icon: subItem.icon,
      })) || [],
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NoSSR
          fallback={
            <div className="h-12 w-full animate-pulse bg-muted rounded" />
          }
        >
          <TeamSwitcher teams={data.teams} />
        </NoSSR>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NoSSR
          fallback={
            <div className="h-12 w-full animate-pulse bg-muted rounded" />
          }
        >
          {session?.user ? (
            <NavUser
              user={{
                name: session.user.name || "User",
                email: session.user.email || "",
                avatar: session.user.image || "",
                username: session.user.username || "",
                roles: session.user.roles || [],
              }}
            />
          ) : (
            <div className="p-2 text-center text-sm text-muted-foreground">
              Not logged in
            </div>
          )}
        </NoSSR>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}