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
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserPlus, User, Mail, Phone, MapPin, GraduationCap, Building2, Users, Church, Calendar } from "lucide-react"
import { useUserScope } from "@/hooks/use-user-scope"
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
  
  // Get user scope and visibility rules
  const { userScope, loading: scopeLoading, getVisibleFields, getDefaultValues } = useUserScope()
  const visibleFields = getVisibleFields()
  
  // Memoize default values to prevent infinite re-renders
  const defaultValues = React.useMemo(() => getDefaultValues(), [getDefaultValues])
  
  const [formData, setFormData] = React.useState({
    firstname: "",
    secondname: "",
    gender: "",
    birthdate: "",
    placeOfBirthProvince: "",
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

  // Location data states
  const [provinces, setProvinces] = React.useState<Array<{id: string, name: string}>>([])
  const [districts, setDistricts] = React.useState<Array<{id: string, name: string}>>([])
  const [sectors, setSectors] = React.useState<Array<{id: string, name: string}>>([])
  const [cells, setCells] = React.useState<Array<{id: string, name: string}>>([])
  const [villages, setVillages] = React.useState<Array<{id: string, name: string}>>([])
  const [loadingLocations, setLoadingLocations] = React.useState<{[key: string]: boolean}>({})

  // Small groups state
  const [smallGroups, setSmallGroups] = React.useState<Array<{id: number, name: string}>>([])
  const [loadingSmallGroups, setLoadingSmallGroups] = React.useState(false)

  // Organization data states for superadmin
  const [regions, setRegions] = React.useState<Array<{id: number, name: string}>>([])
  const [universities, setUniversities] = React.useState<Array<{id: number, name: string}>>([])
  const [alumniGroups, setAlumniGroups] = React.useState<Array<{id: number, name: string}>>([])
  const [loadingOrganizations, setLoadingOrganizations] = React.useState<{[key: string]: boolean}>({})

  // Update form data when user scope loads
  React.useEffect(() => {
    if (userScope && !scopeLoading) {
      setFormData(prev => ({
        ...prev,
        regionId: defaultValues.regionId || "",
        universityId: defaultValues.universityId || "",
        smallGroupId: defaultValues.smallGroupId || "",
        alumniGroupId: defaultValues.alumniGroupId || "",
      }))
    }
  }, [userScope, scopeLoading, defaultValues])

  // Fetch small groups when university ID changes
  React.useEffect(() => {
    if (formData.universityId) {
      fetchSmallGroups(formData.universityId)
    } else {
      setSmallGroups([])
    }
  }, [formData.universityId])

  // Fetch regions when superadmin scope loads
  React.useEffect(() => {
    if (userScope?.scope === 'superadmin' && !scopeLoading) {
      fetchRegions()
    }
  }, [userScope?.scope, scopeLoading])

  // Fetch universities when region changes (for superadmin)
  React.useEffect(() => {
    if (userScope?.scope === 'superadmin' && formData.regionId) {
      fetchUniversities(formData.regionId)
    } else {
      setUniversities([])
    }
  }, [formData.regionId, userScope?.scope])

  // Fetch alumni groups when region changes (for superadmin)
  React.useEffect(() => {
    if (userScope?.scope === 'superadmin' && formData.regionId) {
      fetchAlumniGroups(formData.regionId)
    } else {
      setAlumniGroups([])
    }
  }, [formData.regionId, userScope?.scope])

  // Fetch location data
  const fetchLocations = async (type: string, parentId?: string) => {
    console.log(`Fetching ${type}${parentId ? ` for parent ${parentId}` : ''}`)
    setLoadingLocations(prev => ({ ...prev, [type]: true }))
    try {
      const url = parentId 
        ? `/api/locations?type=${type}&parentId=${parentId}`
        : `/api/locations?type=${type}`
      
      console.log(`Fetching from URL: ${url}`)
      const response = await fetch(url)
      const data = await response.json()
      
      console.log(`Response for ${type}:`, { status: response.status, data })
      
      if (response.ok) {
        switch (type) {
          case 'provinces':
            console.log('Setting provinces:', data)
            setProvinces(data)
            break
          case 'districts':
            console.log('Setting districts:', data)
            setDistricts(data)
            break
          case 'sectors':
            console.log('Setting sectors:', data)
            setSectors(data)
            break
          case 'cells':
            console.log('Setting cells:', data)
            setCells(data)
            break
          case 'villages':
            console.log('Setting villages:', data)
            setVillages(data)
            break
        }
      } else {
        console.error(`API Error for ${type}:`, data)
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
    } finally {
      setLoadingLocations(prev => ({ ...prev, [type]: false }))
    }
  }

  // Fetch small groups by university ID
  const fetchSmallGroups = async (universityId: string) => {
    if (!universityId) {
      setSmallGroups([])
      return
    }
    
    setLoadingSmallGroups(true)
    try {
      const response = await fetch(`/api/small-groups?universityId=${universityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch small groups')
      }
      
      const data = await response.json()
      setSmallGroups(data)
    } catch (error) {
      console.error('Error fetching small groups:', error)
      setSmallGroups([])
    } finally {
      setLoadingSmallGroups(false)
    }
  }

  // Fetch regions (for superadmin)
  const fetchRegions = async () => {
    setLoadingOrganizations(prev => ({ ...prev, regions: true }))
    try {
      const response = await fetch('/api/regions')
      if (!response.ok) {
        throw new Error('Failed to fetch regions')
      }
      
      const data = await response.json()
      setRegions(data)
    } catch (error) {
      console.error('Error fetching regions:', error)
      setRegions([])
    } finally {
      setLoadingOrganizations(prev => ({ ...prev, regions: false }))
    }
  }

  // Fetch universities by region ID (for superadmin)
  const fetchUniversities = async (regionId: string) => {
    if (!regionId) {
      setUniversities([])
      return
    }
    
    setLoadingOrganizations(prev => ({ ...prev, universities: true }))
    try {
      const response = await fetch(`/api/universities?regionId=${regionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch universities')
      }
      
      const data = await response.json()
      setUniversities(data)
    } catch (error) {
      console.error('Error fetching universities:', error)
      setUniversities([])
    } finally {
      setLoadingOrganizations(prev => ({ ...prev, universities: false }))
    }
  }

  // Fetch alumni groups by region ID (for superadmin)
  const fetchAlumniGroups = async (regionId: string) => {
    if (!regionId) {
      setAlumniGroups([])
      return
    }
    
    setLoadingOrganizations(prev => ({ ...prev, alumniGroups: true }))
    try {
      const response = await fetch(`/api/alumni-small-groups?regionId=${regionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch alumni groups')
      }
      
      const data = await response.json()
      setAlumniGroups(data)
    } catch (error) {
      console.error('Error fetching alumni groups:', error)
      setAlumniGroups([])
    } finally {
      setLoadingOrganizations(prev => ({ ...prev, alumniGroups: false }))
    }
  }

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

    // Handle location hierarchy
    if (field === 'placeOfBirthProvince') {
      // Clear dependent fields and fetch districts
      setFormData(prev => ({
        ...prev,
        placeOfBirthDistrict: "",
        placeOfBirthSector: "",
        placeOfBirthCell: "",
        placeOfBirthVillage: ""
      }))
      setDistricts([])
      setSectors([])
      setCells([])
      setVillages([])
      if (value) {
        fetchLocations('districts', value)
      }
    } else if (field === 'placeOfBirthDistrict') {
      // Clear dependent fields and fetch sectors
      setFormData(prev => ({
        ...prev,
        placeOfBirthSector: "",
        placeOfBirthCell: "",
        placeOfBirthVillage: ""
      }))
      setSectors([])
      setCells([])
      setVillages([])
      if (value) {
        fetchLocations('sectors', value)
      }
    } else if (field === 'placeOfBirthSector') {
      // Clear dependent fields and fetch cells
      setFormData(prev => ({
        ...prev,
        placeOfBirthCell: "",
        placeOfBirthVillage: ""
      }))
      setCells([])
      setVillages([])
      if (value) {
        fetchLocations('cells', value)
      }
    } else if (field === 'placeOfBirthCell') {
      // Clear dependent fields and fetch villages
      setFormData(prev => ({
        ...prev,
        placeOfBirthVillage: ""
      }))
      setVillages([])
      if (value) {
        fetchLocations('villages', value)
      }
    }
  }

  // Load provinces when modal opens
  React.useEffect(() => {
    console.log('Modal open state changed:', open)
    if (open) {
      console.log('Modal opened, fetching provinces...')
      fetchLocations('provinces')
      
      // Fallback test data if API fails
      setTimeout(() => {
        if (provinces.length === 0) {
          console.log('No provinces loaded, using fallback data')
          setProvinces([
            { id: '1', name: 'Kigali City' },
            { id: '2', name: 'Southern Province' },
            { id: '3', name: 'Western Province' },
            { id: '4', name: 'Northern Province' },
            { id: '5', name: 'Eastern Province' }
          ])
        }
      }, 2000)
    }
  }, [open])

  const validateForm = (): boolean => {
    try {
      createMemberSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: unknown) {
      const newErrors: Record<string, string> = {}
      if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
        error.errors.forEach((err: Record<string, unknown>) => {
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
        placeOfBirthProvince: formData.placeOfBirthProvince || null,
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
          placeOfBirthProvince: "",
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
        
        // Reset location data
        setDistricts([])
        setSectors([])
        setCells([])
        setVillages([])
        
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
          setErrors({ general: Array.isArray(data.details) ? data.details.map((d: Record<string, unknown>) => d.message).join(', ') : data.details })
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
                      <Label htmlFor="placeOfBirthProvince" className="text-sm font-medium">Province</Label>
                      <Select
                        value={formData.placeOfBirthProvince}
                        onValueChange={(value) => handleInputChange("placeOfBirthProvince", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {console.log('Rendering provinces:', provinces)}
                          {provinces.map((province) => (
                            <SelectItem key={province.id} value={province.id}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.placeOfBirthProvince && <p className="text-sm text-red-600">{errors.placeOfBirthProvince}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthDistrict" className="text-sm font-medium">District</Label>
                      <Select
                        value={formData.placeOfBirthDistrict}
                        onValueChange={(value) => handleInputChange("placeOfBirthDistrict", value)}
                        disabled={!formData.placeOfBirthProvince || districts.length === 0}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={
                            loadingLocations.districts 
                              ? "Loading districts..." 
                              : !formData.placeOfBirthProvince 
                                ? "Select province first" 
                                : "Select district"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((district) => (
                            <SelectItem key={district.id} value={district.id}>
                              {district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.placeOfBirthDistrict && <p className="text-sm text-red-600">{errors.placeOfBirthDistrict}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthSector" className="text-sm font-medium">Sector</Label>
                      <Select
                        value={formData.placeOfBirthSector}
                        onValueChange={(value) => handleInputChange("placeOfBirthSector", value)}
                        disabled={!formData.placeOfBirthDistrict || sectors.length === 0}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={
                            loadingLocations.sectors 
                              ? "Loading sectors..." 
                              : !formData.placeOfBirthDistrict 
                                ? "Select district first" 
                                : "Select sector"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.placeOfBirthSector && <p className="text-sm text-red-600">{errors.placeOfBirthSector}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthCell" className="text-sm font-medium">Cell</Label>
                      <Select
                        value={formData.placeOfBirthCell}
                        onValueChange={(value) => handleInputChange("placeOfBirthCell", value)}
                        disabled={!formData.placeOfBirthSector || cells.length === 0}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={
                            loadingLocations.cells 
                              ? "Loading cells..." 
                              : !formData.placeOfBirthSector 
                                ? "Select sector first" 
                                : "Select cell"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {cells.map((cell) => (
                            <SelectItem key={cell.id} value={cell.id}>
                              {cell.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.placeOfBirthCell && <p className="text-sm text-red-600">{errors.placeOfBirthCell}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirthVillage" className="text-sm font-medium">Village</Label>
                      <Select
                        value={formData.placeOfBirthVillage}
                        onValueChange={(value) => handleInputChange("placeOfBirthVillage", value)}
                        disabled={!formData.placeOfBirthCell || villages.length === 0}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={
                            loadingLocations.villages 
                              ? "Loading villages..." 
                              : !formData.placeOfBirthCell 
                                ? "Select cell first" 
                                : "Select village"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {villages.map((village) => (
                            <SelectItem key={village.id} value={village.id}>
                              {village.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  
                  {scopeLoading ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Loading organization scope...</p>
                    </div>
                  ) : (
                    <>
                      {/* Show current scope info */}
                      {userScope && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Current Scope:</strong> {userScope.scope.charAt(0).toUpperCase() + userScope.scope.slice(1)}
                            {userScope.region && ` - ${userScope.region.name}`}
                            {userScope.university && ` - ${userScope.university.name}`}
                            {userScope.smallGroup && ` - ${userScope.smallGroup.name}`}
                            {userScope.alumniGroup && ` - ${userScope.alumniGroup.name}`}
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleFields.region && (
                          <div className="space-y-2">
                            <Label htmlFor="regionId" className="text-sm font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Region
                            </Label>
                            {userScope?.scope === 'superadmin' ? (
                              <Select
                                value={formData.regionId}
                                onValueChange={(value) => handleInputChange("regionId", value)}
                                disabled={loadingOrganizations.regions}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder={
                                    loadingOrganizations.regions 
                                      ? "Loading regions..." 
                                      : "Select region"
                                  } />
                                </SelectTrigger>
                                <SelectContent>
                                  {regions.map((region) => (
                                    <SelectItem key={region.id} value={region.id.toString()}>
                                      {region.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id="regionId"
                                type="number"
                                placeholder="Enter region ID"
                                className="h-11"
                                value={formData.regionId}
                                onChange={(e) => handleInputChange("regionId", e.target.value)}
                              />
                            )}
                            {errors.regionId && <p className="text-sm text-red-600">{errors.regionId}</p>}
                          </div>
                        )}

                        {visibleFields.university && (
                          <div className="space-y-2">
                            <Label htmlFor="universityId" className="text-sm font-medium flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              University
                            </Label>
                            {userScope?.scope === 'superadmin' ? (
                              <Select
                                value={formData.universityId}
                                onValueChange={(value) => handleInputChange("universityId", value)}
                                disabled={!formData.regionId || loadingOrganizations.universities}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder={
                                    loadingOrganizations.universities 
                                      ? "Loading universities..." 
                                      : !formData.regionId 
                                        ? "Select region first" 
                                        : "Select university"
                                  } />
                                </SelectTrigger>
                                <SelectContent>
                                  {universities.map((university) => (
                                    <SelectItem key={university.id} value={university.id.toString()}>
                                      {university.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id="universityId"
                                type="number"
                                placeholder="Enter university ID"
                                className="h-11"
                                value={formData.universityId}
                                onChange={(e) => handleInputChange("universityId", e.target.value)}
                              />
                            )}
                            {errors.universityId && <p className="text-sm text-red-600">{errors.universityId}</p>}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleFields.smallGroup && (
                          <div className="space-y-2">
                            <Label htmlFor="smallGroupId" className="text-sm font-medium flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Small Group
                            </Label>
                            <Select
                              value={formData.smallGroupId}
                              onValueChange={(value) => handleInputChange("smallGroupId", value)}
                              disabled={!formData.universityId || loadingSmallGroups}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder={
                                  loadingSmallGroups 
                                    ? "Loading small groups..." 
                                    : !formData.universityId 
                                      ? "Select university first" 
                                      : "Select small group"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {smallGroups.map((group) => (
                                  <SelectItem key={group.id} value={group.id.toString()}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.smallGroupId && <p className="text-sm text-red-600">{errors.smallGroupId}</p>}
                          </div>
                        )}

                        {visibleFields.alumniGroup && (
                          <div className="space-y-2">
                            <Label htmlFor="alumniGroupId" className="text-sm font-medium flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Alumni Group
                            </Label>
                            {userScope?.scope === 'superadmin' ? (
                              <Select
                                value={formData.alumniGroupId}
                                onValueChange={(value) => handleInputChange("alumniGroupId", value)}
                                disabled={!formData.regionId || loadingOrganizations.alumniGroups}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder={
                                    loadingOrganizations.alumniGroups 
                                      ? "Loading alumni groups..." 
                                      : !formData.regionId 
                                        ? "Select region first" 
                                        : "Select alumni group"
                                  } />
                                </SelectTrigger>
                                <SelectContent>
                                  {alumniGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id.toString()}>
                                      {group.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id="alumniGroupId"
                                type="number"
                                placeholder="Enter alumni group ID"
                                className="h-11"
                                value={formData.alumniGroupId}
                                onChange={(e) => handleInputChange("alumniGroupId", e.target.value)}
                              />
                            )}
                            {errors.alumniGroupId && <p className="text-sm text-red-600">{errors.alumniGroupId}</p>}
                          </div>
                        )}
                      </div>
                      
                      {/* Show message if no fields are visible */}
                      {!visibleFields.region && !visibleFields.university && !visibleFields.smallGroup && !visibleFields.alumniGroup && (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            Organization fields are automatically set based on your current scope.
                          </p>
                        </div>
                      )}
                    </>
                  )}
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
