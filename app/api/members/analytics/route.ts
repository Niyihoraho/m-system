import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Get filter parameters
        const regionId = searchParams.get("regionId");
        const universityId = searchParams.get("universityId");
        const smallGroupId = searchParams.get("smallGroupId");
        const alumniGroupId = searchParams.get("alumniGroupId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        
        // Member form field filters
        const memberType = searchParams.get("memberType");
        const memberStatus = searchParams.get("memberStatus");
        const gender = searchParams.get("gender");
        const ageFrom = searchParams.get("ageFrom");
        const ageTo = searchParams.get("ageTo");
        const profession = searchParams.get("profession");
        const faculty = searchParams.get("faculty");
        const placeOfBirthProvince = searchParams.get("placeOfBirthProvince");
        const placeOfBirthDistrict = searchParams.get("placeOfBirthDistrict");
        const graduationYear = searchParams.get("graduationYear");

        // Build the filter object
        const where: Record<string, unknown> = {};

        // Apply organizational filters
        if (regionId && regionId !== 'all') {
            where.regionId = Number(regionId);
        }
        if (universityId && universityId !== 'all') {
            where.universityId = Number(universityId);
        }
        if (smallGroupId && smallGroupId !== 'all') {
            where.smallGroupId = Number(smallGroupId);
        }
        if (alumniGroupId && alumniGroupId !== 'all') {
            where.alumniGroupId = Number(alumniGroupId);
        }

        // Apply date filters
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                where.createdAt.gte = fromDate;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = toDate;
            }
        }

        // Apply member form field filters
        if (memberType && memberType !== 'all') {
            where.type = memberType;
        }
        if (memberStatus && memberStatus !== 'all') {
            where.status = memberStatus;
        }
        if (gender && gender !== 'all') {
            where.gender = gender;
        }
        if (profession && profession !== 'all') {
            where.professionalism = {
                contains: profession,
                mode: 'insensitive'
            };
        }
        if (faculty && faculty !== 'all') {
            where.faculty = {
                contains: faculty,
                mode: 'insensitive'
            };
        }
        if (placeOfBirthProvince && placeOfBirthProvince !== 'all') {
            where.placeOfBirthProvince = {
                contains: placeOfBirthProvince,
                mode: 'insensitive'
            };
        }
        if (placeOfBirthDistrict && placeOfBirthDistrict !== 'all') {
            where.placeOfBirthDistrict = {
                contains: placeOfBirthDistrict,
                mode: 'insensitive'
            };
        }
        if (graduationYear && graduationYear !== 'all') {
            const year = parseInt(graduationYear);
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            where.graduationDate = {
                gte: startDate,
                lte: endDate
            };
        }
        if (ageFrom && ageFrom !== 'all') {
            const minAge = parseInt(ageFrom);
            const maxBirthDate = new Date();
            maxBirthDate.setFullYear(maxBirthDate.getFullYear() - minAge);
            where.birthdate = {
                lte: maxBirthDate
            };
        }
        if (ageTo && ageTo !== 'all') {
            const maxAge = parseInt(ageTo);
            const minBirthDate = new Date();
            minBirthDate.setFullYear(minBirthDate.getFullYear() - maxAge - 1);
            where.birthdate = {
                gte: minBirthDate
            };
        }

        // Get total members count
        const totalMembers = await prisma.member.count({ where });

        // Get members by type
        const membersByType = await prisma.member.groupBy({
            by: ['type'],
            where,
            _count: {
                id: true
            }
        });

        // Get members by gender
        const membersByGender = await prisma.member.groupBy({
            by: ['gender'],
            where: {
                ...where,
                gender: {
                    not: null
                }
            },
            _count: {
                id: true
            }
        });

        // Get members by region
        const membersByRegion = await prisma.member.groupBy({
            by: ['regionId'],
            where: {
                ...where,
                regionId: {
                    not: null
                }
            },
            _count: {
                id: true
            }
        });

        // Get region names for the results
        const regionIds = membersByRegion.map(m => m.regionId).filter(id => id !== null);
        const regions = await prisma.region.findMany({
            where: {
                id: {
                    in: regionIds
                }
            },
            select: {
                id: true,
                name: true
            }
        });

        // Get monthly growth data (last 12 months)
        const monthlyGrowth = [];
        const currentDate = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0, 23, 59, 59, 999);
            
            const monthWhere = {
                ...where,
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd
                }
            };

            const newMembers = await prisma.member.count({ where: monthWhere });
            
            // Get graduated members (status changed to graduate in this month)
            const graduatedMembers = await prisma.member.count({
                where: {
                    ...where,
                    status: 'graduate',
                    updatedAt: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                }
            });

            // Get total members up to this month
            const totalUpToMonth = await prisma.member.count({
                where: {
                    ...where,
                    createdAt: {
                        lte: monthEnd
                    }
                }
            });

            monthlyGrowth.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                newMembers,
                graduatedMembers,
                totalMembers: totalUpToMonth,
                netGrowth: newMembers - graduatedMembers
            });
        }

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = await prisma.member.count({
            where: {
                ...where,
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        // Get member status distribution
        const membersByStatus = await prisma.member.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true
            }
        });

        // Get members by profession
        const membersByProfession = await prisma.member.groupBy({
            by: ['professionalism'],
            where: {
                ...where,
                professionalism: {
                    not: null
                }
            },
            _count: {
                id: true
            }
        });

        // Get members by faculty
        const membersByFaculty = await prisma.member.groupBy({
            by: ['faculty'],
            where: {
                ...where,
                faculty: {
                    not: null
                }
            },
            _count: {
                id: true
            }
        });

        // Get members by place of birth province
        const membersByBirthProvince = await prisma.member.groupBy({
            by: ['placeOfBirthProvince'],
            where: {
                ...where,
                placeOfBirthProvince: {
                    not: null
                }
            },
            _count: {
                id: true
            }
        });

        // Get age distribution
        const ageDistribution = await prisma.member.findMany({
            where: {
                ...where,
                birthdate: {
                    not: null
                }
            },
            select: {
                birthdate: true
            }
        });

        // Calculate age groups
        const ageGroups = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '56+': 0
        };

        ageDistribution.forEach(member => {
            if (member.birthdate) {
                const age = new Date().getFullYear() - new Date(member.birthdate).getFullYear();
                if (age >= 18 && age <= 25) ageGroups['18-25']++;
                else if (age >= 26 && age <= 35) ageGroups['26-35']++;
                else if (age >= 36 && age <= 45) ageGroups['36-45']++;
                else if (age >= 46 && age <= 55) ageGroups['46-55']++;
                else if (age >= 56) ageGroups['56+']++;
            }
        });

        // Calculate retention rate (active members / total members)
        const activeMembers = await prisma.member.count({
            where: {
                ...where,
                status: 'active'
            }
        });

        const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

        // Format the response
        const analytics = {
            keyMetrics: {
                totalMembers,
                newMembersThisMonth: monthlyGrowth[monthlyGrowth.length - 1]?.newMembers || 0,
                graduatedMembersThisMonth: monthlyGrowth[monthlyGrowth.length - 1]?.graduatedMembers || 0,
                netGrowth: monthlyGrowth[monthlyGrowth.length - 1]?.netGrowth || 0,
                retentionRate,
                recentActivity
            },
            memberTypeDistribution: membersByType.map(item => ({
                name: item.type.charAt(0).toUpperCase() + item.type.slice(1) + 's',
                value: Math.round((item._count.id / totalMembers) * 100),
                count: item._count.id,
                color: getTypeColor(item.type)
            })),
            genderDistribution: membersByGender.map(item => ({
                name: item.gender === 'male' ? 'Male' : 'Female',
                value: Math.round((item._count.id / totalMembers) * 100),
                count: item._count.id,
                color: item.gender === 'male' ? '#3B82F6' : '#EC4899'
            })),
            regionalDistribution: membersByRegion.map(item => {
                const region = regions.find(r => r.id === item.regionId);
                return {
                    region: region?.name || 'Unknown',
                    members: item._count.id,
                    growth: Math.floor(Math.random() * 20) + 1, // Mock growth for now
                    universities: Math.floor(Math.random() * 10) + 1 // Mock university count
                };
            }),
            monthlyGrowth,
            memberStatusDistribution: membersByStatus.map(item => ({
                status: item.status,
                count: item._count.id,
                percentage: Math.round((item._count.id / totalMembers) * 100)
            })),
            professionDistribution: membersByProfession.map(item => ({
                profession: item.professionalism || 'Unknown',
                count: item._count.id,
                percentage: Math.round((item._count.id / totalMembers) * 100)
            })),
            facultyDistribution: membersByFaculty.map(item => ({
                faculty: item.faculty || 'Unknown',
                count: item._count.id,
                percentage: Math.round((item._count.id / totalMembers) * 100)
            })),
            birthProvinceDistribution: membersByBirthProvince.map(item => ({
                province: item.placeOfBirthProvince || 'Unknown',
                count: item._count.id,
                percentage: Math.round((item._count.id / totalMembers) * 100)
            })),
            ageDistribution: Object.entries(ageGroups).map(([ageGroup, count]) => ({
                ageGroup,
                count,
                percentage: Math.round((count / totalMembers) * 100)
            }))
        };

        return NextResponse.json(analytics, { status: 200 });

    } catch (error) {
        console.error("Error fetching membership analytics:", error);
        return NextResponse.json({ error: 'Failed to fetch membership analytics' }, { status: 500 });
    }
}

// Helper function to get colors for member types
function getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
        student: '#3B82F6',
        graduate: '#10B981',
        alumni: '#F59E0B',
        staff: '#8B5CF6',
        volunteer: '#EF4444'
    };
    return colors[type] || '#6B7280';
}
