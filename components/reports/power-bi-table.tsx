"use client";

import React, { useState, useMemo } from 'react';
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
  Search
} from 'lucide-react';

interface PowerBITableColumn {
  key: string;
  label: string;
  type: 'number' | 'text' | 'percentage' | 'indicator' | 'comparison' | 'status' | 'date';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
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
  className?: string;
  selectedEvent?: string;
  onEventChange?: (value: string) => void;
  events?: Array<{id: number; name: string; type: string}>;
  loadingEvents?: boolean;
  selectedDate?: string;
  onDateChange?: (value: string) => void;
  availableDates?: Array<Date>;
  loadingDates?: boolean;
}

export function PowerBITable({ 
  title, 
  description, 
  columns, 
  data, 
  loading = false, 
  onExport,
  onRowClick,
  className = "",
  selectedEvent = "all",
  onEventChange,
  events = [],
  loadingEvents = false,
  selectedDate = "",
  onDateChange,
  availableDates = [],
  loadingDates = false
}: PowerBITableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredData = data;

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filteredData = filteredData.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
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
  }, [data, sortConfig, filters, searchTerm]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const formatValue = (value: any, type: string) => {
    try {
      switch (type) {
        case 'number':
          return typeof value === 'number' ? <span className="font-bold text-white">{value.toLocaleString()}</span> : <span className="text-muted-foreground">{String(value || 'N/A')}</span>;
        case 'percentage':
          return typeof value === 'number' ? <span className="font-bold text-white">{value.toFixed(1)}%</span> : <span className="text-muted-foreground">{String(value || 'N/A')}</span>;
        case 'indicator':
          return renderSimpleTrend(value);
        case 'comparison':
          return renderSimpleComparison(value);
        case 'status':
          return renderStatusBadge(value);
        case 'date':
          return renderDate(value);
        default:
          return <span className="text-muted-foreground">{String(value || 'N/A')}</span>;
      }
    } catch (error) {
      console.error('Error formatting value:', value, 'Type:', type, 'Error:', error);
      return <span className="text-muted-foreground">N/A</span>;
    }
  };

  const renderSimpleTrend = (value: any) => {
    try {
      const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      
      if (numValue > 0) {
        return (
          <span className="font-bold text-white">
            ↗ +{numValue.toFixed(1)}%
          </span>
        );
      } else if (numValue < 0) {
        return (
          <span className="font-bold text-white">
            ↘ {numValue.toFixed(1)}%
          </span>
        );
      } else {
        return (
          <span className="font-bold text-white">
            → 0.0%
          </span>
        );
      }
    } catch (error) {
      console.error('Error rendering trend:', value, 'Error:', error);
      return <span className="text-muted-foreground">N/A</span>;
    }
  };

  const renderSimpleComparison = (value: any) => {
    // Handle both object format and simple number format
    if (typeof value === 'object' && value !== null && value.current !== undefined) {
      // Object format: { current: number, previous: number, change: number }
      const changePercent = value.previous !== 0 ? ((value.change / value.previous) * 100) : 0;
      
      return (
        <div>
          <div className="font-bold text-white">{value.current.toLocaleString()}</div>
          <div className={`text-xs text-muted-foreground`}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}% change
          </div>
        </div>
      );
    } else if (typeof value === 'number') {
      // Simple number format - just display the number
      return (
        <div>
          <div className="font-bold text-white">{value.toLocaleString()}</div>
        </div>
      );
    } else {
      // Fallback for other types
      return (
        <div>
          <div className="font-bold text-white">{String(value)}</div>
        </div>
      );
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      present: { color: 'bg-green-500', text: 'Present' },
      absent: { color: 'bg-red-500', text: 'Absent' },
      excuse: { color: 'bg-yellow-500', text: 'Excuse' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-500', text: status };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
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
        {/* Header */}
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

        {/* Loading Table */}
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
      {/* Header */}
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
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
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

      {/* Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {columns.map((column) => (
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
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 sm:px-6 py-8 text-center text-muted-foreground">
                    No data found
                  </td>
                </tr>
              ) : (
                processedData.map((row, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 sm:px-6 py-3 sm:py-4 text-sm ${
                          column.align === 'center' ? 'text-center' :
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatValue(row[column.key], column.type)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Footer */}
      {processedData.length > 0 && (
        <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing <span className="font-medium text-foreground">{processedData.length}</span> of <span className="font-medium text-foreground">{data.length}</span> records
            </div>
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
