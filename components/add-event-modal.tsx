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
  SheetTrigger,
} from "@/components/ui/ui copy/sheet"
import { Plus, Calendar, MapPin, Building2, Users, GraduationCap, Activity } from "lucide-react"

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

interface AlumniGroup {
  id: number;
  name: string;
  regionId: number;
}

interface AddEventModalProps {
  children: React.ReactNode
  onEventAdded?: () => void
}

export function AddEventModal({ children, onEventAdded }: AddEventModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [success, setSuccess] = React.useState(false)
  const [regions, setRegions] = React.useState<Region[]>([])
  const [universities, setUniversities] = React.useState<University[]>([])
  const [smallGroups, setSmallGroups] = React.useState<SmallGroup[]>([])
  const [alumniGroups, setAlumniGroups] = React.useState<AlumniGroup[]>([])
  const [formData, setFormData] = React.useState({
    name: "",
    type: "",
    regionId: "",
    universityId: "",
    smallGroupId: "",
    alumniGroupId: "",
    isActive: true,
  })

  // Fetch regions on modal open
  React.useEffect(() => {
    if (open) {
      fetchRegions()
    }
  }, [open])

  // Fetch universities when region changes
  React.useEffect(() => {
    if (formData.regionId) {
      fetchUniversities(Number(formData.regionId))
      fetchAlumniGroups(Number(formData.regionId))
    } else {
      setUniversities([])
      setAlumniGroups([])
      setFormData(prev => ({ ...prev, universityId: "", alumniGroupId: "" }))
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

  const fetchAlumniGroups = async (regionId: number) => {
    try {
      const response = await fetch(`/api/alumni-small-groups?regionId=${regionId}`)
      const data = await response.json()
      setAlumniGroups(data)
    } catch (error) {
      console.error('Error fetching alumni groups:', error)
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
      newErrors.name = "Event name is required"
    }
    
    if (!formData.type.trim()) {
      newErrors.type = "Event type is required"
    }
    
    if (!formData.regionId) {
      newErrors.regionId = "Region is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      console.log('Creating event data:', formData)
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          regionId: Number(formData.regionId),
          universityId: formData.universityId ? Number(formData.universityId) : null,
          smallGroupId: formData.smallGroupId ? Number(formData.smallGroupId) : null,
          alumniGroupId: formData.alumniGroupId ? Number(formData.alumniGroupId) : null,
          isActive: formData.isActive
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
          name: "",
          type: "",
          regionId: "",
          universityId: "",
          smallGroupId: "",
          alumniGroupId: "",
          isActive: true,
        })
        
        // Call the callback to refresh the events list
        if (onEventAdded) {
          onEventAdded()
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1500)
      } else {
        // Handle API errors
        console.error('API Error:', data)
        setErrors({ general: data.error || "Failed to create event" })
      }
    } catch (error) {
      console.error("Error creating event:", error)
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="top" className="h-full w-full max-w-none overflow-y-auto">
        <div className="container mx-auto max-w-2xl py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              Add New Event
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Add a new event to your organization.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Event Information</h3>
                <p className="text-sm text-muted-foreground">Fill in the details below to add a new event</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                {/* Event Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Event Details</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Event Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter event name"
                      className="h-11"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Event Type *
                    </Label>
                    <Input
                      id="type"
                      placeholder="Enter event type (e.g., Conference, Workshop, Meeting)"
                      className="h-11"
                      value={formData.type}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      required
                    />
                    {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regionId" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Region *
                    </Label>
                    <Select
                      value={formData.regionId}
                      onValueChange={(value) => handleInputChange("regionId", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id.toString()}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.regionId && <p className="text-sm text-red-600">{errors.regionId}</p>}
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

                  <div className="space-y-2">
                    <Label htmlFor="alumniGroupId" className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Alumni Group (Optional)
                    </Label>
                    <Select
                      value={formData.alumniGroupId}
                      onValueChange={(value) => handleInputChange("alumniGroupId", value)}
                      disabled={!formData.regionId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={formData.regionId ? "Select an alumni group (optional)" : "Select a region first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {alumniGroups.map((alumniGroup) => (
                          <SelectItem key={alumniGroup.id} value={alumniGroup.id.toString()}>
                            {alumniGroup.name}
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
                      Event is active
                    </Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-11" 
                    onClick={() => setOpen(false)}
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
                      "Creating..."
                    ) : success ? (
                      "✅ Created Successfully!"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
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
