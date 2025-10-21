"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  Search, 
  X, 
  Calendar,
  Users,
  Building,
  MapPin,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'checkbox';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterState {
  [key: string]: string | string[] | number | Date | null;
}

export interface AdvancedFiltersProps {
  filters: FilterOption[];
  values: FilterState;
  onChange: (values: FilterState) => void;
  onClear: () => void;
  onApply: () => void;
  className?: string;
  title?: string;
  showTitle?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onClear,
  onApply,
  className = "",
  title = "Advanced Filters",
  showTitle = true,
  collapsible = true,
  defaultCollapsed = true
}: AdvancedFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [localValues, setLocalValues] = useState<FilterState>(values);

  const handleValueChange = useCallback((key: string, value: any) => {
    const newValues = { ...localValues, [key]: value };
    setLocalValues(newValues);
    onChange(newValues);
  }, [localValues, onChange]);

  const handleClear = useCallback(() => {
    const clearedValues: FilterState = {};
    filters.forEach(filter => {
      clearedValues[filter.key] = filter.type === 'multiselect' ? [] : null;
    });
    setLocalValues(clearedValues);
    onClear();
  }, [filters, onClear]);

  const handleApply = useCallback(() => {
    onApply();
  }, [onApply]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(localValues).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    }).length;
  }, [localValues]);

  const renderFilterInput = (filter: FilterOption) => {
    const value = localValues[filter.key];

    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}...`}
            value={value as string || ''}
            onChange={(e) => handleValueChange(filter.key, e.target.value)}
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select
            value={value as string || ''}
            onValueChange={(val) => handleValueChange(filter.key, val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const multiValue = value as string[] || [];
        return (
          <div className="space-y-2">
            <Select
              value=""
              onValueChange={(val) => {
                if (!multiValue.includes(val)) {
                  handleValueChange(filter.key, [...multiValue, val]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={filter.placeholder || `Add ${filter.label.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.filter(opt => !multiValue.includes(opt.value)).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {multiValue.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {multiValue.map((val) => {
                  const option = filter.options?.find(opt => opt.value === val);
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                    >
                      {option?.label || val}
                      <button
                        onClick={() => {
                          handleValueChange(filter.key, multiValue.filter(v => v !== val));
                        }}
                        className="hover:bg-primary/20 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value ? (value as Date).toISOString().split('T')[0] : ''}
            onChange={(e) => handleValueChange(filter.key, e.target.value ? new Date(e.target.value) : null)}
            className="w-full"
          />
        );

      case 'daterange':
        const dateRange = value as { from?: Date; to?: Date } || {};
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const from = e.target.value ? new Date(e.target.value) : undefined;
                handleValueChange(filter.key, { ...dateRange, from });
              }}
              className="flex-1"
            />
            <Input
              type="date"
              placeholder="To"
              value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const to = e.target.value ? new Date(e.target.value) : undefined;
                handleValueChange(filter.key, { ...dateRange, to });
              }}
              className="flex-1"
            />
          </div>
        );

      case 'number':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={filter.min?.toString() || 'Min'}
              min={filter.min}
              max={filter.max}
              value={value as number || ''}
              onChange={(e) => handleValueChange(filter.key, e.target.value ? Number(e.target.value) : null)}
              className="flex-1"
            />
            {filter.max && (
              <Input
                type="number"
                placeholder={filter.max.toString()}
                min={filter.min}
                max={filter.max}
                onChange={(e) => {
                  // Handle range input if needed
                }}
                className="flex-1"
              />
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.key}-${option.value}`}
                  checked={(value as string[] || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = value as string[] || [];
                    if (checked) {
                      handleValueChange(filter.key, [...currentValues, option.value]);
                    } else {
                      handleValueChange(filter.key, currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${filter.key}-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const getFilterIcon = (filter: FilterOption) => {
    switch (filter.type) {
      case 'date':
      case 'daterange':
        return <Calendar className="w-4 h-4" />;
      case 'select':
      case 'multiselect':
        return <Users className="w-4 h-4" />;
      case 'text':
        return <Search className="w-4 h-4" />;
      case 'number':
        return <Building className="w-4 h-4" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {title}
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </CardTitle>
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1"
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      {(!collapsible || !isCollapsed) && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {getFilterIcon(filter)}
                  {filter.label}
                </Label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={activeFiltersCount === 0}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All
              </Button>
              {activeFiltersCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </span>
              )}
            </div>
            <Button
              onClick={handleApply}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Predefined filter configurations for common use cases
export const ENGAGEMENT_FILTERS: FilterOption[] = [
  {
    key: 'eventType',
    label: 'Event Type',
    type: 'multiselect',
    options: [
      { value: 'bible_study', label: 'Bible Study' },
      { value: 'discipleship', label: 'Discipleship' },
      { value: 'evangelism', label: 'Evangelism' },
      { value: 'cell_meeting', label: 'Cell Meeting' },
      { value: 'training', label: 'Training' },
      { value: 'conference', label: 'Conference' }
    ]
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    type: 'daterange'
  },
  {
    key: 'attendanceStatus',
    label: 'Attendance Status',
    type: 'select',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'present', label: 'Present Only' },
      { value: 'absent', label: 'Absent Only' },
      { value: 'excuse', label: 'Excuse Only' }
    ]
  },
  {
    key: 'engagementLevel',
    label: 'Engagement Level',
    type: 'select',
    options: [
      { value: 'all', label: 'All Levels' },
      { value: 'high', label: 'High Engagement' },
      { value: 'medium', label: 'Medium Engagement' },
      { value: 'low', label: 'Low Engagement' }
    ]
  }
];

export const MEMBERSHIP_FILTERS: FilterOption[] = [
  {
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
  },
  {
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
  },
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    options: [
      { value: 'all', label: 'All Genders' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ]
  },
  {
    key: 'ageRange',
    label: 'Age Range',
    type: 'number',
    min: 18,
    max: 100
  },
  {
    key: 'profession',
    label: 'Profession',
    type: 'text',
    placeholder: 'Search by profession...'
  },
  {
    key: 'faculty',
    label: 'Faculty',
    type: 'text',
    placeholder: 'Search by faculty...'
  },
  {
    key: 'placeOfBirth',
    label: 'Place of Birth',
    type: 'text',
    placeholder: 'Search by province/district...'
  },
  {
    key: 'graduationYear',
    label: 'Graduation Year',
    type: 'number',
    min: 2000,
    max: new Date().getFullYear()
  }
];

// Hook for managing filter state
export function useFilterState(initialFilters: FilterState = {}) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    }).length;
  }, [filters]);

  const getFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else if (value !== null && value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return params.toString();
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    getActiveFiltersCount,
    getFilterParams,
    setFilters
  };
}

