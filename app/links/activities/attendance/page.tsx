"use client";

import { useState, useEffect } from 'react';
import { Plus, Calendar, RefreshCw } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { SuperAdminScopeSelector } from "@/components/super-admin-scope-selector";
import { useUserScope } from "@/hooks/use-user-scope";
import { MarkAttendanceForm } from "@/components/attendance/mark-attendance-form";
import { ViewAttendanceRecords } from "@/components/attendance/view-attendance-records";
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

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'mark' | 'view'>('mark');
  
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
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Attendance Tracking</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage attendance records and mark attendance for events</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'mark' ? 'default' : 'outline'}
                onClick={() => setActiveTab('mark')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Mark Attendance
              </Button>
              <Button
                variant={activeTab === 'view' ? 'default' : 'outline'}
                onClick={() => setActiveTab('view')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                View Attendance Records
              </Button>
            </div>

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

            {/* Mark Attendance Tab */}
            {activeTab === 'mark' && !scopeLoading && (
              <MarkAttendanceForm
                regionId={regionId}
                universityId={universityId}
                smallGroupId={smallGroupId}
                alumniGroupId={alumniGroupId}
              />
            )}

            {/* View Attendance Records Tab */}
            {activeTab === 'view' && !scopeLoading && (
              <ViewAttendanceRecords
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
