import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get filter parameters
    const regionId = searchParams.get("regionId");
    const universityId = searchParams.get("universityId");
    const smallGroupId = searchParams.get("smallGroupId");
    const alumniGroupId = searchParams.get("alumniGroupId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
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

    // Build where clause
    const where: Record<string, unknown> = {};

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Organizational filters
    if (regionId && regionId !== 'all') {
      where.regionId = parseInt(regionId);
    }
    if (universityId && universityId !== 'all') {
      where.universityId = parseInt(universityId);
    }
    if (smallGroupId && smallGroupId !== 'all') {
      where.smallGroupId = parseInt(smallGroupId);
    }
    if (alumniGroupId && alumniGroupId !== 'all') {
      where.alumniGroupId = parseInt(alumniGroupId);
    }

    // Member form field filters
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
        contains: profession
      };
    }
    if (faculty && faculty !== 'all') {
      where.faculty = {
        contains: faculty
      };
    }
    if (placeOfBirthProvince && placeOfBirthProvince !== 'all') {
      where.placeOfBirthProvince = {
        contains: placeOfBirthProvince
      };
    }
    if (placeOfBirthDistrict && placeOfBirthDistrict !== 'all') {
      where.placeOfBirthDistrict = {
        contains: placeOfBirthDistrict
      };
    }
    if (graduationYear && graduationYear !== 'all') {
      where.graduationYear = parseInt(graduationYear);
    }

    // Age range filter
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
      if (where.birthdate) {
        where.birthdate.gte = minBirthDate;
      } else {
        where.birthdate = {
          gte: minBirthDate
        };
      }
    }

    // Fetch members with related data
    const members = await prisma.member.findMany({
      where,
      include: {
        region: {
          select: {
            name: true
          }
        },
        university: {
          select: {
            name: true
          }
        },
        smallgroup: {
          select: {
            name: true
          }
        },
        alumnismallgroup: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedMembers = members.map(member => {
      // Calculate age
      const age = member.birthdate ? 
        new Date().getFullYear() - new Date(member.birthdate).getFullYear() : null;

      return {
        id: member.id,
        firstName: member.firstname || '',
        lastName: member.secondname || '',
        email: member.email,
        phone: member.phone,
        gender: member.gender,
        age: age,
        type: member.type,
        status: member.status,
        profession: member.professionalism,
        faculty: member.faculty,
        placeOfBirthProvince: member.placeOfBirthProvince,
        placeOfBirthDistrict: member.placeOfBirthDistrict,
        graduationYear: member.graduationDate ? new Date(member.graduationDate).getFullYear() : null,
        region: member.region?.name || 'N/A',
        university: member.university?.name || 'N/A',
        smallGroup: member.smallgroup?.name || 'N/A',
        alumniGroup: member.alumnismallgroup?.name || 'N/A',
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      };
    });

    return NextResponse.json({
      members: formattedMembers,
      totalCount: formattedMembers.length,
      appliedFilters: {
        regionId,
        universityId,
        smallGroupId,
        alumniGroupId,
        dateFrom,
        dateTo,
        memberType,
        memberStatus,
        gender,
        ageFrom,
        ageTo,
        profession,
        faculty,
        placeOfBirthProvince,
        placeOfBirthDistrict,
        graduationYear
      }
    });

  } catch (error) {
    console.error('Error fetching member details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member details' },
      { status: 500 }
    );
  }
}
