"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  ChevronUp, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Filter,
  Download,
  Search,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

interface PowerBITableColumn {
  key: string;
  label: string;
  type: 'number' | 'text' | 'percentage' | 'indicator' | 'comparison' | 'status' | 'date' | 'progress';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
  format?: (value: any) => string;
}

interface PowerBITableRow {
  [key: string]: any;
}

interface PowerBITableProps {
  title: string;
  description?: string;
  columns: PowerBITableColumn[];
  data: PowerBITableRow[];
  loading?: boolean;
  onExport?: () => void;
  onRowClick?: (rowData: PowerBITableRow) => void;
  onRefresh?: () => void;
  className?: string;
  selectedEvent?: string;
  onEventChange?: (value: string) => void;
  events?: Array<{id: number; name: string; type: string}>;
  loadingEvents?: boolean;
  selectedDate?: string;
  onDateChange?: (value: string) => void;
  availableDates?: Array<Date>;
  loadingDates?: boolean;
  showColumnSettings?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export function EnhancedPowerBITable({ 
  title, 
  description, 
  columns, 
  data, 
  loading = false, 
  onExport,
  onRowClick,
  onRefresh,
  className = "",
  selectedEvent = "all",
  onEventChange,
  events = [],
  loadingEvents = false,
  selectedDate = "",
  onDateChange,
  availableDates = [],
  loadingDates = false,
  showColumnSettings = true,
  pagination = true,
  pageSize = 20
}: PowerBITableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(columns.map(c => c.key)));
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced data processing with pagination
  const processedData = useMemo(() => {
    let filteredData = data;

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(row =>
        Object.entries(row).some(([key, value]) => {
          if (!visibleColumns.has(key)) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && visibleColumns.has(key)) {
        filteredData = filteredData.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig && visibleColumns.has(sortConfig.key)) {
      filteredData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, sortConfig, filters, searchTerm, visibleColumns]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = pagination ? processedData.slice(startIndex, endIndex) : processedData;

  // Visible columns
  const displayColumns = columns.filter(col => visibleColumns.has(col.key));

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh]);

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  }, []);

  const formatValue = useCallback((value: any, type: string, format?: (value: any) => string) => {
    try {
      if (format) {
        return <span className="text-white">{format(value)}</span>;
      }

      switch (type) {
        case 'number':
          return typeof value === 'number' ? 
            <span className="font-bold text-white">{value.toLocaleString()}</span> : 
            <span className="text-muted-foreground">{String(value || 'N/A')}</span>;
        case 'percentage':
          return typeof value === 'number' ? 
            <span className="font-bold text-white">{value.toFixed(1)}%</span> : 
            <span className="text-muted-foreground">{String(value || 'N/A')}</span>;
        case 'indicator':
          return renderTrendIndicator(value);
        case 'comparison':
          return renderComparison(value);
        case 'status':
          return renderStatusBadge(value);
        case 'date':
          return renderDate(value);
        case 'progress':
          return renderProgress(value);
        default:
          return <span className="text-muted-foreground">{String(value || 'N/A')}</span>;
      }
    } catch (error) {
      console.error('Error formatting value:', value, 'Type:', type, 'Error:', error);
      return <span className="text-muted-foreground">N/A</span>;
    }
  }, []);

  const renderTrendIndicator = (value: any) => {
    try {
      const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      
      if (numValue > 0) {
        return (
          <div className="flex items-center gap-1 text-green-400">
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-bold">+{numValue.toFixed(1)}%</span>
          </div>
        );
      } else if (numValue < 0) {
        return (
          <div className="flex items-center gap-1 text-red-400">
            <ArrowDownRight className="w-4 h-4" />
            <span className="font-bold">{numValue.toFixed(1)}%</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-1 text-gray-400">
            <Minus className="w-4 h-4" />
            <span className="font-bold">0.0%</span>
          </div>
        );
      }
    } catch (error) {
      return <span className="text-muted-foreground">N/A</span>;
    }
  };

