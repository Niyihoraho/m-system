import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all payment providers
export async function GET() {
  try {
    const providers = await prisma.paymentgateway.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching payment providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment providers' },
      { status: 500 }
    );
  }
}

// POST create new payment provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const provider = await prisma.paymentgateway.create({
      data: {
        name: body.name,
        provider: body.provider,
        isActive: body.isActive !== undefined ? body.isActive : true,
        configuration: body.configuration || '{}',
        supportedMethods: body.supportedMethods || '[]',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating payment provider:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A payment provider with this name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment provider' },
      { status: 500 }
    );
  }
}
