import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { designationSchema } from '@/app/api/validation/designation';

// GET all designations
export async function GET() {
  try {
    const designations = await prisma.contributiondesignation.findMany({
      include: {
        region: true,
        university: true,
        smallgroup: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(designations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designations' },
      { status: 500 }
    );
  }
}

// POST create new designation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = designationSchema.parse(body);
    
    const designation = await prisma.contributiondesignation.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount,
        currentAmount: validatedData.currentAmount || 0,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
        regionId: validatedData.regionId || null,
        universityId: validatedData.universityId || null,
        smallGroupId: validatedData.smallGroupId || null,
        updatedAt: new Date(),
      },
      include: {
        region: true,
        university: true,
        smallgroup: true,
      },
    });

    return NextResponse.json(designation, { status: 201 });
  } catch (error) {
    console.error('Error creating designation:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A designation with this name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create designation' },
      { status: 500 }
    );
  }
}
