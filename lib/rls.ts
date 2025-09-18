import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// User scope interface
export interface UserScope {
  scope: 'superadmin' | 'national' | 'region' | 'university' | 'smallgroup' | 'alumnismallgroup';
  regionId?: number | null;
  universityId?: number | null;
  smallGroupId?: number | null;
  alumniGroupId?: number | null;
}

// RLS conditions interface
export interface RLSConditions {
  regionId?: number;
  universityId?: number;
  smallGroupId?: number;
  alumniGroupId?: number;
}

/**
 * Get the current user's scope from the session
 * Returns the most restrictive scope if user has multiple roles
 */
export async function getUserScope(): Promise<UserScope | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.roles || session.user.roles.length === 0) {
      return null;
    }

    // Get the most restrictive scope (highest priority)
    const roles = session.user.roles;
    
    // Priority order: superadmin > national > region > university > smallgroup > alumnismallgroup
    const scopePriority = {
      'superadmin': 1,
      'national': 2,
      'region': 3,
      'university': 4,
      'smallgroup': 5,
      'alumnismallgroup': 6
    };

    // Find the role with the highest priority (most restrictive)
    const primaryRole = roles.reduce((prev, current) => {
      const prevPriority = scopePriority[prev.scope as keyof typeof scopePriority] || 999;
      const currentPriority = scopePriority[current.scope as keyof typeof scopePriority] || 999;
      return currentPriority < prevPriority ? current : prev;
    });

    return {
      scope: primaryRole.scope as UserScope['scope'],
      regionId: primaryRole.regionId,
      universityId: primaryRole.universityId,
      smallGroupId: primaryRole.smallGroupId,
      alumniGroupId: primaryRole.alumniGroupId
    };
  } catch (error) {
    console.error('Error getting user scope:', error);
    return null;
  }
}

/**
 * Generate RLS conditions based on user scope
 * Returns an object with the appropriate WHERE conditions for database queries
 */
export function generateRLSConditions(userScope: UserScope): RLSConditions {
  const conditions: RLSConditions = {};

  // Superadmin has access to everything - no conditions needed
  if (userScope.scope === 'superadmin') {
    return conditions;
  }

  // National scope - access to all regions (no filtering needed for now)
  if (userScope.scope === 'national') {
    return conditions;
  }

  // Region scope - access to specific region and all its children
  if (userScope.scope === 'region' && userScope.regionId) {
    conditions.regionId = userScope.regionId;
    return conditions;
  }

  // University scope - access to specific university and its small groups
  if (userScope.scope === 'university' && userScope.universityId) {
    conditions.universityId = userScope.universityId;
    // Also include regionId for consistency
    if (userScope.regionId) {
      conditions.regionId = userScope.regionId;
    }
    return conditions;
  }

  // Small group scope - access to specific small group only
  if (userScope.scope === 'smallgroup' && userScope.smallGroupId) {
    conditions.smallGroupId = userScope.smallGroupId;
    // Include parent IDs for consistency
    if (userScope.universityId) {
      conditions.universityId = userScope.universityId;
    }
    if (userScope.regionId) {
      conditions.regionId = userScope.regionId;
    }
    return conditions;
  }

  // Alumni small group scope - access to specific alumni group only
  if (userScope.scope === 'alumnismallgroup' && userScope.alumniGroupId) {
    conditions.alumniGroupId = userScope.alumniGroupId;
    // Include regionId for consistency
    if (userScope.regionId) {
      conditions.regionId = userScope.regionId;
    }
    return conditions;
  }

  // If no valid scope found, return empty conditions (no access)
  return conditions;
}

/**
 * Check if user has permission to access a specific resource
 */
export function hasPermission(
  userScope: UserScope,
  resourceType: 'region' | 'university' | 'smallgroup' | 'alumnismallgroup',
  resourceId: number
): boolean {
  // Superadmin has access to everything
  if (userScope.scope === 'superadmin') {
    return true;
  }

  // National scope has access to everything
  if (userScope.scope === 'national') {
    return true;
  }

  switch (resourceType) {
    case 'region':
      return userScope.scope === 'region' && userScope.regionId === resourceId;
    
    case 'university':
      return (userScope.scope === 'university' && userScope.universityId === resourceId) ||
             (userScope.scope === 'region' && userScope.regionId !== null);
    
    case 'smallgroup':
      return (userScope.scope === 'smallgroup' && userScope.smallGroupId === resourceId) ||
             (userScope.scope === 'university' && userScope.universityId !== null) ||
             (userScope.scope === 'region' && userScope.regionId !== null);
    
    case 'alumnismallgroup':
      return (userScope.scope === 'alumnismallgroup' && userScope.alumniGroupId === resourceId) ||
             (userScope.scope === 'region' && userScope.regionId !== null);
    
    default:
      return false;
  }
}

/**
 * Get RLS conditions for specific tables
 * Some tables don't have all the foreign key columns, so we need to map appropriately
 */
export function getTableRLSConditions(userScope: UserScope, tableName: string): any {
  const rlsConditions = generateRLSConditions(userScope);
  
  switch (tableName) {
    case 'member':
    case 'trainings':
    case 'permanentministryevent':
    case 'budget':
    case 'document':
    case 'contributiondesignation':
      // These tables have regionId, universityId, smallGroupId, alumniGroupId
      return rlsConditions;
    
    case 'university':
      // Universities only have regionId
      return rlsConditions.regionId ? { regionId: rlsConditions.regionId } : {};
    
    case 'smallgroup':
      // Small groups have regionId and universityId
      return {
        ...(rlsConditions.regionId && { regionId: rlsConditions.regionId }),
        ...(rlsConditions.universityId && { universityId: rlsConditions.universityId })
      };
    
    case 'alumnismallgroup':
      // Alumni groups have regionId
      return rlsConditions.regionId ? { regionId: rlsConditions.regionId } : {};
    
    case 'region':
      // Regions don't have foreign keys, so we need to check if user has access to specific regions
      if (userScope.scope === 'region' && userScope.regionId) {
        return { id: userScope.regionId };
      }
      return {};
    
    default:
      return rlsConditions;
  }
}
