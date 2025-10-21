"use client";

import { useState, useEffect } from 'react';
import { Edit, Save, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: number;
  status: string;
  recordedAt: string;
  member: {
    id: number;
    firstname: string;
    secondname: string;
    email: string;
    phone?: string;
  };
  permanentministryevent?: {
    id: number;
    name: string;
    type: string;
  };
  trainings?: {
    id: number;
    name: string;
    description?: string;
  };
}

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: number | null;
  onSuccess: () => void;
}

export function EditAttendanceModal({ 
  isOpen, 
  onClose, 
  attendanceId, 
  onSuccess 
}: EditAttendanceModalProps) {
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [status, setStatus] = useState<string>('');

  // Load attendance record when modal opens
  useEffect(() => {
    if (isOpen && attendanceId) {
      loadAttendanceRecord();
    } else {
      // Reset state when modal closes
      setRecord(null);
      setStatus('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, attendanceId]);

  const loadAttendanceRecord = async () => {
    if (!attendanceId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/attendance/${attendanceId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load attendance record');
      }

      const data = await response.json();
      setRecord(data);
      setStatus(data.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!record) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/attendance/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update attendance record');
      }

      const result = await response.json();
      setSuccess(result.message || 'Attendance record updated successfully');
      
      // Call success callback and close modal after a brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;

    if (!confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/attendance/${record.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete attendance record');
      }

      setSuccess('Attendance record deleted successfully');
      
      // Call success callback and close modal after a brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'excused':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'absent':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'excused':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Attendance Record
          </DialogTitle>
          <DialogDescription>
            Update the attendance status for this record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {record && !loading && (
            <>
              {/* Member Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Member Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {record.member.firstname} {record.member.secondname}</div>
                  <div><span className="text-muted-foreground">Email:</span> {record.member.email}</div>
                  {record.member.phone && <div><span className="text-muted-foreground">Phone:</span> {record.member.phone}</div>}
                </div>
              </div>

              {/* Event Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Event Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Event:</span> {record.permanentministryevent?.name || record.trainings?.name}</div>
                  <div><span className="text-muted-foreground">Type:</span> {record.permanentministryevent?.type || 'Training'}</div>
                  <div><span className="text-muted-foreground">Recorded:</span> {new Date(record.recordedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status">Attendance Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Present</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="absent">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Absent</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="excused">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span>Excused</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* Current Status Display */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current Status:</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                  getStatusColor(record.status)
                )}>
                  {getStatusIcon(record.status)}
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {record && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !status || loading}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
