"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Plus, Edit, Trash2, DollarSign, User } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { AddContributionModal } from "@/components/add-contribution-modal";
import { DeleteContributionModal } from "@/components/delete-contribution-modal";
import { EditContributionModal } from "@/components/edit-contribution-modal";
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

interface Contribution {
  id: number;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
  contributor: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    memberId: number | null;
  };
  contributiondesignation: {
    id: number;
    name: string;
    targetAmount: number | null;
    currentAmount: number;
  } | null;
  member: {
    id: number;
    firstname: string | null;
    secondname: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  paymenttransaction: {
    id: number;
    externalId: string;
    amount: number;
    currency: string;
    status: string;
    paymentgateway: {
      id: number;
      name: string;
      provider: string;
    };
  } | null;
  contributionreceipt: {
    id: number;
    receiptNumber: string;
    pdfPath: string | null;
    emailSent: boolean;
    smsSent: boolean;
  } | null;
}

const methodLabels = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  card: 'Card Payment',
  worldremit: 'WorldRemit',
};

const statusLabels = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
  processing: 'Processing',
  cancelled: 'Cancelled',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  refunded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

const methodColors = {
  mobile_money: 'bg-blue-100 text-blue-800',
  bank_transfer: 'bg-green-100 text-green-800',
  card: 'bg-purple-100 text-purple-800',
  worldremit: 'bg-orange-100 text-orange-800',
};

export default function ContributionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    contributionId: number | null;
    contributorName: string;
    contributionAmount: number;
  }>({
    isOpen: false,
    contributionId: null,
    contributorName: '',
    contributionAmount: 0,
  });
  const [deleting, setDeleting] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);

  // Fetch contributions from API
  const fetchContributions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/contributions');
      setContributions(response.data);
    } catch (err) {
      console.error('Error fetching contributions:', err);
      setError('Failed to fetch contributions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (contributionId: number, contributorName: string, contributionAmount: number) => {
    setDeleteModal({
      isOpen: true,
      contributionId,
      contributorName,
      contributionAmount
    });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      contributionId: null,
      contributorName: '',
      contributionAmount: 0,
    });
  };

  // Open edit modal
  const openEditModal = (contribution: Contribution) => {
    setEditingContribution(contribution);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingContribution(null);
  };

  // Delete contribution function
  const deleteContribution = async () => {
    if (!deleteModal.contributionId) return;

    setDeleting(true);
    
    try {
      const response = await axios.delete(`/api/contributions/${deleteModal.contributionId}`);
      
      if (response.status === 200) {
        setContributions(prev => prev.filter(contribution => contribution.id !== deleteModal.contributionId));
        closeDeleteModal();
        console.log('Contribution deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting contribution:', err);
      alert('Failed to delete contribution. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Load contributions on component mount
  useEffect(() => {
    fetchContributions();
  }, []);

  const filteredContributions = contributions.filter(contribution => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      contribution.contributor.name?.toLowerCase().includes(searchLower) ||
      contribution.contributor.email?.toLowerCase().includes(searchLower) ||
      contribution.contributor.phone?.includes(searchTerm) ||
      contribution.contributiondesignation?.name?.toLowerCase().includes(searchLower) ||
      contribution.member?.firstname?.toLowerCase().includes(searchLower) ||
      contribution.member?.secondname?.toLowerCase().includes(searchLower) ||
      contribution.member?.email?.toLowerCase().includes(searchLower) ||
      contribution.transactionId?.toLowerCase().includes(searchLower) ||
      contribution.paymenttransaction?.externalId?.toLowerCase().includes(searchLower) ||
      contribution.paymenttransaction?.paymentgateway?.name?.toLowerCase().includes(searchLower) ||
      methodLabels[contribution.method as keyof typeof methodLabels]?.toLowerCase().includes(searchLower) ||
      statusLabels[contribution.status as keyof typeof statusLabels]?.toLowerCase().includes(searchLower)
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
                  <BreadcrumbLink href="/links/financial">
                    Financial Management
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Contributions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Contributions Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage financial contributions and their processing across the organization</p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search contributions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  />
                </div>

                {/* Refresh Button */}
                <button 
                  onClick={fetchContributions}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Add New Contribution Button */}
              <AddContributionModal onContributionAdded={fetchContributions}>
                <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Contribution</span>
                  <span className="sm:hidden">Add Contribution</span>
                </button>
              </AddContributionModal>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={fetchContributions}
                  className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Contributions Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading contributions...</span>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Contributor
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount & Method
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Designation
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
                    {filteredContributions.map((contribution) => (
                      <tr key={contribution.id} className="hover:bg-muted/50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">
                                {contribution.contributor.name}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                                {contribution.contributor.email && (
                                  <>
                                    <span>{contribution.contributor.email}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>{contribution.contributor.phone}</span>
                              </div>
                              {contribution.member && (
                                <div className="text-xs text-muted-foreground">
                                  Member: {contribution.member.firstname} {contribution.member.secondname}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{contribution.amount.toLocaleString()} RWF</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {methodLabels[contribution.method as keyof typeof methodLabels]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(contribution.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {contribution.contributiondesignation ? (
                            <div className="text-sm text-foreground">
                              <div className="font-medium">{contribution.contributiondesignation.name}</div>
                              {contribution.contributiondesignation.targetAmount && (
                                <div className="text-xs text-muted-foreground">
                                  Target: {contribution.contributiondesignation.targetAmount.toLocaleString()} RWF
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No designation</div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${statusColors[contribution.status as keyof typeof statusColors]}`}>
                              {statusLabels[contribution.status as keyof typeof statusLabels]}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${methodColors[contribution.method as keyof typeof methodColors]}`}>
                              {methodLabels[contribution.method as keyof typeof methodLabels]}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => openEditModal(contribution)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(contribution.id, contribution.contributor.name, contribution.amount)}
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
              {!loading && filteredContributions.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No contributions found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? 'No contributions match your search criteria.' : 'No contributions have been recorded yet.'}
                  </p>
                  {!searchTerm && (
                    <AddContributionModal onContributionAdded={fetchContributions}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add First Contribution
                      </button>
                    </AddContributionModal>
                  )}
                </div>
              )}

              {/* Table Footer */}
              {!loading && filteredContributions.length > 0 && (
                <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing <span className="font-medium text-foreground">{filteredContributions.length}</span> contributions
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Modal */}
      <DeleteContributionModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteContribution}
        contributorName={deleteModal.contributorName}
        contributionAmount={deleteModal.contributionAmount}
        isLoading={deleting}
      />
      
      {/* Edit Contribution Modal */}
      <EditContributionModal
        contribution={editingContribution}
        onContributionUpdated={fetchContributions}
        isOpen={editingContribution !== null}
        onClose={closeEditModal}
      />
    </SidebarProvider>
  );
}
