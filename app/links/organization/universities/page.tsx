"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { AddUniversityModal } from "@/components/add-university-modal";
import { DeleteUniversityModal } from "@/components/delete-university-modal";
import { EditUniversityModal } from "@/components/edit-university-modal";
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

interface University {
  id: number;
  name: string;
  regionId: number;
  region: { name: string };
}

export default function UniversitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    universityId: number | null;
    universityName: string;
  }>({
    isOpen: false,
    universityId: null,
    universityName: ''
  });
  const [deleting, setDeleting] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);

  // Fetch universities from API
  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/universities');
      setUniversities(response.data);
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError('Failed to fetch universities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (universityId: number, universityName: string) => {
    setDeleteModal({
      isOpen: true,
      universityId,
      universityName
    });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      universityId: null,
      universityName: ''
    });
  };

  // Open edit modal
  const openEditModal = (university: University) => {
    setEditingUniversity(university);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingUniversity(null);
  };

  // Delete university function
  const deleteUniversity = async () => {
    if (!deleteModal.universityId) return;

    setDeleting(true);
    
    try {
      const response = await axios.delete(`/api/universities?id=${deleteModal.universityId}`);
      
      if (response.status === 200) {
        // Remove the university from the local state
        setUniversities(prev => prev.filter(university => university.id !== deleteModal.universityId));
        
        // Close the modal
        closeDeleteModal();
        
        // Show success message (you could add a toast notification here)
        console.log('University deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting university:', err);
      alert('Failed to delete university. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Load universities on component mount
  useEffect(() => {
    fetchUniversities();
  }, []);

  const filteredUniversities = universities.filter(university => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      university.name?.toLowerCase().includes(searchLower) ||
      university.region?.name?.toLowerCase().includes(searchLower)
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
                  <BreadcrumbPage>Universities</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Universities Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage universities and their information across the organization</p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search universities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  />
                </div>

                {/* Refresh Button */}
                <button 
                  onClick={fetchUniversities}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Add New University Button */}
              <AddUniversityModal onUniversityAdded={fetchUniversities}>
                <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New University</span>
                  <span className="sm:hidden">Add University</span>
                </button>
              </AddUniversityModal>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={fetchUniversities}
                  className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Universities Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading universities...</span>
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
                          University Name
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
                    {filteredUniversities.map((university) => (
                      <tr key={university.id}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-foreground">
                          {university.id}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-foreground">
                          {university.name}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground">
                          {university.region?.name}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => openEditModal(university)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(university.id, university.name)}
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
              {!loading && filteredUniversities.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No universities found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? 'No universities match your search criteria.' : 'No universities have been added yet.'}
                  </p>
                  {!searchTerm && (
                    <AddUniversityModal onUniversityAdded={fetchUniversities}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add First University
                      </button>
                    </AddUniversityModal>
                  )}
                </div>
              )}

              {/* Table Footer */}
              {!loading && filteredUniversities.length > 0 && (
                <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing <span className="font-medium text-foreground">{filteredUniversities.length}</span> of <span className="font-medium text-foreground">{universities.length}</span> universities
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Modal */}
      <DeleteUniversityModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteUniversity}
        universityName={deleteModal.universityName}
        isLoading={deleting}
      />
      
      {/* Edit University Modal */}
      <EditUniversityModal
        university={editingUniversity}
        onUniversityUpdated={fetchUniversities}
        isOpen={editingUniversity !== null}
        onClose={closeEditModal}
      />
    </SidebarProvider>
  );
}
