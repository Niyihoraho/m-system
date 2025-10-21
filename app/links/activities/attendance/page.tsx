"use client";

import { useState, useEffect } from 'react';
import { Plus, Calendar, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { SuperAdminScopeSelector } from "@/components/super-admin-scope-selector";
import { useUserScope } from "@/hooks/use-user-scope";
import { EnhancedAttendanceDashboard } from "@/components/attendance/enhanced-attendance-dashboard";
import { QuickAttendance } from "@/components/attendance/quick-attendance";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'quick' | 'full'>('quick');
  
  // User scope hook
  const { userScope, loading: scopeLoading, getDefaultValues } = useUserScope();
  
  // Scope selection state (for super admin only)
  const [regionId, setRegionId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [smallGroupId, setSmallGroupId] = useState("");
  const [alumniGroupId, setAlumniGroupId] = useState("");

  // Set default scope values when user scope is loaded
  useEffect(() => {
    if (userScope && !scopeLoading) {
      const defaults = getDefaultValues();
      setRegionId(defaults.regionId || "");
      setUniversityId(defaults.universityId || "");
      setSmallGroupId(defaults.smallGroupId || "");
      setAlumniGroupId(defaults.alumniGroupId || "");
    }
  }, [userScope, scopeLoading, getDefaultValues]);

  const handleScopeChange = (scope: {
    regionId?: string;
    universityId?: string;
    smallGroupId?: string;
    alumniGroupId?: string;
  }) => {
    setRegionId(scope.regionId || "");
    setUniversityId(scope.universityId || "");
    setSmallGroupId(scope.smallGroupId || "");
    setAlumniGroupId(scope.alumniGroupId || "");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/links/activities">
                    Activities
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Attendance Tracking</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Attendance Management
                  </h1>
                  <p className="text-muted-foreground">
                    Track and manage member attendance for ministry events and trainings
                  </p>
                </div>
                
                {/* Quick Stats Cards */}
                <div className="flex gap-2">
                  <Card className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <div className="text-sm">
                          <div className="font-semibold text-foreground">Quick</div>
                          <div className="text-xs text-muted-foreground">Mobile</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-green-600" />
                        <div className="text-sm">
                          <div className="font-semibold text-foreground">Full</div>
                          <div className="text-xs text-muted-foreground">Desktop</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Quick Attendance
                </TabsTrigger>
                <TabsTrigger value="full" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Full Dashboard
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Super Admin Scope Selector */}
            {userScope?.scope === 'superadmin' && (
              <SuperAdminScopeSelector onScopeChange={handleScopeChange} />
            )}

            {/* Show current scope for non-super admin users */}
            {userScope && userScope.scope !== 'superadmin' && !scopeLoading && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Current Scope:</span>
                    <span className="font-medium text-foreground capitalize">{userScope.scope}</span>
                    {userScope.region && (
                      <span>• {userScope.region.name}</span>
                    )}
                    {userScope.university && (
                      <span>• {userScope.university.name}</span>
                    )}
                    {userScope.smallGroup && (
                      <span>• {userScope.smallGroup.name}</span>
                    )}
                    {userScope.alumniGroup && (
                      <span>• {userScope.alumniGroup.name}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading state */}
            {scopeLoading && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading user scope...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Attendance Tab */}
            {activeTab === 'quick' && !scopeLoading && (
              <QuickAttendance
                regionId={regionId}
                universityId={universityId}
                smallGroupId={smallGroupId}
                alumniGroupId={alumniGroupId}
                userScope={userScope}
              />
            )}

            {/* Full Dashboard Tab */}
            {activeTab === 'full' && !scopeLoading && (
              <EnhancedAttendanceDashboard
                regionId={regionId}
                universityId={universityId}
                smallGroupId={smallGroupId}
                alumniGroupId={alumniGroupId}
                userScope={userScope}
              />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
