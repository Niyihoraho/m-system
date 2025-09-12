"use client"

import * as React from "react"
import { useMemo } from "react"
import {
  Grid3x3,
  UserCircle,
  Building2,
  Calendar,
  PieChart,
  Table,
  Plug,
  GalleryVerticalEnd,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Define the NavItem type
interface NavItem {
  icon: LucideIcon;
  name: string;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro: boolean;
  }[];
}

// Sample data for teams and user
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "GBUR Management",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Mock user role data - replace with actual user context
  const userScopedRole = 'superadmin'; // Replace with actual user role
  const userRole = 'superadmin'; // Replace with actual user role
  const isLoadingRole = false; // Replace with actual loading state

  const navItems = useMemo((): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        icon: Grid3x3,
        name: 'Home',
        path: '/dashboard',
      },
      {
        icon: UserCircle,
        name: 'People Management',
        subItems: (() => {
          const baseItems = [
            { name: 'Member Directory', path: '/links/people/members', pro: false }
          ];
          
          // Only add Member Import for specific roles
          if (userScopedRole === 'superadmin' || userScopedRole === 'regional' || userScopedRole === 'university' || (isLoadingRole && userRole === 'superadmin')) {
            baseItems.push({ name: 'Member Import', path: '/links/people/import', pro: false });
          }
          
          return baseItems;
        })(),
      },
        // Only show Financial Management for users with specific roles
  ...(userScopedRole === 'superadmin'|| userScopedRole === 'national' || (isLoadingRole && userRole === 'superadmin') ? [{
    icon: Building2,
    name: 'Organization',
    subItems: (() => {
      const baseItems = [
      { name: 'Regions', path: '/links/organization/regions', pro: false },
      { name: 'Universities', path: '/links/organization/universities', pro: false },
      { name: 'Small Groups', path: '/links/organization/small-groups', pro: false },
      { name: 'Alumni Small Groups', path: '/links/organization/alumni-small-groups', pro: false },
      ];
      return baseItems;
    })(),
  }] : []),

  {
    icon: Calendar,
    name: 'Activities',
    subItems: (() => {
      const baseItems = [
        { name: 'Attendance Tracking', path: '/links/activities/attendance', pro: false },
      { name: 'Events', path: '/links/activities/events', pro: false },
      ];
      
      // Only add Training Programs for specific roles
      if (userScopedRole === 'superadmin' || userScopedRole === 'regional' || userScopedRole === 'university' || (isLoadingRole && userRole === 'superadmin')) {
        baseItems.push({ name: 'Training Programs', path: '/links/activities/training', pro: false });
      }
      
      return baseItems;
    })(),
  },
  // Only show Financial Management for users with specific roles
  ...(userScopedRole === 'superadmin'|| userScopedRole === 'national' || (isLoadingRole && userRole === 'superadmin') ? [{
    icon: PieChart,
    name: 'Financial Management',
    subItems: (() => {
      const baseItems = [
        { name: 'Contributions', path: '/links/financial/contributions', pro: false },
 
        { name: 'Designations', path: '/links/financial/designations', pro: false },
      ];
      return baseItems;
    })(),
  }] : []),
  {
    icon: Table,
    name: 'Reports & Analytics',
    subItems: (() => {
      const baseItems = [
        { name: 'Engagement Reports', path: '/links/reports/engagement', pro: false }
      ];
      
      // Only add Membership Reports and Financial Reports for specific roles
      if (userScopedRole === 'superadmin' || userScopedRole === 'regional' || userScopedRole === 'university' || (isLoadingRole && userRole === 'superadmin')) {
        baseItems.push({ name: 'Membership Reports', path: '/links/reports/membership', pro: false },
          { name: 'Financial Reports', path: '/links/reports/financial', pro: false },);
      }  
      return baseItems;
    })(),
  },
    ];

    // Only show System Administration for users with superadmin scoped role
    if (userScopedRole === 'superadmin' || (isLoadingRole && userRole === 'superadmin')) {
      baseItems.push({
        icon: Plug,
        name: 'System Administration',
        subItems: (() => {
          const baseItems = [
            { name: 'User Management', path: '/links/admin/user-management', pro: false },
            { name: 'Role Requests', path: '/links/admin/roles', pro: false },
            { name: 'Emergency Access', path: '/links/admin/emergency', pro: false },
          ];
          return baseItems;
        })(),
      });
    }

    return baseItems;
    // Dependency array ensures this only recalculates when these values change
  }, [userScopedRole, isLoadingRole, userRole]);

  // Transform navItems to match NavMain expected format
  const navMainItems = navItems.map(item => ({
    title: item.name,
    url: item.path || "#",
    icon: item.icon,
    isActive: false,
    items: item.subItems?.map(subItem => ({
      title: subItem.name,
      url: subItem.path,
    })) || [],
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
