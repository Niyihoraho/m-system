"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, DollarSign, User, CreditCard, Receipt, ChevronRight, ChevronLeft, Check } from "lucide-react"

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

interface AddContributionModalProps {
  children: React.ReactNode
  onContributionAdded?: () => void
}

export function AddContributionModal({ children, onContributionAdded }: AddContributionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [success, setSuccess] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [members, setMembers] = React.useState<Member[]>([])
  const [designations, setDesignations] = React.useState<Designation[]>([])
  const [paymentProviders, setPaymentProviders] = React.useState<PaymentProvider[]>([])
  const [formData, setFormData] = React.useState({
    // Step 1: User Type
    userType: 'external' as 'internal' | 'external',
    
    // Step 2: Contributor Information
    contributor: {
      name: '',
      email: '',
      phone: '',
      memberId: '',
    },
    
    // Step 3: Contribution Details
    amount: '',
    method: 'mobile_money' as 'mobile_money' | 'bank_transfer' | 'card' | 'worldremit',
    designationId: '',
    
    // Step 4: Payment Provider
    paymentMethod: '',
    paymentProvider: '',
    currency: 'RWF',
  })

  const totalSteps = 4

  // Fetch data on modal open
  React.useEffect(() => {
    if (open) {
      fetchMembers()
      fetchDesignations()
      fetchPaymentProviders()
    }
  }, [open])

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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      // User type validation
      if (!formData.userType) {
        newErrors.userType = "Please select user type"
      }
    } else if (step === 2) {
      // Contributor validation
      if (!formData.contributor.name.trim()) {
        newErrors['contributor.name'] = "Name is required"
      }
      if (formData.userType === 'internal' && !formData.contributor.memberId) {
        newErrors['contributor.memberId'] = "Please select a member for internal user"
      }
      if (formData.userType === 'external' && !formData.contributor.email) {
        newErrors['contributor.email'] = "Email is required for external users"
      }
    } else if (step === 3) {
      // Contribution validation
      if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
        newErrors.amount = "Valid amount is required"
      }
      if (!formData.method) {
        newErrors.method = "Payment method is required"
      }
    } else if (step === 4) {
      // Payment provider validation
      if (!formData.paymentProvider) {
        newErrors.paymentProvider = "Payment provider is required"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) {
      return
    }

    setIsLoading(true)
    
    try {
      console.log('Creating contribution data:', formData)
      
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: formData.userType,
          contributor: {
            name: formData.contributor.name,
            email: formData.contributor.email || null,
            phone: formData.contributor.phone || null,
            memberId: formData.contributor.memberId ? Number(formData.contributor.memberId) : null,
          },
          amount: Number(formData.amount),
          method: formData.method,
          designationId: formData.designationId ? Number(formData.designationId) : null,
          status: 'pending',
          paymentMethod: formData.paymentMethod,
          paymentProvider: formData.paymentProvider ? Number(formData.paymentProvider) : null,
          currency: formData.currency,
        })
      })
      const data = await response.json()
      
      console.log('API response:', { status: response.status, data })
      
      if (response.ok) {
        // Show success message
        setSuccess(true)
        setErrors({})
        
        // Reset form
        setFormData({
          userType: 'external',
          contributor: {
            name: '',
            email: '',
            phone: '',
            memberId: '',
          },
          amount: '',
          method: 'mobile_money',
          designationId: '',
          paymentMethod: '',
          paymentProvider: '',
          currency: 'RWF',
        })
        setCurrentStep(1)
        
        // Call the callback to refresh the contributions list
        if (onContributionAdded) {
          onContributionAdded()
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1500)
      } else {
        // Handle API errors
        console.error('API Error:', data)
        setErrors({ general: data.error || "Failed to create contribution" })
      }
    } catch (error) {
      console.error("Error creating contribution:", error)
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "User Type"
      case 2: return "Contributor Information"
      case 3: return "Contribution Details"
      case 4: return "Payment Provider"
      default: return ""
    }
  }

  const _getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <User className="h-5 w-5" />
      case 2: return <User className="h-5 w-5" />
      case 3: return <DollarSign className="h-5 w-5" />
      case 4: return <CreditCard className="h-5 w-5" />
      default: return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="top" className="h-full w-full max-w-none overflow-y-auto">
        <div className="container mx-auto max-w-4xl py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              Add New Contribution
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Process a new contribution through our multi-step form.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Contribution Process</h3>
                <p className="text-sm text-muted-foreground">Complete all steps to process the contribution</p>
              </div>
              
              {/* Progress Steps */}
              <div className="flex items-center justify-center mt-6">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        step <= currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step < currentStep ? <Check className="h-4 w-4" /> : step}
                      </div>
                      <div className="ml-2 text-sm font-medium">
                        {getStepTitle(step)}
                      </div>
                    </div>
                    {step < totalSteps && (
                      <div className="flex-1 h-px bg-border mx-4 min-w-[50px]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                {/* Step 1: User Type */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Select User Type</h4>
                      <p className="text-sm text-muted-foreground">Choose whether this is an internal or external contributor</p>
                    </div>
                    
                    <RadioGroup
                      value={formData.userType}
                      onValueChange={(value) => handleInputChange("userType", value)}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="internal" id="internal" />
                        <Label htmlFor="internal" className="flex-1 cursor-pointer">
                          <div className="font-medium">Internal User</div>
                          <div className="text-sm text-muted-foreground">Existing member making a contribution</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="external" id="external" />
                        <Label htmlFor="external" className="flex-1 cursor-pointer">
                          <div className="font-medium">External User</div>
                          <div className="text-sm text-muted-foreground">New contributor not in our system</div>
                        </Label>
                      </div>
                    </RadioGroup>
                    {errors.userType && <p className="text-sm text-red-600">{errors.userType}</p>}
                  </div>
                )}

                {/* Step 2: Contributor Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Contributor Information</h4>
                      <p className="text-sm text-muted-foreground">
                        {formData.userType === 'internal' 
                          ? 'Select an existing member' 
                          : 'Enter contributor details'
                        }
                      </p>
                    </div>
                    
                    {formData.userType === 'internal' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="memberId" className="text-sm font-medium">
                            Select Member *
                          </Label>
                          <Select
                            value={formData.contributor.memberId}
                            onValueChange={(value) => handleInputChange("contributor.memberId", value)}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id.toString()}>
                                  {member.firstname} {member.secondname} {member.email && `(${member.email})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors['contributor.memberId'] && <p className="text-sm text-red-600">{errors['contributor.memberId']}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            placeholder="Enter contributor name"
                            className="h-11"
                            value={formData.contributor.name}
                            onChange={(e) => handleInputChange("contributor.name", e.target.value)}
                            required
                          />
                          {errors['contributor.name'] && <p className="text-sm text-red-600">{errors['contributor.name']}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            className="h-11"
                            value={formData.contributor.email}
                            onChange={(e) => handleInputChange("contributor.email", e.target.value)}
                            required
                          />
                          {errors['contributor.email'] && <p className="text-sm text-red-600">{errors['contributor.email']}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            placeholder="Enter phone number"
                            className="h-11"
                            value={formData.contributor.phone}
                            onChange={(e) => handleInputChange("contributor.phone", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Contribution Details */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Contribution Details</h4>
                      <p className="text-sm text-muted-foreground">Enter the contribution amount and designation</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                          Contribution Amount (RWF) *
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
                    </div>
                  </div>
                )}

                {/* Step 4: Payment Provider */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Payment Provider</h4>
                      <p className="text-sm text-muted-foreground">Select the payment provider for processing</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentProvider" className="text-sm font-medium">
                          Payment Provider *
                        </Label>
                        <Select
                          value={formData.paymentProvider}
                          onValueChange={(value) => handleInputChange("paymentProvider", value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select payment provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentProviders.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id.toString()}>
                                {provider.name} ({provider.provider})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.paymentProvider && <p className="text-sm text-red-600">{errors.paymentProvider}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-sm font-medium">
                          Currency
                        </Label>
                        <Input
                          id="currency"
                          value={formData.currency}
                          onChange={(e) => handleInputChange("currency", e.target.value)}
                          className="h-11"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-6 border-t">
                  {currentStep > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-11" 
                      onClick={prevStep}
                      disabled={isLoading}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <Button 
                      type="button" 
                      className="flex-1 h-11" 
                      onClick={nextStep}
                      disabled={isLoading}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="flex-1 h-11" 
                      disabled={isLoading || success}
                    >
                      {isLoading ? (
                        "Processing..."
                      ) : success ? (
                        "✅ Contribution Created!"
                      ) : (
                        <>
                          <Receipt className="mr-2 h-4 w-4" />
                          Create Contribution
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-11" 
                    onClick={() => setOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
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
