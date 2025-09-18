"use client"

import React, { useState, useEffect } from 'react'

export interface UserScope {
  scope: 'superadmin' | 'national' | 'region' | 'university' | 'smallgroup' | 'alumnismallgroup'
  regionId: number | null
  universityId: number | null
  smallGroupId: number | null
  alumniGroupId: number | null
  region: { id: number; name: string } | null
  university: { id: number; name: string } | null
  smallGroup: { id: number; name: string } | null
  alumniGroup: { id: number; name: string } | null
}

export function useUserScope() {
  const [userScope, setUserScope] = useState<UserScope | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserScope = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/members/current-user-scope')
        
        if (!response.ok) {
          throw new Error('Failed to fetch user scope')
        }
        
        const data = await response.json()
        setUserScope(data.scope)
        setError(null)
      } catch (err) {
        console.error('Error fetching user scope:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchUserScope()
  }, [])

  // Helper function to determine which organization fields should be visible
  const getVisibleFields = React.useCallback(() => {
    if (!userScope) return { region: false, university: false, smallGroup: false, alumniGroup: false }
    
    switch (userScope.scope) {
      case 'superadmin':
      case 'national':
        return { region: true, university: true, smallGroup: true, alumniGroup: true }
      
      case 'region':
        return { region: false, university: true, smallGroup: true, alumniGroup: true }
      
      case 'university':
        return { region: false, university: false, smallGroup: true, alumniGroup: false }
      
      case 'smallgroup':
        return { region: false, university: false, smallGroup: false, alumniGroup: false }
      
      case 'alumnismallgroup':
        return { region: false, university: false, smallGroup: false, alumniGroup: false }
      
      default:
        return { region: false, university: false, smallGroup: false, alumniGroup: false }
    }
  }, [userScope])

  // Helper function to get default values based on user scope
  const getDefaultValues = React.useCallback(() => {
    if (!userScope) return {}
    
    const defaults: any = {}
    
    // Set default values based on user scope
    if (userScope.regionId) defaults.regionId = userScope.regionId.toString()
    if (userScope.universityId) defaults.universityId = userScope.universityId.toString()
    if (userScope.smallGroupId) defaults.smallGroupId = userScope.smallGroupId.toString()
    if (userScope.alumniGroupId) defaults.alumniGroupId = userScope.alumniGroupId.toString()
    
    return defaults
  }, [userScope])

  return {
    userScope,
    loading,
    error,
    getVisibleFields,
    getDefaultValues
  }
}