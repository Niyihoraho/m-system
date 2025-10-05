'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AppSidebar } from "@/components/app-sidebar";
import MemberTable from "./MemberTable";
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
import { AllowOnly, DenyOnly } from '@/components/role-based-access';
import SmallGroupTable from './SmallGroupTable';

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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting to fetch members...'); // Debug log
      
      // Add minimum loading time to ensure loading state is visible
      const [response] = await Promise.all([
        axios.get('/api/members'),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms loading time
      ]);
      
      console.log('Members fetched successfully:', response.data); // Debug log
      setMembers(response.data.members || []);
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
    fetchMembers();
  }, []);

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
                  <BreadcrumbLink href="/links/people/members">
                    People Management
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Member Directory</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          {/* Header */}
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Member Directory</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage members and their information across all groups</p>
            </div>

            {/* Member Table Component */}
            <AllowOnly scopes={["superadmin", "university", "region"]}>
            <MemberTable 
              members={members}
              loading={loading}
              error={error}
              onRefresh={fetchMembers}
            />
            </AllowOnly>
            <AllowOnly scopes="smallgroup">
            <SmallGroupTable/>
            </AllowOnly>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
