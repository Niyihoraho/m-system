"use client"

import * as React from "react"
import { Button } from "@/components/ui/ui copy/button"
import { Card, CardContent, CardHeader } from "@/components/ui/ui copy/card"
import { Input } from "@/components/ui/ui copy/input"
import { Label } from "@/components/ui/ui copy/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/ui copy/select"
import { Checkbox } from "@/components/ui/ui copy/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/ui copy/sheet"
import { Edit, Target, MapPin, Building2, Users, DollarSign, FileText } from "lucide-react"

interface Region {
  id: number;
  name: string;
}

interface University {
  id: number;
  name: string;
  regionId: number;
}

interface SmallGroup {
  id: number;
  name: string;
  universityId: number;
  regionId: number;
}

interface Designation {
  id: number;
  name: string;
  description: string | null;
  targetAmount: number | null;
  currentAmount: number;
  isActive: boolean;
  regionId: number | null;
  universityId: number | null;
  smallGroupId: number | null;
  region: { name: string } | null;
  university: { name: string } | null;
  smallgroup: { name: string } | null;
}

interface EditDesignationModalProps {
  designation: Designation | null
  isOpen: boolean
  onClose: () => void
  onDesignationUpdated?: () => void
}

export function EditDesignationModal({ designation, isOpen, onClose, onDesignationUpdated }: EditDesignationModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [success, setSuccess] = React.useState(false)
  const [regions, setRegions] = React.useState<Region[]>([])
  const [universities, setUniversities] = React.useState<University[]>([])
  const [smallGroups, setSmallGroups] = React.useState<SmallGroup[]>([])
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    targetAmount: "",
    currentAmount: "",
    regionId: "",
    universityId: "",
    smallGroupId: "",
    isActive: true,
  })

  // Update form data when designation changes
  React.useEffect(() => {
    if (designation) {
      setFormData({
        name: designation.name || "",
        description: designation.description || "",
        targetAmount: designation.targetAmount?.toString() || "",
        currentAmount: designation.currentAmount?.toString() || "",
        regionId: designation.regionId?.toString() || "",
        universityId: designation.universityId?.toString() || "",
        smallGroupId: designation.smallGroupId?.toString() || "",
        isActive: designation.isActive,
      })
    }
  }, [designation])

  // Fetch regions when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchRegions()
    }
  }, [isOpen])

  // Fetch universities when region changes
  React.useEffect(() => {
    if (formData.regionId) {
      fetchUniversities(Number(formData.regionId))
    } else {
      setUniversities([])
      setFormData(prev => ({ ...prev, universityId: "", smallGroupId: "" }))
    }
  }, [formData.regionId])

  // Fetch small groups when university changes
  React.useEffect(() => {
    if (formData.universityId) {
      fetchSmallGroups(Number(formData.universityId))
    } else {
      setSmallGroups([])
      setFormData(prev => ({ ...prev, smallGroupId: "" }))
    }
  }, [formData.universityId])

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions')
      const data = await response.json()
      setRegions(data)
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  const fetchUniversities = async (regionId: number) => {
    try {
      const response = await fetch(`/api/universities?regionId=${regionId}`)
      const data = await response.json()
      setUniversities(data)
    } catch (error) {
      console.error('Error fetching universities:', error)
    }
  }

  const fetchSmallGroups = async (universityId: number) => {
    try {
      const response = await fetch(`/api/small-groups?universityId=${universityId}`)
      const data = await response.json()
      setSmallGroups(data)
    } catch (error) {
      console.error('Error fetching small groups:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
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
    
    if (!formData.name.trim()) {
      newErrors.name = "Designation name is required"
    }
    
    if (formData.targetAmount && isNaN(Number(formData.targetAmount))) {
      newErrors.targetAmount = "Target amount must be a valid number"
    }
    
    if (formData.currentAmount && isNaN(Number(formData.currentAmount))) {
      newErrors.currentAmount = "Current amount must be a valid number"
    }
    
    if (Number(formData.targetAmount) < 0) {
      newErrors.targetAmount = "Target amount must be non-negative"
    }
    
    if (Number(formData.currentAmount) < 0) {
      newErrors.currentAmount = "Current amount must be non-negative"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!designation) return
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      console.log('Updating designation data:', formData)
      
      const response = await fetch(`/api/designations/${designation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          targetAmount: formData.targetAmount ? Number(formData.targetAmount) : null,
          currentAmount: formData.currentAmount ? Number(formData.currentAmount) : 0,
          regionId: formData.regionId ? Number(formData.regionId) : null,
          universityId: formData.universityId ? Number(formData.universityId) : null,
          smallGroupId: formData.smallGroupId ? Number(formData.smallGroupId) : null,
          isActive: formData.isActive
        })
      })
      const data = await response.json()
      
      console.log('API response:', { status: response.status, data })
      
      if (response.ok) {
        // Show success message
        setSuccess(true)
        setErrors({})
        
        // Call the callback to refresh the designations list
        if (onDesignationUpdated) {
          onDesignationUpdated()
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 1500)
      } else {
        // Handle API errors
        console.error('API Error:', data)
        setErrors({ general: data.error || "Failed to update designation" })
      }
    } catch (error) {
      console.error("Error updating designation:", error)
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  if (!designation) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="top" className="h-full w-full max-w-none overflow-y-auto">
        <div className="container mx-auto max-w-2xl py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Edit className="h-6 w-6 text-primary" />
              </div>
              Edit Designation
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Update the designation information below.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Designation Information</h3>
                <p className="text-sm text-muted-foreground">Update the details below to modify this designation</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                {/* Designation Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Designation Details</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Designation Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter designation name"
                      className="h-11"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description (Optional)
                    </Label>
                    <Input
                      id="description"
                      placeholder="Enter designation description"
                      className="h-11"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetAmount" className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Target Amount (Optional)
                      </Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-11"
                        value={formData.targetAmount}
                        onChange={(e) => handleInputChange("targetAmount", e.target.value)}
                      />
                      {errors.targetAmount && <p className="text-sm text-red-600">{errors.targetAmount}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentAmount" className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Current Amount (Optional)
                      </Label>
                      <Input
                        id="currentAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-11"
                        value={formData.currentAmount}
                        onChange={(e) => handleInputChange("currentAmount", e.target.value)}
                      />
                      {errors.currentAmount && <p className="text-sm text-red-600">{errors.currentAmount}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regionId" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Region (Optional)
                    </Label>
                    <Select
                      value={formData.regionId}
                      onValueChange={(value) => handleInputChange("regionId", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a region (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id.toString()}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="universityId" className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      University (Optional)
                    </Label>
                    <Select
                      value={formData.universityId}
                      onValueChange={(value) => handleInputChange("universityId", value)}
                      disabled={!formData.regionId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={formData.regionId ? "Select a university (optional)" : "Select a region first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.id} value={university.id.toString()}>
                            {university.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smallGroupId" className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Small Group (Optional)
                    </Label>
                    <Select
                      value={formData.smallGroupId}
                      onValueChange={(value) => handleInputChange("smallGroupId", value)}
                      disabled={!formData.universityId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={formData.universityId ? "Select a small group (optional)" : "Select a university first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {smallGroups.map((smallGroup) => (
                          <SelectItem key={smallGroup.id} value={smallGroup.id.toString()}>
                            {smallGroup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange("isActive", checked as boolean)}
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      Designation is active
                    </Label>
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
                        Update Designation
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
