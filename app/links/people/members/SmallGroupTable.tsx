'use client';

import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { Search, RefreshCw, Users, Mail, Phone, Calendar, MapPin, Building2, Church, GraduationCap } from 'lucide-react';
import axios from "axios";

import { useRouter } from "next/navigation";

// Interface for the Member data structure
interface Member {
  id: number;
  firstname: string | null;
  secondname: string | null;
  gender: string | null;
  birthdate: string | null;
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

// API function to fetch small group members
const fetchSmallGroupMembers = async (): Promise<Member[]> => {
  try {
    const response = await axios.get("/api/members");
    // The API returns { members: [...] }, so we need to access response.data.members
    return response.data.members || [];
  } catch (error) {
    console.error("Error fetching small group members:", error);
    throw error;
  }
};

interface SmallGroupTableProps {
  refreshKey?: number;
}

export default function SmallGroupTable({ refreshKey }: SmallGroupTableProps) {
  // --- Hooks ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const itemsPerPage = 5;

  // Get small group information from the first member (all members should be from the same small group due to RLS)
  const smallGroupInfo = members.length > 0 ? {
    name: members[0].smallgroup?.name || 'Unknown Small Group',
    university: members[0].university?.name || 'Unknown University',
    region: members[0].region?.name || 'Unknown Region',
    memberCount: members.length
  } : null;

  // --- Data Fetching & Side Effects ---
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchSmallGroupMembers();
      setMembers(data);
    } catch (err) {
      console.error("Error fetching small group members:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [refreshKey]);

  // --- Helper Functions ---
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // --- Search and Filter Logic ---
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    let filtered = members;

    // Apply status filter first
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => {
        if (statusFilter === 'active' && member.status !== 'active') {
          return false;
        }
        if (statusFilter === 'inactive' && member.status !== 'inactive') {
          return false;
        }
        return true;
      });
    }

    // Apply search filter
    if (!searchTerm) return filtered;

    const searchLower = searchTerm.toLowerCase();

    return filtered.filter(member => {
      const searchableContent = [
        member.firstname,
        member.secondname,
        member.email,
        member.phone,
        formatDate(member.birthdate),
        member.gender
      ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

      return searchableContent.includes(searchLower);
    });
  }, [members, searchTerm, statusFilter]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Reset to first page when status filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

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


  // --- Main Component JSX ---
  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Small Group Information Header */}
      {isLoading ? (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Church className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      ) : smallGroupInfo ? (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Church className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {smallGroupInfo.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Small Group Members
                </p>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">University</p>
                  <p className="text-sm font-medium text-foreground">{smallGroupInfo.university}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Region</p>
                  <p className="text-sm font-medium text-foreground">{smallGroupInfo.region}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                  <p className="text-sm font-medium text-foreground">{smallGroupInfo.memberCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-11 w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <button 
            onClick={fetchMembers}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading members...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow>
                    <TableHead className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Member
                    </TableHead>
                    <TableHead className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Contact Information
                    </TableHead>
                    <TableHead className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Birth Information
                    </TableHead>
                    <TableHead className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                      Member Details
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card divide-y divide-border">
                  {paginatedMembers.map((member: Member) => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/people/members/${member.id}`)}
                    >
                      {/* Member Cell */}
                      <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
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
                              {member.birthdate && (
                                <>
                                  <span>•</span>
                                  <span>{new Date().getFullYear() - new Date(member.birthdate).getFullYear()}y</span>
                                </>
                              )}
                            </div>
                            {/* Mobile: Show contact info and details inline */}
                            <div className="md:hidden mt-1 space-y-1">
                              <div className="text-xs text-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{member.email}</span>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{member.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                                  {member.type}
                                </span>
                                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full capitalize">
                                  {member.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Information Cell */}
                      <TableCell className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{member.email}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </div>
                      </TableCell>

                      {/* Birth Information Cell */}
                      <TableCell className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="truncate">{formatDate(member.birthdate)}</span>
                        </div>
                        {member.gender && (
                          <div className="text-sm text-muted-foreground capitalize">
                            {member.gender}
                          </div>
                        )}
                      </TableCell>

                      {/* Member Details Cell */}
                      <TableCell className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden xl:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                              {member.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full capitalize">
                              {member.status}
                            </span>
                          </div>
                          {member.faculty && (
                            <div className="text-xs text-muted-foreground truncate">
                              {member.faculty}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && paginatedMembers.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No members found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'No members match your search criteria.' : 'No members have been added yet.'}
            </p>
          </div>
        )}

        {/* Table Footer */}
        {!isLoading && filteredMembers.length > 0 && (
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
  );
}
