"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AdvancedFilters, ENGAGEMENT_FILTERS, useFilterState } from '@/components/reports/advanced-filters';

interface FilterIntegrationProps {
  onFiltersChange: (filters: string) => void;
  selectedEvent: string;
  onEventChange: (value: string) => void;
  events: Array<{id: number; name: string; type: string}>;
  loadingEvents: boolean;
  selectedDate: string;
  onDateChange: (value: string) => void;
  availableDates: Array<Date>;
  loadingDates: boolean;
  currentLevel: 'national' | 'region' | 'university' | 'member';
  navigationStack: Array<{level: string, id: number, name: string}>;
}

export function FilterIntegration({
  onFiltersChange,
  selectedEvent,
  onEventChange,
  events,
  loadingEvents,
  selectedDate,
  onDateChange,
  availableDates,
  loadingDates,
  currentLevel,
  navigationStack
}: FilterIntegrationProps) {
  const { filters, updateFilter, clearAllFilters, getFilterParams } = useFilterState();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Update filters when navigation changes
  useEffect(() => {
    const navigationParams = new URLSearchParams();
    navigationParams.append('currentLevel', currentLevel);
    
    navigationStack.forEach((item, index) => {
      navigationParams.append(`level${index}Id`, item.id.toString());
    });

    // Add event and date filters
    if (selectedEvent && selectedEvent !== 'all') {
      navigationParams.append('selectedEvent', selectedEvent);
    }
    if (selectedDate) {
      navigationParams.append('selectedDate', selectedDate);
    }

    // Add advanced filters
    const advancedFilters = getFilterParams();
    if (advancedFilters) {
      advancedFilters.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          navigationParams.append(key, decodeURIComponent(value));
        }
      });
    }

    onFiltersChange(navigationParams.toString());
  }, [currentLevel, navigationStack, selectedEvent, selectedDate, filters, onFiltersChange, getFilterParams]);

  const handleAdvancedFilterChange = useCallback((newFilters: any) => {
    // Update individual filters
    Object.entries(newFilters).forEach(([key, value]) => {
      updateFilter(key, value);
    });
  }, [updateFilter]);

  const handleAdvancedFilterClear = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  const handleAdvancedFilterApply = useCallback(() => {
    // Filters are automatically applied through useEffect
    setShowAdvancedFilters(false);
  }, []);

  // Enhanced filter options based on current level
  const getEnhancedFilters = () => {
    const baseFilters = [...ENGAGEMENT_FILTERS];
    
    // Add level-specific filters
    if (currentLevel === 'member') {
      baseFilters.push({
        key: 'memberType',
        label: 'Member Type',
        type: 'multiselect',
        options: [
          { value: 'student', label: 'Students' },
          { value: 'graduate', label: 'Graduates' },
          { value: 'alumni', label: 'Alumni' },
          { value: 'staff', label: 'Staff' },
          { value: 'volunteer', label: 'Volunteers' }
        ]
      });
      
      baseFilters.push({
        key: 'memberStatus',
        label: 'Member Status',
        type: 'multiselect',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'pre_graduate', label: 'Pre-Graduate' },
          { value: 'graduate', label: 'Graduate' },
          { value: 'alumni', label: 'Alumni' },
          { value: 'inactive', label: 'Inactive' }
        ]
      });
    }

    return baseFilters;
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Event Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Event:</label>
          <select
            value={selectedEvent}
            onChange={(e) => onEventChange(e.target.value)}
            disabled={loadingEvents}
            className="px-3 py-2 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm min-w-[150px]"
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id.toString()}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={loadingDates}
            className="px-3 py-2 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm min-w-[120px]"
          >
            <option value="">All Dates</option>
            {availableDates.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const displayDate = date.toLocaleDateString();
              return (
                <option key={dateStr} value={dateStr}>
                  {displayDate}
                </option>
              );
            })}
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-lg transition-all duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          Advanced Filters
        </button>

        {/* Clear All Filters */}
        <button
          onClick={() => {
            onEventChange('all');
            onDateChange('');
            clearAllFilters();
          }}
          className="flex items-center gap-2 px-3 py-2 bg-muted/30 text-foreground hover:bg-muted/50 border border-border/20 rounded-lg transition-all duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <AdvancedFilters
          filters={getEnhancedFilters()}
          values={filters}
          onChange={handleAdvancedFilterChange}
          onClear={handleAdvancedFilterClear}
          onApply={handleAdvancedFilterApply}
          title={`${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} Level Filters`}
          showTitle={true}
          collapsible={false}
          defaultCollapsed={false}
        />
      )}

      {/* Active Filters Summary */}
      {(selectedEvent !== 'all' || selectedDate || Object.keys(filters).some(key => filters[key])) && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
          
          {selectedEvent !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
              Event: {events.find(e => e.id.toString() === selectedEvent)?.name || selectedEvent}
              <button
                onClick={() => onEventChange('all')}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {selectedDate && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
              Date: {new Date(selectedDate).toLocaleDateString()}
              <button
                onClick={() => onDateChange('')}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {Object.entries(filters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            
            const filter = getEnhancedFilters().find(f => f.key === key);
            const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
            
            return (
              <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                {filter?.label || key}: {displayValue}
                <button
                  onClick={() => updateFilter(key, Array.isArray(value) ? [] : null)}
                  className="hover:bg-primary/20 rounded p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

