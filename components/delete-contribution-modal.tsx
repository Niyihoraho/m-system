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
import { AlertTriangle, Trash2, X, DollarSign } from "lucide-react"

interface DeleteContributionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  contributionAmount: number
  contributorName: string
  isLoading?: boolean
}

export function DeleteContributionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  contributionAmount,
  contributorName,
  isLoading = false 
}: DeleteContributionModalProps) {
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
              Delete Contribution
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              This action cannot be undone. This will permanently delete the contribution record.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg border-destructive/20">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-destructive">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this contribution?
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Contribution Details */}
                <div className="p-4 bg-muted/50 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {contributorName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amount: {contributionAmount.toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        Warning: This action cannot be undone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You are about to delete the contribution from <span className="font-semibold text-foreground">&quot;{contributorName}&quot;</span> for <span className="font-semibold text-foreground">{contributionAmount.toLocaleString()} RWF</span>.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This contribution will be permanently removed from the system. Any associated receipts and payment records will also be deleted.
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
                        Delete Contribution
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
