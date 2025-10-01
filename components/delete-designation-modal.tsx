"use client"

import * as React from "react"
import { Button } from "@/components/ui/ui copy/button"
import { Card, CardContent, CardHeader } from "@/components/ui/ui copy/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/ui copy/sheet"
import { AlertTriangle, Trash2, X } from "lucide-react"

interface DeleteDesignationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  designationName: string
  isLoading?: boolean
}

export function DeleteDesignationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  designationName, 
  isLoading = false 
}: DeleteDesignationModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="top" className="h-full w-full max-w-none overflow-y-auto">
        <div className="container mx-auto max-w-md py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl text-destructive">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              Delete Designation
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              This action cannot be undone. This will permanently delete the designation.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg border-destructive/20">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-destructive">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this designation?
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Warning Message */}
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        Warning: This action cannot be undone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You are about to delete the designation: <span className="font-semibold text-foreground">&quot;{designationName}&quot;</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This designation will be permanently removed from the system. If there are any contributions associated with this designation, the deletion will be prevented.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-11" 
                    onClick={onClose}
                    disabled={isDeleting || isLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    className="flex-1 h-11" 
                    onClick={handleConfirm}
                    disabled={isDeleting || isLoading}
                  >
                    {isDeleting || isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Designation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
