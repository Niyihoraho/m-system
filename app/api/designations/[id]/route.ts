import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { designationSchema } from '@/app/api/validation/designation';

// GET single designation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid designation ID' },
        { status: 400 }
      );
    }

    const designation = await prisma.contributiondesignation.findUnique({
      where: { id },
      include: {
        region: true,
        university: true,
        smallgroup: true,
      },
    });

    if (!designation) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(designation);
  } catch (error) {
    console.error('Error fetching designation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designation' },
      { status: 500 }
    );
  }
}

// PUT update designation by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid designation ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = designationSchema.parse(body);
    
    const designation = await prisma.contributiondesignation.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount,
        currentAmount: validatedData.currentAmount,
        isActive: validatedData.isActive,
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

    return NextResponse.json(designation);
  } catch (error) {
    console.error('Error updating designation:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A designation with this name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update designation' },
      { status: 500 }
    );
  }
}

// DELETE designation by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid designation ID' },
        { status: 400 }
      );
    }

    // Check if designation has any contributions
    const contributions = await prisma.contribution.count({
      where: { designationId: id },
    });

    if (contributions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete designation with existing contributions' },
        { status: 400 }
      );
    }

    await prisma.contributiondesignation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete designation' },
      { status: 500 }
    );
  }
}
