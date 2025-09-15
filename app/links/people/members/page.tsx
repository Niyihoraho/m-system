'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, UserPlus, Edit, Trash2, Eye, Filter, Users, Calendar, MapPin, Phone, Mail, GraduationCap, Building2, Church } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { AddMemberModal } from "@/components/add-member-modal";
import { DeleteMemberModal } from "@/components/delete-member-modal";
import { EditMemberModal } from "@/components/edit-member-modal";
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

const memberTypeLabels = {
  student: 'Student',
  graduate: 'Graduate',
  staff: 'Staff',
  volunteer: 'Volunteer',
  alumni: 'Alumni',
};

const memberStatusLabels = {
  active: 'Active',
  pre_graduate: 'Pre-Graduate',
  graduate: 'Graduate',
  alumni: 'Alumni',
  inactive: 'Inactive',
};

const memberStatusColors = {
  active: 'bg-green-100 text-green-800',
  pre_graduate: 'bg-blue-100 text-blue-800',
  graduate: 'bg-purple-100 text-purple-800',
  alumni: 'bg-orange-100 text-orange-800',
  inactive: 'bg-gray-100 text-gray-800',
};

const memberTypeColors = {
  student: 'bg-blue-100 text-blue-800',
  graduate: 'bg-green-100 text-green-800',
  staff: 'bg-purple-100 text-purple-800',
  volunteer: 'bg-yellow-100 text-yellow-800',
  alumni: 'bg-orange-100 text-orange-800',
};

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    memberId: number | null;
    memberName: string;
  }>({
    isOpen: false,
    memberId: null,
    memberName: ''
  });
  const [deleting, setDeleting] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/members');
      setMembers(response.data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to fetch members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (memberId: number, memberName: string) => {
    setDeleteModal({
      isOpen: true,
      memberId,
      memberName
    });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      memberId: null,
      memberName: ''
    });
  };

  // Open edit modal
  const openEditModal = (member: Member) => {
    setEditingMember(member);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingMember(null);
  };

  // Delete member function
  const deleteMember = async () => {
    if (!deleteModal.memberId) return;

    setDeleting(true);
    
    try {
      const response = await axios.delete(`/api/members?id=${deleteModal.memberId}`);
      
      if (response.status === 200) {
        // Remove the member from the local state
        setMembers(prev => prev.filter(member => member.id !== deleteModal.memberId));
        
        // Close the modal
        closeDeleteModal();
        
        // Show success message (you could add a toast notification here)
        console.log('Member deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('Failed to delete member. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Load members on component mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      member.firstname?.toLowerCase().includes(searchLower) ||
      member.secondname?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.phone?.includes(searchTerm) ||
      member.faculty?.toLowerCase().includes(searchLower) ||
      member.professionalism?.toLowerCase().includes(searchLower) ||
      member.localChurch?.toLowerCase().includes(searchLower) ||
      member.region?.name?.toLowerCase().includes(searchLower) ||
      member.university?.name?.toLowerCase().includes(searchLower) ||
      member.smallgroup?.name?.toLowerCase().includes(searchLower) ||
      member.alumnismallgroup?.name?.toLowerCase().includes(searchLower) ||
      member.type?.toLowerCase().includes(searchLower) ||
      member.status?.toLowerCase().includes(searchLower) ||
      member.gender?.toLowerCase().includes(searchLower) ||
      member.maritalStatus?.toLowerCase().includes(searchLower) ||
      memberTypeLabels[member.type as keyof typeof memberTypeLabels]?.toLowerCase().includes(searchLower) ||
      memberStatusLabels[member.status as keyof typeof memberStatusLabels]?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
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
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Member Directory</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage members and their information across all groups</p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  />
                </div>

                {/* Refresh Button */}
                <button 
                  onClick={fetchMembers}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Add New Member Button */}
              <AddMemberModal onMemberAdded={fetchMembers}>
                <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm sm:text-base">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Member</span>
                  <span className="sm:hidden">Add Member</span>
                </button>
              </AddMemberModal>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={fetchMembers}
                  className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Members Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading members...</span>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                          Contact
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                          Organization
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                          Education
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type & Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                    {paginatedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-muted/50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                  {member.firstname?.[0]}{member.secondname?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">
                                {member.firstname} {member.secondname}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                                <span>{member.gender}</span>
                                <span>•</span>
                                <span>{member.maritalStatus}</span>
                                {member.birthdate && (
                                  <>
                                    <span>•</span>
                                    <span>{new Date().getFullYear() - new Date(member.birthdate).getFullYear()}y</span>
                                  </>
                                )}
                              </div>
                              {/* Mobile: Show contact info inline */}
                              <div className="md:hidden mt-1 space-y-1">
                                <div className="text-xs text-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{member.phone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{member.email}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{member.phone}</span>
                          </div>
                          {member.localChurch && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Church className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{member.localChurch}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-sm text-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{member.region?.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{member.university?.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{member.smallgroup?.name}</span>
                          </div>
                          {member.alumnismallgroup && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{member.alumnismallgroup.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden xl:table-cell">
                          {member.faculty && (
                            <div className="text-sm text-foreground truncate max-w-[150px]">{member.faculty}</div>
                          )}
                          {member.professionalism && (
                            <div className="text-sm text-muted-foreground truncate max-w-[150px]">{member.professionalism}</div>
                          )}
                          {member.graduationDate && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="truncate">Grad: {new Date(member.graduationDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex flex-col gap-1 sm:gap-2">
                            {/* Type Badge */}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${memberTypeColors[member.type as keyof typeof memberTypeColors]}`}>
                              {memberTypeLabels[member.type as keyof typeof memberTypeColors]}
                            </span>
                            {/* Status Badge */}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${memberStatusColors[member.status as keyof typeof memberStatusColors]}`}>
                              {memberStatusLabels[member.status as keyof typeof memberStatusColors]}
                            </span>
                            {/* Joined Date */}
                            <div className="text-xs text-muted-foreground">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button className="text-primary hover:text-primary/80 p-1 rounded" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openEditModal(member)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(member.id, `${member.firstname} ${member.secondname}`)}
                              className="text-destructive hover:text-destructive/80 p-1 rounded" 
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty State */}
              {!loading && paginatedMembers.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No members found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? 'No members match your search criteria.' : 'No members have been added yet.'}
                  </p>
                  {!searchTerm && (
                    <AddMemberModal onMemberAdded={fetchMembers}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <UserPlus className="w-4 h-4" />
                        Add First Member
                      </button>
                    </AddMemberModal>
                  )}
                </div>
              )}

              {/* Table Footer */}
              {!loading && filteredMembers.length > 0 && (
                <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{Math.min(endIndex, filteredMembers.length)}</span> of <span className="font-medium text-foreground">{filteredMembers.length}</span> members
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* Previous Button */}
                      <button 
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-2 py-1 text-xs sm:text-sm rounded ${
                                currentPage === pageNum
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="text-muted-foreground">...</span>
                            <button
                              onClick={() => goToPage(totalPages)}
                              className="px-2 py-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Next Button */}
                      <button 
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Modal */}
      <DeleteMemberModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteMember}
        memberName={deleteModal.memberName}
        isLoading={deleting}
      />
      
      {/* Edit Member Modal */}
      <EditMemberModal
        member={editingMember}
        onMemberUpdated={fetchMembers}
        isOpen={editingMember !== null}
        onClose={closeEditModal}
      />
    </SidebarProvider>
  );
}