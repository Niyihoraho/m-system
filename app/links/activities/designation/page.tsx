"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Plus, Edit, Trash2, Target } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { AddDesignationModal } from "@/components/add-designation-modal";
import { DeleteDesignationModal } from "@/components/delete-designation-modal";
import { EditDesignationModal } from "@/components/edit-designation-modal";
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

interface Designation {
  id: number;
  name: string;
  description: string | null;
  targetAmount: number | null;
  currentAmount: number;
  isActive: boolean;
  regionId: number | null;
  universityId: number | null;
  smallGroupId: number | null;
  region: { name: string } | null;
  university: { name: string } | null;
  smallgroup: { name: string } | null;
}

export default function DesignationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    designationId: number | null;
    designationName: string;
  }>({
    isOpen: false,
    designationId: null,
    designationName: ''
  });
  const [deleting, setDeleting] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);

  // Fetch designations from API
  const fetchDesignations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/designations');
      setDesignations(response.data);
    } catch (err) {
      console.error('Error fetching designations:', err);
      setError('Failed to fetch designations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (designationId: number, designationName: string) => {
    setDeleteModal({
      isOpen: true,
      designationId,
      designationName
    });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      designationId: null,
      designationName: ''
    });
  };

  // Open edit modal
  const openEditModal = (designation: Designation) => {
    setEditingDesignation(designation);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingDesignation(null);
  };

  // Delete designation function
  const deleteDesignation = async () => {
    if (!deleteModal.designationId) return;

    setDeleting(true);
    
    try {
      const response = await axios.delete(`/api/designations/${deleteModal.designationId}`);
      
      if (response.status === 200) {
        // Remove the designation from the local state
        setDesignations(prev => prev.filter(designation => designation.id !== deleteModal.designationId));
        
        // Close the modal
        closeDeleteModal();
        
        // Show success message (you could add a toast notification here)
        console.log('Designation deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting designation:', err);
      alert('Failed to delete designation. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Load designations on component mount
  useEffect(() => {
    fetchDesignations();
  }, []);

  const filteredDesignations = designations.filter(designation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      designation.name?.toLowerCase().includes(searchLower) ||
      designation.description?.toLowerCase().includes(searchLower) ||
      designation.region?.name?.toLowerCase().includes(searchLower) ||
      designation.university?.name?.toLowerCase().includes(searchLower) ||
      designation.smallgroup?.name?.toLowerCase().includes(searchLower)
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
                  <BreadcrumbLink href="/links/activities">
                    Activities
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Designations</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Designation Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage contribution designations and their information across the organization</p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search designations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  />
                </div>

                {/* Refresh Button */}
                <button 
                  onClick={fetchDesignations}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Add New Designation Button */}
              <AddDesignationModal onDesignationAdded={fetchDesignations}>
                <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Designation</span>
                  <span className="sm:hidden">Add Designation</span>
                </button>
              </AddDesignationModal>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={fetchDesignations}
                  className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Designations Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading designations...</span>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Designation Name
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amounts
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                    {filteredDesignations.map((designation) => (
                      <tr key={designation.id} className="hover:bg-muted/50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-foreground">
                          {designation.id}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-foreground">
                          <div className="font-medium">{designation.name}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground">
                          <div className="max-w-xs truncate">
                            {designation.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground">
                          <div className="space-y-1">
                            {designation.targetAmount && (
                              <div className="text-xs">
                                Target: <span className="font-medium">${designation.targetAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="text-xs">
                              Current: <span className="font-medium">${designation.currentAmount.toLocaleString()}</span>
                            </div>
                            {designation.targetAmount && (
                              <div className="text-xs">
                                Progress: <span className="font-medium">
                                  {Math.round((designation.currentAmount / designation.targetAmount) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground">
                          <div className="space-y-1">
                            {designation.region && (
                              <div className="font-medium">{designation.region.name}</div>
                            )}
                            {designation.university && (
                              <div className="text-xs text-muted-foreground">University: {designation.university.name}</div>
                            )}
                            {designation.smallgroup && (
                              <div className="text-xs text-muted-foreground">Small Group: {designation.smallgroup.name}</div>
                            )}
                            {!designation.region && !designation.university && !designation.smallgroup && (
                              <div className="text-xs text-muted-foreground">Global</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            designation.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {designation.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => openEditModal(designation)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(designation.id, designation.name)}
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
              {!loading && filteredDesignations.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No designations found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? 'No designations match your search criteria.' : 'No designations have been added yet.'}
                  </p>
                  {!searchTerm && (
                    <AddDesignationModal onDesignationAdded={fetchDesignations}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add First Designation
                      </button>
                    </AddDesignationModal>
                  )}
                </div>
              )}

              {/* Table Footer */}
              {!loading && filteredDesignations.length > 0 && (
                <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing <span className="font-medium text-foreground">{filteredDesignations.length}</span> of <span className="font-medium text-foreground">{designations.length}</span> designations
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Modal */}
      <DeleteDesignationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteDesignation}
        designationName={deleteModal.designationName}
        isLoading={deleting}
      />
      
      {/* Edit Designation Modal */}
      <EditDesignationModal
        designation={editingDesignation}
        onDesignationUpdated={fetchDesignations}
        isOpen={editingDesignation !== null}
        onClose={closeEditModal}
      />
    </SidebarProvider>
  );
}
