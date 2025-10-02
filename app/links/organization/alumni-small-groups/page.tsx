"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { AddAlumniSmallGroupModal } from "@/components/add-alumni-small-group-modal";
import { DeleteAlumniSmallGroupModal } from "@/components/delete-alumni-small-group-modal";
import { EditAlumniSmallGroupModal } from "@/components/edit-alumni-small-group-modal";
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

interface AlumniSmallGroup {
  id: number;
  name: string;
  regionId: number;
  region: { name: string };
}

export default function AlumniSmallGroupsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [alumniSmallGroups, setAlumniSmallGroups] = useState<AlumniSmallGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    alumniSmallGroupId: number | null;
    alumniSmallGroupName: string;
  }>({
    isOpen: false,
    alumniSmallGroupId: null,
    alumniSmallGroupName: ''
  });
  const [deleting, setDeleting] = useState(false);
  const [editingAlumniSmallGroup, setEditingAlumniSmallGroup] = useState<AlumniSmallGroup | null>(null);

  // Fetch alumni small groups from API
  const fetchAlumniSmallGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/alumni-small-groups');
      setAlumniSmallGroups(response.data);
    } catch (err) {
      console.error('Error fetching alumni small groups:', err);
      setError('Failed to fetch alumni small groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (alumniSmallGroupId: number, alumniSmallGroupName: string) => {
    setDeleteModal({
      isOpen: true,
      alumniSmallGroupId,
      alumniSmallGroupName
    });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      alumniSmallGroupId: null,
      alumniSmallGroupName: ''
    });
  };

  // Open edit modal
  const openEditModal = (alumniSmallGroup: AlumniSmallGroup) => {
    setEditingAlumniSmallGroup(alumniSmallGroup);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingAlumniSmallGroup(null);
  };

  // Delete alumni small group function
  const deleteAlumniSmallGroup = async () => {
    if (!deleteModal.alumniSmallGroupId) return;

    setDeleting(true);
    
    try {
      const response = await axios.delete(`/api/alumni-small-groups?id=${deleteModal.alumniSmallGroupId}`);
      
      if (response.status === 200) {
        // Remove the alumni small group from the local state
        setAlumniSmallGroups(prev => prev.filter(alumniSmallGroup => alumniSmallGroup.id !== deleteModal.alumniSmallGroupId));
        
        // Close the modal
        closeDeleteModal();
        
        // Show success message (you could add a toast notification here)
        console.log('Alumni small group deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting alumni small group:', err);
      alert('Failed to delete alumni small group. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Load alumni small groups on component mount
  useEffect(() => {
    fetchAlumniSmallGroups();
  }, []);

  const filteredAlumniSmallGroups = alumniSmallGroups.filter(alumniSmallGroup => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      alumniSmallGroup.name?.toLowerCase().includes(searchLower) ||
      alumniSmallGroup.region?.name?.toLowerCase().includes(searchLower)
    );
  });

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
                  <BreadcrumbLink href="/links/organization">
                    Organization
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Alumni Small Groups</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Alumni Small Groups Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage alumni small groups and their information across the organization</p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search alumni small groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  />
                </div>

                {/* Refresh Button */}
                <button 
                  onClick={fetchAlumniSmallGroups}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Add New Alumni Small Group Button */}
              <AddAlumniSmallGroupModal onAlumniSmallGroupAdded={fetchAlumniSmallGroups}>
                <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Alumni Small Group</span>
                  <span className="sm:hidden">Add Alumni Group</span>
                </button>
              </AddAlumniSmallGroupModal>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={fetchAlumniSmallGroups}
                  className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Alumni Small Groups Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading alumni small groups...</span>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Alumni Small Group Name
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Region
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                    {filteredAlumniSmallGroups.map((alumniSmallGroup) => (
                      <tr key={alumniSmallGroup.id} className="hover:bg-muted/50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-foreground">
                          {alumniSmallGroup.id}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-foreground">
                          {alumniSmallGroup.name}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground">
                          {alumniSmallGroup.region?.name}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => openEditModal(alumniSmallGroup)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(alumniSmallGroup.id, alumniSmallGroup.name)}
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
              {!loading && filteredAlumniSmallGroups.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No alumni small groups found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? 'No alumni small groups match your search criteria.' : 'No alumni small groups have been added yet.'}
                  </p>
                  {!searchTerm && (
                    <AddAlumniSmallGroupModal onAlumniSmallGroupAdded={fetchAlumniSmallGroups}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add First Alumni Small Group
                      </button>
                    </AddAlumniSmallGroupModal>
                  )}
                </div>
              )}

              {/* Table Footer */}
              {!loading && filteredAlumniSmallGroups.length > 0 && (
                <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing <span className="font-medium text-foreground">{filteredAlumniSmallGroups.length}</span> of <span className="font-medium text-foreground">{alumniSmallGroups.length}</span> alumni small groups
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Modal */}
      <DeleteAlumniSmallGroupModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteAlumniSmallGroup}
        alumniSmallGroupName={deleteModal.alumniSmallGroupName}
        isLoading={deleting}
      />
      
      {/* Edit Alumni Small Group Modal */}
      <EditAlumniSmallGroupModal
        alumniSmallGroup={editingAlumniSmallGroup}
        onAlumniSmallGroupUpdated={fetchAlumniSmallGroups}
        isOpen={editingAlumniSmallGroup !== null}
        onClose={closeEditModal}
      />
    </SidebarProvider>
  );
}
