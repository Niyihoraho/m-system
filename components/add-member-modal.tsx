"use client"

import * as React from "react"
import { Button } from "@/components/ui/ui copy/button"
import { Card, CardContent, CardHeader } from "@/components/ui/ui copy/card"
import { Input } from "@/components/ui/ui copy/input"
import { Label } from "@/components/ui/ui copy/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/ui copy/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/ui copy/sheet"
import { UserPlus, User, Mail, Phone, MapPin, GraduationCap, Building2, Users, Church, Calendar } from "lucide-react"
import { createMemberSchema } from "@/app/api/validation/member"

interface AddMemberModalProps {
  children: React.ReactNode
  onMemberAdded?: () => void
}

export function AddMemberModal({ children, onMemberAdded }: AddMemberModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [success, setSuccess] = React.useState(false)
  const [formData, setFormData] = React.useState({
    firstname: "",
    secondname: "",
    gender: "",
    birthdate: "",
    placeOfBirthDistrict: "",
    placeOfBirthSector: "",
    placeOfBirthCell: "",
    placeOfBirthVillage: "",
    localChurch: "",
    email: "",
    phone: "",
    type: "",
    status: "active",
    regionId: "",
    universityId: "",
    smallGroupId: "",
    alumniGroupId: "",
    graduationDate: "",
    faculty: "",
    professionalism: "",
    maritalStatus: "",
  })

  const handleInputChange = (field: string, value: string) => {
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
    try {
      createMemberSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: Record<string, string> = {}
      if (error.errors) {
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message
        })
      }
      setErrors(newErrors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      // Transform form data to match API expectations
      const apiData = {
        ...formData,
        // Convert empty strings to null for optional fields
        gender: formData.gender || null,
        birthdate: formData.birthdate || null,
        placeOfBirthDistrict: formData.placeOfBirthDistrict || null,
        placeOfBirthSector: formData.placeOfBirthSector || null,
        placeOfBirthCell: formData.placeOfBirthCell || null,
        placeOfBirthVillage: formData.placeOfBirthVillage || null,
        localChurch: formData.localChurch || null,
        email: formData.email || null,
        phone: formData.phone || null,
        regionId: formData.regionId || null,
        universityId: formData.universityId || null,
        smallGroupId: formData.smallGroupId || null,
        alumniGroupId: formData.alumniGroupId || null,
        graduationDate: formData.graduationDate || null,
        faculty: formData.faculty || null,
        professionalism: formData.professionalism || null,
        maritalStatus: formData.maritalStatus || null,
      }

      console.log('Sending member data:', apiData)
      
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })
      const data = await response.json()
      
      console.log('API response:', { status: response.status, data })
      
      if (response.ok) {
        // Show success message
        setSuccess(true)
        setErrors({})
        
        // Reset form
        setFormData({
          firstname: "",
          secondname: "",
          gender: "",
          birthdate: "",
          placeOfBirthDistrict: "",
          placeOfBirthSector: "",
          placeOfBirthCell: "",
          placeOfBirthVillage: "",
          localChurch: "",
          email: "",
          phone: "",
          type: "",
          status: "active",
          regionId: "",
          universityId: "",
          smallGroupId: "",
          alumniGroupId: "",
          graduationDate: "",
          faculty: "",
          professionalism: "",
          maritalStatus: "",
        })
        
        // Call the callback to refresh the members list
        if (onMemberAdded) {
          onMemberAdded()
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1500)
      } else {
        // Handle API errors
        console.error('API Error:', data)
        if (data.details) {
          setErrors({ general: Array.isArray(data.details) ? data.details.map((d: any) => d.message).join(', ') : data.details })
        } else {
          setErrors({ general: data.error || "Failed to create member" })
        }
      }
    } catch (error) {
      console.error("Error creating member:", error)
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
        <div className="container mx-auto max-w-4xl py-8">
          <SheetHeader className="pb-8 text-center">
            <SheetTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              Add New Member
            </SheetTitle>
            <SheetDescription className="text-lg text-muted-foreground">
              Add a new member with personal, contact, and organizational information.
            </SheetDescription>
          </SheetHeader>
          
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Member Information</h3>
                <p className="text-sm text-muted-foreground">Fill in the details below to add a new member</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {errors.general}
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Personal Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname" className="text-sm font-medium">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstname"
                          placeholder="Enter first name"
                          className="pl-10 h-11"
                          value={formData.firstname}
                          onChange={(e) => handleInputChange("firstname", e.target.value)}
                          required
                        />
                      </div>
                      {errors.firstname && <p className="text-sm text-red-600">{errors.firstname}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondname" className="text-sm font-medium">Second Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="secondname"
                          placeholder="Enter second name"
                          className="pl-10 h-11"
                          value={formData.secondname}
                          onChange={(e) => handleInputChange("secondname", e.target.value)}
                          required
                        />
                      </div>
                      {errors.secondname && <p className="text-sm text-red-600">{errors.secondname}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange("gender", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthdate" className="text-sm font-medium">Birth Date</Label>
                      <Input
                        id="birthdate"
                        type="date"
                        className="h-11"
                        value={formData.birthdate}
                        onChange={(e) => handleInputChange("birthdate", e.target.value)}
                      />
                      {errors.birthdate && <p className="text-sm text-red-600">{errors.birthdate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus" className="text-sm font-medium">Marital Status</Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) => handleInputChange("maritalStatus", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.maritalStatus && <p className="text-sm text-red-600">{errors.maritalStatus}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Contact Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        className="h-11"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                      {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+250 788 123 456"
                        className="h-11"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                      {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localChurch" className="text-sm font-medium flex items-center gap-2">
                      <Church className="h-4 w-4" />
                      Local Church
                    </Label>
                    <Input
                      id="localChurch"
                      placeholder="Enter local church name"
                      className="h-11"
                      value={formData.localChurch}
                      onChange={(e) => handleInputChange("localChurch", e.target.value)}
                    />
                    {errors.localChurch && <p className="text-sm text-red-600">{errors.localChurch}</p>}
                  </div>
                </div>

                {/* Place of Birth */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Place of Birth</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthDistrict" className="text-sm font-medium">District</Label>
                      <Input
                        id="placeOfBirthDistrict"
                        placeholder="Enter district"
                        className="h-11"
                        value={formData.placeOfBirthDistrict}
                        onChange={(e) => handleInputChange("placeOfBirthDistrict", e.target.value)}
                      />
                      {errors.placeOfBirthDistrict && <p className="text-sm text-red-600">{errors.placeOfBirthDistrict}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthSector" className="text-sm font-medium">Sector</Label>
                      <Input
                        id="placeOfBirthSector"
                        placeholder="Enter sector"
                        className="h-11"
                        value={formData.placeOfBirthSector}
                        onChange={(e) => handleInputChange("placeOfBirthSector", e.target.value)}
                      />
                      {errors.placeOfBirthSector && <p className="text-sm text-red-600">{errors.placeOfBirthSector}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthCell" className="text-sm font-medium">Cell</Label>
                      <Input
                        id="placeOfBirthCell"
                        placeholder="Enter cell"
                        className="h-11"
                        value={formData.placeOfBirthCell}
                        onChange={(e) => handleInputChange("placeOfBirthCell", e.target.value)}
                      />
                      {errors.placeOfBirthCell && <p className="text-sm text-red-600">{errors.placeOfBirthCell}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthVillage" className="text-sm font-medium">Village</Label>
                      <Input
                        id="placeOfBirthVillage"
                        placeholder="Enter village"
                        className="h-11"
                        value={formData.placeOfBirthVillage}
                        onChange={(e) => handleInputChange("placeOfBirthVillage", e.target.value)}
                      />
                      {errors.placeOfBirthVillage && <p className="text-sm text-red-600">{errors.placeOfBirthVillage}</p>}
                    </div>
                  </div>
                </div>

                {/* Education & Professional Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Education & Professional Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faculty" className="text-sm font-medium">Faculty</Label>
                      <Input
                        id="faculty"
                        placeholder="Enter faculty"
                        className="h-11"
                        value={formData.faculty}
                        onChange={(e) => handleInputChange("faculty", e.target.value)}
                      />
                      {errors.faculty && <p className="text-sm text-red-600">{errors.faculty}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="professionalism" className="text-sm font-medium">Professionalism</Label>
                      <Input
                        id="professionalism"
                        placeholder="Enter profession"
                        className="h-11"
                        value={formData.professionalism}
                        onChange={(e) => handleInputChange("professionalism", e.target.value)}
                      />
                      {errors.professionalism && <p className="text-sm text-red-600">{errors.professionalism}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduationDate" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Graduation Date
                    </Label>
                    <Input
                      id="graduationDate"
                      type="date"
                      className="h-11"
                      value={formData.graduationDate}
                      onChange={(e) => handleInputChange("graduationDate", e.target.value)}
                    />
                    {errors.graduationDate && <p className="text-sm text-red-600">{errors.graduationDate}</p>}
                  </div>
                </div>

                {/* Member Type & Status */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Member Type & Status</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium">Member Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleInputChange("type", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select member type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange("status", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pre_graduate">Pre-Graduate</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
                    </div>
                  </div>
                </div>

                {/* Organization Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground border-b pb-2">Organization Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regionId" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Region ID
                      </Label>
                      <Input
                        id="regionId"
                        type="number"
                        placeholder="Enter region ID"
                        className="h-11"
                        value={formData.regionId}
                        onChange={(e) => handleInputChange("regionId", e.target.value)}
                      />
                      {errors.regionId && <p className="text-sm text-red-600">{errors.regionId}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="universityId" className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        University ID
                      </Label>
                      <Input
                        id="universityId"
                        type="number"
                        placeholder="Enter university ID"
                        className="h-11"
                        value={formData.universityId}
                        onChange={(e) => handleInputChange("universityId", e.target.value)}
                      />
                      {errors.universityId && <p className="text-sm text-red-600">{errors.universityId}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smallGroupId" className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Small Group ID
                      </Label>
                      <Input
                        id="smallGroupId"
                        type="number"
                        placeholder="Enter small group ID"
                        className="h-11"
                        value={formData.smallGroupId}
                        onChange={(e) => handleInputChange("smallGroupId", e.target.value)}
                      />
                      {errors.smallGroupId && <p className="text-sm text-red-600">{errors.smallGroupId}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alumniGroupId" className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Alumni Group ID
                      </Label>
                      <Input
                        id="alumniGroupId"
                        type="number"
                        placeholder="Enter alumni group ID"
                        className="h-11"
                        value={formData.alumniGroupId}
                        onChange={(e) => handleInputChange("alumniGroupId", e.target.value)}
                      />
                      {errors.alumniGroupId && <p className="text-sm text-red-600">{errors.alumniGroupId}</p>}
                    </div>
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
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
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
