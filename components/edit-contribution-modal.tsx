"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Edit, DollarSign, User, CreditCard, Receipt } from "lucide-react"

interface Member {
  id: number;
  firstname: string | null;
  secondname: string | null;
  email: string | null;
  phone: string | null;
}

interface Designation {
  id: number;
  name: string;
  description: string | null;
  targetAmount: number | null;
  currentAmount: number;
  isActive: boolean;
  region: { name: string } | null;
  university: { name: string } | null;
  smallgroup: { name: string } | null;
}

interface PaymentProvider {
  id: number;
  name: string;
  provider: string;
  supportedMethods: string;
}

interface Contribution {
  id: number;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
  contributor: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    memberId: number | null;
  };
  contributiondesignation: {
    id: number;
    name: string;
    targetAmount: number | null;
    currentAmount: number;
    region: { name: string } | null;
    university: { name: string } | null;
    smallgroup: { name: string } | null;
  } | null;
  member: {
    id: number;
    firstname: string | null;
    secondname: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  paymenttransaction: {
    id: number;
    externalId: string;
    amount: number;
    currency: string;
    status: string;
    paymentgateway: {
      id: number;
      name: string;
      provider: string;
    };
  } | null;
  contributionreceipt: {
    id: number;
    receiptNumber: string;
    pdfPath: string | null;
    emailSent: boolean;
    smsSent: boolean;
  } | null;
}

interface EditContributionModalProps {
  contribution: Contribution | null
  isOpen: boolean
  onClose: () => void
  onContributionUpdated?: () => void
}

export function EditContributionModal({ contribution, isOpen, onClose, onContributionUpdated }: EditContributionModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [success, setSuccess] = React.useState(false)
  const [members, setMembers] = React.useState<Member[]>([])
  const [designations, setDesignations] = React.useState<Designation[]>([])
  const [paymentProviders, setPaymentProviders] = React.useState<PaymentProvider[]>([])
  const [formData, setFormData] = React.useState({
    amount: "",
    method: "mobile_money" as "mobile_money" | "bank_transfer" | "card" | "worldremit",
    designationId: "",
    status: "pending" as "pending" | "completed" | "failed" | "refunded" | "processing" | "cancelled",
    contributor: {
      name: "",
      email: "",
      phone: "",
      memberId: "",
    },
  })

  // Update form data when contribution changes
  React.useEffect(() => {
    if (contribution) {
      setFormData({
        amount: contribution.amount.toString(),
        method: contribution.method,
        designationId: contribution.contributiondesignation?.id.toString() || "",
        status: contribution.status,
        contributor: {
          name: contribution.contributor.name,
          email: contribution.contributor.email || "",
          phone: contribution.contributor.phone || "",
          memberId: contribution.contributor.memberId?.toString() || "",
        },
      })
    }
  }, [contribution])

  // Fetch data when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchMembers()
      fetchDesignations()
      fetchPaymentProviders()
    }
  }, [isOpen])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchDesignations = async () => {
    try {
      const response = await fetch('/api/designations')
      const data = await response.json()
      setDesignations(data)
    } catch (error) {
      console.error('Error fetching designations:', error)
    }
  }

  const fetchPaymentProviders = async () => {
    try {
      const response = await fetch('/api/payment-providers')
      const data = await response.json()
      setPaymentProviders(data)
    } catch (error) {
      console.error('Error fetching payment providers:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
    
    // Clear success state when user starts typing
    if (success) {
      setSuccess(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required"
    }
    
    if (!formData.method) {
      newErrors.method = "Payment method is required"
    }
    
    if (!formData.status) {
      newErrors.status = "Status is required"
    }
    
    if (!formData.contributor.name.trim()) {
      newErrors['contributor.name'] = "Contributor name is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contribution) return
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      console.log('Updating contribution data:', formData)
      
      const response = await fetch(`/api/contributions/${contribution.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contributor: {
            id: contribution.contributor.id,
            name: formData.contributor.name,
            email: formData.contributor.email || null,
            phone: formData.contributor.phone || null,
            memberId: formData.contributor.memberId ? Number(formData.contributor.memberId) : null,
          },
          amount: Number(formData.amount),
          method: formData.method,
          designationId: formData.designationId ? Number(formData.designationId) : null,
          status: formData.status,
        })
      })
      const data = await response.json()
      
      console.log('API response:', { status: response.status, data })
      
      if (response.ok) {
        // Show success message
        setSuccess(true)
        setErrors({})
        
        // Call the callback to refresh the contributions list
        if (onContributionUpdated) {
          onContributionUpdated()
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 1500)
      } else {
        // Handle API errors
        console.error('API Error:', data)
        setErrors({ general: data.error || "Failed to update contribution" })
      }
    } catch (error) {
      console.error("Error updating contribution:", error)
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  if (!contribution) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="top" className="h-full w-full max-w-none overflow-y-auto">
        <div className="container mx-auto max-w-2xl py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Edit className="h-6 w-6 text-primary" />
              </div>
              Edit Contribution
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Update the contribution information below.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Contribution Information</h3>
                <p className="text-sm text-muted-foreground">Update the details below to modify this contribution</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                {/* Contribution Details */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Contribution Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Amount (RWF) *
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-11"
                        value={formData.amount}
                        onChange={(e) => handleInputChange("amount", e.target.value)}
                        required
                      />
                      {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="method" className="text-sm font-medium">
                        Payment Method *
                      </Label>
                      <Select
                        value={formData.method}
                        onValueChange={(value) => handleInputChange("method", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="card">Card Payment</SelectItem>
                          <SelectItem value="worldremit">WorldRemit</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.method && <p className="text-sm text-red-600">{errors.method}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designationId" className="text-sm font-medium">
                        Designation (Optional)
                      </Label>
                      <Select
                        value={formData.designationId}
                        onValueChange={(value) => handleInputChange("designationId", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a designation (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {designations.map((designation) => (
                            <SelectItem key={designation.id} value={designation.id.toString()}>
                              {designation.name} {designation.targetAmount && `(Target: ${designation.targetAmount.toLocaleString()} RWF)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Status *
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange("status", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
                    </div>
                  </div>
                </div>

                {/* Contributor Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Contributor Information</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contributorName" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contributor Name *
                    </Label>
                    <Input
                      id="contributorName"
                      placeholder="Enter contributor name"
                      className="h-11"
                      value={formData.contributor.name}
                      onChange={(e) => handleInputChange("contributor.name", e.target.value)}
                      required
                    />
                    {errors['contributor.name'] && <p className="text-sm text-red-600">{errors['contributor.name']}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contributorEmail" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="contributorEmail"
                        type="email"
                        placeholder="Enter email address"
                        className="h-11"
                        value={formData.contributor.email}
                        onChange={(e) => handleInputChange("contributor.email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contributorPhone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="contributorPhone"
                        placeholder="Enter phone number"
                        className="h-11"
                        value={formData.contributor.phone}
                        onChange={(e) => handleInputChange("contributor.phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberId" className="text-sm font-medium">
                      Associated Member (Optional)
                    </Label>
                    <Select
                      value={formData.contributor.memberId}
                      onValueChange={(value) => handleInputChange("contributor.memberId", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a member (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.firstname} {member.secondname} {member.email && `(${member.email})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-11" 
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-11" 
                    disabled={isLoading || success}
                  >
                    {isLoading ? (
                      "Updating..."
                    ) : success ? (
                      "✅ Updated Successfully!"
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Update Contribution
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
