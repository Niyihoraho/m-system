"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { LogoutButton } from "@/components/logout-button"
import { Shield, Building2, MapPin, Users, GraduationCap, Church, Activity, TrendingUp, Calendar, AlertCircle } from "lucide-react"
import { AllowOnly } from '@/components/role-based-access'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Interface for user scope data
interface UserScope {
  scope: string;
  regionId: number | null;
  universityId: number | null;
  smallGroupId: number | null;
  alumniGroupId: number | null;
  region: { id: number; name: string } | null;
  university: { id: number; name: string } | null;
  smallGroup: { id: number; name: string } | null;
  alumniGroup: { id: number; name: string } | null;
}

// Types for API response
interface Member {
  id: number;
  firstname: string | null;
  secondname: string | null;
  gender: string | null;
  birthdate: string | null;
  placeOfBirthProvince: string | null;
  placeOfBirthDistrict: string | null;
  placeOfBirthSector: string | null;
  placeOfBirthCell: string | null;
  placeOfBirthVillage: string | null;
  localChurch: string | null;
  email: string | null;
  phone: string | null;
  type: string;
  status: string;
  regionId: number | null;
  universityId: number | null;
  smallGroupId: number | null;
  alumniGroupId: number | null;
  graduationDate: string | null;
  faculty: string | null;
  professionalism: string | null;
  maritalStatus: string | null;
  createdAt: string;
  updatedAt: string;
  region: { name: string } | null;
  university: { name: string } | null;
  smallgroup: { name: string } | null;
  alumnismallgroup: { name: string } | null;
}

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userScope, setUserScope] = useState<UserScope | null>(null);
  const [isLoadingScope, setIsLoadingScope] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0,
    recentActivity: 0
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  // Fetch user scope information
  useEffect(() => {
    const fetchUserScope = async () => {
      if (status === "loading" || !session?.user?.id) {
        return;
      }

      try {
        setIsLoadingScope(true);
        const response = await fetch('/api/members/current-user-scope');
        if (response.ok) {
          const data = await response.json();
          setUserScope(data.scope);
        } else {
          console.error('Failed to fetch user scope');
        }
      } catch (error) {
        console.error('Error fetching user scope:', error);
      } finally {
        setIsLoadingScope(false);
      }
    };

    fetchUserScope();
  }, [session, status]);

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting to fetch members...'); // Debug log
      
      // Add minimum loading time to ensure loading state is visible
      const [response] = await Promise.all([
        fetch('/api/members'),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms loading time
      ]);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Members fetched successfully:', data); // Debug log
        setMembers(data.members || []);
      } else {
        throw new Error('Failed to fetch members');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to fetch members. Please try again.');
    } finally {
      console.log('Setting loading to false'); // Debug log
      setLoading(false);
    }
  };

  // Load members on component mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchMembers();
    }
  }, [status]);

  // Calculate stats when members data changes
  useEffect(() => {
    if (members.length > 0) {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const activeMembers = members.filter(m => m.status === 'active').length;
      const newThisMonth = members.filter(m => new Date(m.createdAt) >= thisMonth).length;
      const recentActivity = members.filter(m => new Date(m.updatedAt) >= lastWeek).length;

      setStats({
        totalMembers: members.length,
        activeMembers,
        newThisMonth,
        recentActivity
      });
    }
  }, [members]);

  // Helper function to get scope display information
  const getScopeDisplayInfo = (scope: UserScope | null) => {
    if (!scope) return { title: 'Loading...', subtitle: '', icon: Shield, color: 'text-muted-foreground' };

    const scopeConfig = {
      superadmin: {
        title: 'Super Administrator',
        subtitle: 'Full system access',
        icon: Shield,
        color: 'text-red-600'
      },
      national: {
        title: 'National Administrator',
        subtitle: 'National level access',
        icon: Shield,
        color: 'text-blue-600'
      },
      region: {
        title: 'Region Administrator',
        subtitle: scope.region ? `Region: ${scope.region.name}` : 'Region access',
        icon: MapPin,
        color: 'text-green-600'
      },
      university: {
        title: 'University Administrator',
        subtitle: scope.university ? `${scope.university.name}` : 'University access',
        icon: Building2,
        color: 'text-purple-600'
      },
      smallgroup: {
        title: 'Small Group Leader',
        subtitle: scope.smallGroup ? `${scope.smallGroup.name} - ${scope.university?.name}` : 'Small group access',
        icon: Church,
        color: 'text-orange-600'
      },
      alumnismallgroup: {
        title: 'Alumni Group Leader',
        subtitle: scope.alumniGroup ? `${scope.alumniGroup.name}` : 'Alumni group access',
        icon: GraduationCap,
        color: 'text-indigo-600'
      }
    };

    return scopeConfig[scope.scope as keyof typeof scopeConfig] || {
      title: 'User',
      subtitle: 'Standard access',
      icon: Users,
      color: 'text-muted-foreground'
    };
  };

  const scopeInfo = getScopeDisplayInfo(userScope);
  const ScopeIcon = scopeInfo.icon;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-muted-foreground mb-4">Please wait while we redirect you to the login page.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader 
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Welcome", isLast: true }
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Welcome Section with User Scope */}
          <div className="bg-gradient-to-br from-card via-card to-muted/20 rounded-lg shadow-sm border border-border/50 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Welcome Message */}
              <div className="flex-1">
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-foreground mb-2">
                    Welcome to GBUR Management System
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {(session?.user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Hello, <span className="font-semibold text-foreground">{session?.user?.name || 'User'}</span>!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Scope Information */}
              <div className="lg:w-72">
                <div className="bg-gradient-to-br from-primary/8 via-primary/5 to-primary/10 border border-primary/30 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-primary/15 rounded-lg border border-primary/20">
                      <ScopeIcon className={`w-4 h-4 ${scopeInfo.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Your Role</h3>
                      <p className="text-xs text-muted-foreground">Current access level</p>
                    </div>
                  </div>
                  
                  {isLoadingScope ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                    </div>
                  ) : (
                    <div>
                      <h4 className={`font-semibold text-sm ${scopeInfo.color} mb-1`}>
                        {scopeInfo.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {scopeInfo.subtitle}
                      </p>
                      
                      {/* Additional scope details */}
                      {userScope && (
                        <div className="space-y-1">
                          {userScope.region && (
                            <div className="flex items-center gap-2 text-xs">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">{userScope.region.name}</span>
                            </div>
                          )}
                          {userScope.university && (
                            <div className="flex items-center gap-2 text-xs">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">{userScope.university.name}</span>
                            </div>
                          )}
                          {userScope.smallGroup && (
                            <div className="flex items-center gap-2 text-xs">
                              <Church className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">{userScope.smallGroup.name}</span>
                            </div>
                          )}
                          {userScope.alumniGroup && (
                            <div className="flex items-center gap-2 text-xs">
                              <GraduationCap className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">{userScope.alumniGroup.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Quick Stats Grid */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Members */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Members</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalMembers}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Active Members */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Members</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.activeMembers}</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* New This Month */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">New This Month</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.newThisMonth}</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Recent Updates</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.recentActivity}</p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Role-based Quick Actions */}
          <div className="bg-card rounded-lg shadow-sm border border-border/50 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Common tasks based on your access level</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Super Admin Actions */}
              <AllowOnly scopes="superadmin">
                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                      <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">System Administration</h4>
                      <p className="text-sm text-muted-foreground">Manage users and system settings</p>
                    </div>
                  </div>
                </div>
              </AllowOnly>

              {/* Region/University Admin Actions */}
              <AllowOnly scopes={["region", "university"]}>
                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Manage Organizations</h4>
                      <p className="text-sm text-muted-foreground">Add and manage universities/regions</p>
                    </div>
                  </div>
                </div>
              </AllowOnly>

              {/* Small Group Actions */}
              <AllowOnly scopes="smallgroup">
                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                      <Church className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Small Group Management</h4>
                      <p className="text-sm text-muted-foreground">Manage your small group members</p>
                    </div>
                  </div>
                </div>
              </AllowOnly>

              {/* Alumni Group Actions */}
              <AllowOnly scopes="alumnismallgroup">
                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Alumni Management</h4>
                      <p className="text-sm text-muted-foreground">Manage alumni group members</p>
                    </div>
                  </div>
                </div>
              </AllowOnly>

              {/* Common Actions for All Roles */}
              <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">View Members</h4>
                    <p className="text-sm text-muted-foreground">Browse and search member directory</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Reports</h4>
                    <p className="text-sm text-muted-foreground">Generate and view reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
