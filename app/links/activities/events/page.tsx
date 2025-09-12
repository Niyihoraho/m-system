"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Plus, Edit, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import { AddEventModal } from "@/components/add-event-modal";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { EditEventModal } from "@/components/edit-event-modal";
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

interface Event {
  id: number;
  name: string;
  type: string;
  regionId: number;
  universityId: number | null;
  smallGroupId: number | null;
  alumniGroupId: number | null;
  isActive: boolean;
  region: { name: string };
  university: { name: string } | null;
  smallGroup: { name: string } | null;
  alumniGroup: { name: string } | null;
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    eventId: number | null;
    eventName: string;
  }>({
    isOpen: false,
    eventId: null,
    eventName: ''
  });
  const [deleting, setDeleting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (eventId: number, eventName: string) => {
    setDeleteModal({
      isOpen: true,
      eventId,
      eventName
    });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      eventId: null,
      eventName: ''
    });
  };

  // Open edit modal
  const openEditModal = (event: Event) => {
    setEditingEvent(event);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingEvent(null);
  };

  // Delete event function
  const deleteEvent = async () => {
    if (!deleteModal.eventId) return;

    setDeleting(true);
    
    try {
      const response = await axios.delete(`/api/events?id=${deleteModal.eventId}`);
      
      if (response.status === 200) {
        // Remove the event from the local state
        setEvents(prev => prev.filter(event => event.id !== deleteModal.eventId));
        
        // Close the modal
        closeDeleteModal();
        
        // Show success message (you could add a toast notification here)
        console.log('Event deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      event.name?.toLowerCase().includes(searchLower) ||
      event.type?.toLowerCase().includes(searchLower) ||
      event.region?.name?.toLowerCase().includes(searchLower) ||
      event.university?.name?.toLowerCase().includes(searchLower) ||
      event.smallGroup?.name?.toLowerCase().includes(searchLower) ||
      event.alumniGroup?.name?.toLowerCase().includes(searchLower)
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
                  <BreadcrumbPage>Events</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Events Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage events and their information across the organization</p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted/30 border border-border/20 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  />
                </div>

                {/* Refresh Button */}
                <button 
                  onClick={fetchEvents}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-foreground bg-muted/30 hover:bg-muted/50 border border-border/20 hover:border-border/40 rounded-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Add New Event Button */}
              <AddEventModal onEventAdded={fetchEvents}>
                <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-all duration-200 shadow-sm text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Event</span>
                  <span className="sm:hidden">Add Event</span>
                </button>
              </AddEventModal>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Error:</span>
                  <span className="text-sm">{error}</span>
                </div>
                <button 
                  onClick={fetchEvents}
                  className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Events Table */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading events...</span>
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
                          Event Name
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
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
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-foreground">
                          {event.id}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-foreground">
                          {event.name}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground">
                          {event.type}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted-foreground">
                          <div className="space-y-1">
                            <div className="font-medium">{event.region?.name}</div>
                            {event.university && (
                              <div className="text-xs text-muted-foreground">University: {event.university.name}</div>
                            )}
                            {event.smallGroup && (
                              <div className="text-xs text-muted-foreground">Small Group: {event.smallGroup.name}</div>
                            )}
                            {event.alumniGroup && (
                              <div className="text-xs text-muted-foreground">Alumni Group: {event.alumniGroup.name}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => openEditModal(event)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(event.id, event.name)}
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
              {!loading && filteredEvents.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? 'No events match your search criteria.' : 'No events have been added yet.'}
                  </p>
                  {!searchTerm && (
                    <AddEventModal onEventAdded={fetchEvents}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add First Event
                      </button>
                    </AddEventModal>
                  )}
                </div>
              )}

              {/* Table Footer */}
              {!loading && filteredEvents.length > 0 && (
                <div className="bg-muted/50 px-3 sm:px-6 py-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Showing <span className="font-medium text-foreground">{filteredEvents.length}</span> of <span className="font-medium text-foreground">{events.length}</span> events
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Modal */}
      <DeleteEventModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteEvent}
        eventName={deleteModal.eventName}
        isLoading={deleting}
      />
      
      {/* Edit Event Modal */}
      <EditEventModal
        event={editingEvent}
        onEventUpdated={fetchEvents}
        isOpen={editingEvent !== null}
        onClose={closeEditModal}
      />
    </SidebarProvider>
  );
}
