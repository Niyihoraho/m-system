import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contributionSchema } from '@/app/api/validation/contribution';

// GET all contributions
export async function GET() {
  try {
    const contributions = await prisma.contribution.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contributions);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}

// POST create new contribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = contributionSchema.parse(body);
    
    // Create contributor first
    const contributor = await prisma.contributor.create({
      data: {
        name: validatedData.contributor.name,
        email: validatedData.contributor.email,
        phone: validatedData.contributor.phone,
        memberId: validatedData.contributor.memberId || null,
      }
    });

    // Create payment transaction if payment method is provided
    let paymentTransaction = null;
    if (validatedData.paymentMethod && validatedData.paymentProvider) {
      paymentTransaction = await prisma.paymenttransaction.create({
        data: {
          externalId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gatewayId: validatedData.paymentProvider,
          amount: validatedData.amount,
          currency: validatedData.currency || 'RWF',
          phoneNumber: validatedData.contributor.phone,
          email: validatedData.contributor.email,
          payerName: validatedData.contributor.name,
          status: 'initiated',
        }
      });
    }

    // Create contribution
    const contribution = await prisma.contribution.create({
      data: {
        contributorId: contributor.id,
        amount: validatedData.amount,
        method: validatedData.method,
        designationId: validatedData.designationId || null,
        status: validatedData.status || 'pending',
        transactionId: paymentTransaction?.externalId || null,
        paymentTransactionId: paymentTransaction?.id || null,
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

    // Create receipt
    const receipt = await prisma.contributionreceipt.create({
      data: {
        contributionId: contribution.id,
        receiptNumber: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        pdfPath: null, // Will be generated later
        emailSent: false,
        smsSent: false,
      }
    });

    return NextResponse.json({ ...contribution, contributionreceipt: receipt }, { status: 201 });
  } catch (error) {
    console.error('Error creating contribution:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A contribution with this transaction ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contribution' },
      { status: 500 }
    );
  }
}
