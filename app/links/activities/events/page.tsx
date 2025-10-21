"use client";

import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SuperAdminScopeSelector } from "@/components/super-admin-scope-selector";
import { useUserScope } from "@/hooks/use-user-scope";
import { EnhancedEventManagement } from "@/components/events/enhanced-event-management";
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

export default function EventsPage() {
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
      setRegionId(defaults.regionId);
      setUniversityId(defaults.universityId);
      setSmallGroupId(defaults.smallGroupId);
      setAlumniGroupId(defaults.alumniGroupId);
    }
  }, [userScope, scopeLoading, getDefaultValues]);

  // Handle scope changes for super admin
  const handleScopeChange = (scope: {
    regionId: string;
    universityId: string;
    smallGroupId: string;
    alumniGroupId: string;
  }) => {
    setRegionId(scope.regionId);
    setUniversityId(scope.universityId);
    setSmallGroupId(scope.smallGroupId);
    setAlumniGroupId(scope.alumniGroupId);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/links/activities">
                    Activities
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Events</BreadcrumbPage>
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
                    Events Management
                  </h1>
                  <p className="text-muted-foreground">
                    Manage ministry events and track attendance across the organization
                  </p>
                </div>
              </div>
            </div>

            {/* Super Admin Scope Selector */}
            {userScope?.scope === 'superadmin' && (
              <SuperAdminScopeSelector onScopeChange={handleScopeChange} />
            )}

            {/* User Scope Display */}
            {userScope && !scopeLoading && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Current Scope:</span>
                    <span className="font-medium text-foreground">
                      {userScope.scope === 'superadmin' ? 'Super Admin' :
                       userScope.scope === 'national' ? 'National' :
                       userScope.scope === 'region' ? `Region: ${userScope.region?.name || 'N/A'}` :
                       userScope.scope === 'university' ? `University: ${userScope.university?.name || 'N/A'}` :
                       userScope.scope === 'smallgroup' ? `Small Group: ${userScope.smallGroup?.name || 'N/A'}` :
                       userScope.scope === 'alumnismallgroup' ? `Alumni Group: ${userScope.alumniGroup?.name || 'N/A'}` :
                       'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Event Management */}
            {!scopeLoading && (
              <EnhancedEventManagement
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