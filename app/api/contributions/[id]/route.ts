import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contributionSchema } from '@/app/api/validation/contribution';

// GET single contribution by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid contribution ID' },
        { status: 400 }
      );
    }

    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: {
        contributor: true,
        contributiondesignation: {
          include: {
            region: true,
            university: true,
            smallgroup: true,
          }
        },
        member: {
          include: {
            region: true,
            university: true,
            smallgroup: true,
            alumnismallgroup: true,
          }
        },
        paymenttransaction: {
          include: {
            paymentgateway: true,
          }
        },
        contributionreceipt: true,
      },
    });

    if (!contribution) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contribution);
  } catch (error) {
    console.error('Error fetching contribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contribution' },
      { status: 500 }
    );
  }
}

// PUT update contribution by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid contribution ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = contributionSchema.parse(body);
    
    // Update contributor
    const contributor = await prisma.contributor.update({
      where: { id: validatedData.contributor.id },
      data: {
        name: validatedData.contributor.name,
        email: validatedData.contributor.email,
        phone: validatedData.contributor.phone,
        memberId: validatedData.contributor.memberId || null,
      }
    });

    // Update contribution
    const contribution = await prisma.contribution.update({
      where: { id },
      data: {
        amount: validatedData.amount,
        method: validatedData.method,
        designationId: validatedData.designationId || null,
        status: validatedData.status,
        memberId: validatedData.contributor.memberId || null,
      },
      include: {
        contributor: true,
        contributiondesignation: {
          include: {
            region: true,
            university: true,
            smallgroup: true,
          }
        },
        member: {
          include: {
            region: true,
            university: true,
            smallgroup: true,
            alumnismallgroup: true,
          }
        },
        paymenttransaction: {
          include: {
            paymentgateway: true,
          }
        },
        contributionreceipt: true,
      },
    });

    return NextResponse.json(contribution);
  } catch (error) {
    console.error('Error updating contribution:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update contribution' },
      { status: 500 }
    );
  }
}

// DELETE contribution by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid contribution ID' },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.contributionreceipt.deleteMany({
      where: { contributionId: id }
    });

    await prisma.contribution.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Contribution deleted successfully' });
  } catch (error) {
    console.error('Error deleting contribution:', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete contribution' },
      { status: 500 }
    );
  }
}
