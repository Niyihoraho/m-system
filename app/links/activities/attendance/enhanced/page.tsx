"use client";

import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { SuperAdminScopeSelector } from "@/components/super-admin-scope-selector";
import { useUserScope } from "@/hooks/use-user-scope";
import { EnhancedAttendanceDashboard } from "@/components/attendance/enhanced-attendance-dashboard";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Calendar, Users, BarChart3 } from "lucide-react";

export default function EnhancedAttendancePage() {
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
        <AppHeader 
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Activities", href: "/links/activities" },
            { label: "Attendance Tracking", isLast: true }
          ]}
        />
        
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
                        <Users className="w-4 h-4 text-blue-600" />
                        <div className="text-sm">
                          <div className="font-semibold text-foreground">Members</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <div className="text-sm">
                          <div className="font-semibold text-foreground">Events</div>
                          <div className="text-xs text-muted-foreground">Available</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <div className="text-sm">
                          <div className="font-semibold text-foreground">Analytics</div>
                          <div className="text-xs text-muted-foreground">Reports</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Super Admin Scope Selector */}
            {userScope?.scope === 'superadmin' && (
              <div className="mb-6">
                <SuperAdminScopeSelector onScopeChange={handleScopeChange} />
              </div>
            )}

            {/* Show current scope for non-super admin users */}
            {userScope && userScope.scope !== 'superadmin' && !scopeLoading && (
              <Card className="mb-6">
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
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading user scope...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Attendance Dashboard */}
            {!scopeLoading && (
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