  const renderComparison = (value: any) => {
    if (typeof value === 'object' && value !== null && value.current !== undefined) {
      const changePercent = value.previous !== 0 ? ((value.change / value.previous) * 100) : 0;
      const isPositive = changePercent >= 0;
      
      return (
        <div className="space-y-1">
          <div className="font-bold text-white text-lg">{value.current.toLocaleString()}</div>
          <div className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isPositive ? '+' : ''}{changePercent.toFixed(1)}% vs prev
          </div>
        </div>
      );
    } else if (typeof value === 'number') {
      return (
        <div className="font-bold text-white text-lg">{value.toLocaleString()}</div>
      );
    } else {
      return (
        <div className="font-bold text-white">{String(value)}</div>
      );
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      present: { color: 'bg-green-500', text: 'Present', icon: '✓' },
      absent: { color: 'bg-red-500', text: 'Absent', icon: '✗' },
      excuse: { color: 'bg-yellow-500', text: 'Excuse', icon: '!' },
      active: { color: 'bg-green-500', text: 'Active', icon: '●' },
      inactive: { color: 'bg-gray-500', text: 'Inactive', icon: '○' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-500', text: status, icon: '?' };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const renderDate = (dateValue: any) => {
    try {
      if (!dateValue) return <span className="text-muted-foreground">N/A</span>;
      
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return <span className="text-muted-foreground">Invalid Date</span>;
      
      return (
        <span className="text-white">
          {date.toLocaleDateString()}
        </span>
      );
    } catch (error) {
      return <span className="text-muted-foreground">N/A</span>;
    }
  };

  const renderProgress = (value: any) => {
    try {
      if (typeof value === 'object' && value !== null) {
        const { capacity, attendance, percentage } = value;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Capacity {capacity?.toLocaleString() || 0}</span>
            </div>
            <div className="text-xs text-gray-500">
              Participating {attendance?.toLocaleString() || 0}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  percentage >= 80 ? 'bg-green-500' : 
                  percentage >= 60 ? 'bg-yellow-500' : 
                  percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(percentage || 0, 100)}%` }}
              ></div>
            </div>
            <div className={`text-xs font-bold ${
              percentage >= 80 ? 'text-green-400' : 
              percentage >= 60 ? 'text-yellow-400' : 
              percentage >= 40 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {percentage || 0}%
            </div>
          </div>
        );
      }
      
      return <span className="text-muted-foreground">N/A</span>;
    } catch (error) {
      return <span className="text-muted-foreground">N/A</span>;
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronUp className="w-4 h-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                {title}
              </h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-lg font-medium">Loading table data...</span>
              <span className="text-sm">Please wait while we fetch the data</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          {showColumnSettings && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Search and Filter Controls */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Enhanced Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>

            {/* Date Filter */}
            {onDateChange && (
              <div className="flex items-center gap-2">
                <Label htmlFor="date-filter" className="text-sm font-medium whitespace-nowrap">
                  Date:
                </Label>
                <Select value={selectedDate} onValueChange={onDateChange} disabled={loadingDates}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={loadingDates ? "Loading dates..." : "Select date"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const displayDate = date.toLocaleDateString();
                      return (
                        <SelectItem key={dateStr} value={dateStr}>
                          {displayDate}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Event Filter */}
            {onEventChange && (
              <div className="flex items-center gap-2">
                <Label htmlFor="event-filter" className="text-sm font-medium whitespace-nowrap">
                  Event:
                </Label>
                <Select value={selectedEvent} onValueChange={onEventChange} disabled={loadingEvents}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={loadingEvents ? "Loading events..." : "Select event"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Clear Filters Button */}
            <button 
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-3 py-2 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Column Visibility Settings */}
        {showFilters && showColumnSettings && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-foreground mr-2">Show columns:</span>
              {columns.map((column) => (
                <button
                  key={column.key}
                  onClick={() => toggleColumnVisibility(column.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                    visibleColumns.has(column.key)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {visibleColumns.has(column.key) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {column.label}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Enhanced Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {displayColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-muted/70' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length} className="px-3 sm:px-6 py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-50" />
                      <span>No data found</span>
                      {(searchTerm || Object.keys(filters).some(key => filters[key])) && (
                        <button 
                          onClick={clearFilters}
                          className="text-sm text-primary hover:underline"
                        >
                          Clear filters to see all data
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {displayColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 sm:px-6 py-3 sm:py-4 text-sm ${
                          column.align === 'center' ? 'text-center' :
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatValue(row[column.key], column.type, column.format)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Table Footer with Pagination */}
      {processedData.length > 0 && (
        <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing <span className="font-medium text-foreground">{startIndex + 1}-{Math.min(endIndex, processedData.length)}</span> of <span className="font-medium text-foreground">{processedData.length}</span> records
              {processedData.length !== data.length && (
                <span className="ml-2 text-primary">
                  ({data.length - processedData.length} filtered out)
                </span>
              )}
            </div>
            
            {/* Pagination Controls */}
            {pagination && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 py-1 text-xs rounded ${
                          currentPage === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="text-xs sm:text-sm text-muted-foreground">
              {Object.keys(filters).filter(key => filters[key]).length > 0 && (
                <span className="text-primary">
                  {Object.keys(filters).filter(key => filters[key]).length} filter(s) applied
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

