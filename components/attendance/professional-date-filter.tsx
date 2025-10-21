"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
// Using native JavaScript date methods instead of external dependencies

interface PredefinedRange {
  id: string;
  label: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  available: boolean;
}

interface DateStats {
  totalDates: number;
  hasToday: boolean;
  hasYesterday: boolean;
  datesLastWeek: number;
  datesLastMonth: number;
  datesLast3Months: number;
  oldestDate: Date;
  newestDate: Date;
}

interface ProfessionalDateFilterProps {
  onDateRangeChange: (dateFrom: string | null, dateTo: string | null, rangeId: string | null) => void;
  onCustomDateChange?: (dateFrom: string | null, dateTo: string | null) => void;
  className?: string;
  showStats?: boolean;
  showQuickActions?: boolean;
}

export function ProfessionalDateFilter({
  onDateRangeChange,
  onCustomDateChange,
  className,
  showStats = true,
  showQuickActions = true
}: ProfessionalDateFilterProps) {
  const [predefinedRanges, setPredefinedRanges] = useState<PredefinedRange[]>([]);
  const [dateStats, setDateStats] = useState<DateStats | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('all');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch predefined ranges and stats
  useEffect(() => {
    const fetchDateData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/attendance/dates?includeStats=true');
        if (response.ok) {
          const data = await response.json();
          setPredefinedRanges(data.predefinedRanges || []);
          setDateStats(data.stats || null);
        }
      } catch (error) {
        console.error('Error fetching date data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateData();
  }, []);

  // Handle predefined range selection
  const handleRangeSelect = (rangeId: string) => {
    setSelectedRange(rangeId);
    setIsCustomRange(false);
    
    if (rangeId === 'all') {
      onDateRangeChange(null, null, null);
    } else {
      const range = predefinedRanges.find(r => r.id === rangeId);
      if (range) {
        onDateRangeChange(range.dateFrom, range.dateTo, rangeId);
      }
    }
    setIsOpen(false);
  };

  // Handle custom date range
  const handleCustomDateChange = () => {
    if (customDateFrom && customDateTo) {
      setIsCustomRange(true);
      setSelectedRange('custom');
      onDateRangeChange(customDateFrom, customDateTo, 'custom');
      if (onCustomDateChange) {
        onCustomDateChange(customDateFrom, customDateTo);
      }
    }
  };

  // Helper functions for date manipulation
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getStartOfWeek = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  };

  const getEndOfWeek = (date: Date): Date => {
    const weekStart = getStartOfWeek(new Date(date));
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  };

  const getStartOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getEndOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const subtractDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    const today = new Date();
    let dateFrom: string | null = null;
    let dateTo: string | null = null;

    switch (action) {
      case 'today':
        dateFrom = formatDate(today);
        dateTo = formatDate(today);
        break;
      case 'yesterday':
        const yesterday = subtractDays(today, 1);
        dateFrom = formatDate(yesterday);
        dateTo = formatDate(yesterday);
        break;
      case 'last7days':
        dateFrom = formatDate(subtractDays(today, 6));
        dateTo = formatDate(today);
        break;
      case 'thisweek':
        dateFrom = formatDate(getStartOfWeek(new Date(today)));
        dateTo = formatDate(getEndOfWeek(new Date(today)));
        break;
      case 'thismonth':
        dateFrom = formatDate(getStartOfMonth(today));
        dateTo = formatDate(getEndOfMonth(today));
        break;
    }

    if (dateFrom && dateTo) {
      onDateRangeChange(dateFrom, dateTo, action);
      setSelectedRange(action);
      setIsCustomRange(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedRange('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setIsCustomRange(false);
    onDateRangeChange(null, null, null);
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading date filters...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Calendar className="h-5 w-5" />
          <span>Date Filter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        {showQuickActions && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Actions</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRange === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickAction('today')}
                disabled={!dateStats?.hasToday}
              >
                <Clock className="h-3 w-3 mr-1" />
                Today
              </Button>
              <Button
                variant={selectedRange === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickAction('yesterday')}
                disabled={!dateStats?.hasYesterday}
              >
                <Clock className="h-3 w-3 mr-1" />
                Yesterday
              </Button>
              <Button
                variant={selectedRange === 'last7days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickAction('last7days')}
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                Last 7 Days
              </Button>
              <Button
                variant={selectedRange === 'thisweek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickAction('thisweek')}
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                This Week
              </Button>
              <Button
                variant={selectedRange === 'thismonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickAction('thismonth')}
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                This Month
              </Button>
            </div>
          </div>
        )}

        {/* Predefined Ranges */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Predefined Ranges</Label>
          <Select value={selectedRange} onValueChange={handleRangeSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {predefinedRanges.map((range) => (
                <SelectItem
                  key={range.id}
                  value={range.id}
                  disabled={!range.available}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{range.label}</span>
                    {!range.available && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        No Data
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleCustomDateChange}
            disabled={!customDateFrom || !customDateTo}
            size="sm"
            className="w-full"
          >
            Apply Custom Range
          </Button>
        </div>

        {/* Statistics */}
        {showStats && dateStats && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Statistics</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Dates:</span>
                <Badge variant="outline">{dateStats.totalDates}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Week:</span>
                <Badge variant="outline">{dateStats.datesLastWeek}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Month:</span>
                <Badge variant="outline">{dateStats.datesLastMonth}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last 3 Months:</span>
                <Badge variant="outline">{dateStats.datesLast3Months}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Filter className="h-3 w-3 mr-1" />
          Clear All Filters
        </Button>

        {/* Current Selection Display */}
        {selectedRange !== 'all' && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Filter:</span>
              <Badge variant="secondary">
                {isCustomRange ? 'Custom Range' : predefinedRanges.find(r => r.id === selectedRange)?.label || selectedRange}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
