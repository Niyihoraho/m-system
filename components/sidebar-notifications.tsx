"use client";

import { useState, useEffect } from 'react';
import { Bell, Check, X, Calendar, Users, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUserScope } from "@/components/role-based-access";

interface Notification {
  id: number;
  type: 'in_app';
  subject?: string;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt?: string;
  createdAt: string;
  readAt?: string;
  eventType?: string;
  eventId?: number;
  metadata?: string;
}

interface SidebarNotificationsProps {
  className?: string;
}

export function SidebarNotifications({ className }: SidebarNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { userRole } = useUserScope();

  // Show notifications to small group leaders and university scope users
  const shouldShowNotifications = userRole === 'smallgroup' || userRole === 'university';

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    if (!shouldShowNotifications) return;
    
    try {
      const response = await fetch('/api/notifications?limit=1&unreadOnly=true');
      const data = await response.json();
      
      if (data.pagination) {
        setUnreadCount(data.pagination.total);
        console.log(`🔔 Unread notifications count: ${data.pagination.total}`);
      } else if (data.notifications) {
        setUnreadCount(data.notifications.length);
        console.log(`🔔 Unread notifications count: ${data.notifications.length}`);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!shouldShowNotifications) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=5&unreadOnly=false');
      const data = await response.json();
      
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.readAt).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          readAt: new Date().toISOString(),
          status: 'read'
        })
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { 
            ...n, 
            readAt: new Date().toISOString(),
            status: 'read'
          } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.readAt);
      await Promise.all(
        unreadNotifications.map(n => markAsRead(n.id))
      );
      
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        return deletedNotification && !deletedNotification.readAt ? prev - 1 : prev;
      });
      
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    if (shouldShowNotifications) {
      // Fetch unread count immediately on mount
      fetchUnreadCount();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [shouldShowNotifications]);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (isOpen && shouldShowNotifications) {
      fetchNotifications();
    }
  }, [isOpen, shouldShowNotifications]);

  // Parse notification metadata
  const parseMetadata = (metadata?: string) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  // Format notification time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Don't render if user is not a small group leader
  if (!shouldShowNotifications) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-pulse")} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Attendance Alerts</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-6 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No attendance alerts
          </div>
        ) : (
          notifications.map((notification) => {
            const metadata = parseMetadata(notification.metadata);
            const isUnread = !notification.readAt;
            
            return (
              <div key={notification.id} className="border-b last:border-b-0">
                <div 
                  className={cn(
                    "p-3 cursor-pointer",
                    isUnread && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {userRole === 'university' ? 'Event Acknowledgment' : 'Attendance Alert'}
                      </Badge>
                      <Badge 
                        variant={notification.status === 'sent' ? 'default' : notification.status === 'pending' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {notification.status}
                      </Badge>
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-1">
                        {notification.subject || 'Attendance Alert'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                    </div>
                    
                    {metadata && notification.eventType === 'attendance_miss' && userRole === 'smallgroup' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(metadata.eventDate).toLocaleDateString()}</span>
                          <Users className="h-3 w-3 ml-2" />
                          <span>{metadata.totalAbsent} absent</span>
                        </div>
                        
                        {metadata.absentMembers && metadata.absentMembers.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="text-xs font-medium mb-2">Absent Members:</div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-1 px-2 font-medium">Name</th>
                                    <th className="text-left py-1 px-2 font-medium">Phone</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {metadata.absentMembers.slice(0, 5).map((member: any, index: number) => (
                                    <tr key={index} className="border-b last:border-b-0">
                                      <td className="py-1 px-2">{member.name}</td>
                                      <td className="py-1 px-2">
                                        {member.phone && member.phone !== 'N/A' ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`tel:${member.phone}`);
                                            }}
                                          >
                                            <Phone className="h-3 w-3" />
                                          </Button>
                                        ) : (
                                          <span className="text-muted-foreground">N/A</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {metadata.absentMembers.length > 5 && (
                                <div className="text-xs text-muted-foreground mt-1 text-center">
                                  +{metadata.absentMembers.length - 5} more members
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {metadata && notification.eventType === 'university_acknowledgment' && userRole === 'university' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(metadata.eventDate).toLocaleDateString()}</span>
                          <Users className="h-3 w-3 ml-2" />
                          <span>{metadata.totalAcknowledgedGroups} group{metadata.totalAcknowledgedGroups > 1 ? 's' : ''} acknowledged</span>
                        </div>
                        
                        {metadata.acknowledgedSmallGroups && metadata.acknowledgedSmallGroups.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="text-xs font-medium mb-2">Acknowledged Small Groups:</div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-1 px-2 font-medium">Small Group</th>
                                    <th className="text-left py-1 px-2 font-medium">Leader</th>
                                    <th className="text-left py-1 px-2 font-medium">Absent</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {metadata.acknowledgedSmallGroups.slice(0, 5).map((group: any, index: number) => (
                                    <tr key={index} className="border-b last:border-b-0">
                                      <td className="py-1 px-2">{group.smallGroupName}</td>
                                      <td className="py-1 px-2">{group.smallGroupLeaderName}</td>
                                      <td className="py-1 px-2">{group.totalAbsent}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {metadata.acknowledgedSmallGroups.length > 5 && (
                                <div className="text-xs text-muted-foreground mt-1 text-center">
                                  +{metadata.acknowledgedSmallGroups.length - 5} more groups
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatTime(notification.createdAt)}</span>
                      
                      <div className="flex items-center gap-1">
                        {isUnread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/links/admin/notifications';
                }}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
