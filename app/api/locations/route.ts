import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/locations/provinces
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const parentId = searchParams.get("parentId");

    switch (type) {
      case "provinces":
        const provinces = await prisma.provinces.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        });
        // Convert BigInt IDs to strings for JSON serialization
        const provincesWithStringIds = provinces.map(province => ({
          id: province.id.toString(),
          name: province.name
        }));
        console.log('Provinces from database:', provincesWithStringIds);
        return NextResponse.json(provincesWithStringIds, { status: 200 });

      case "districts":
        if (!parentId) {
          return NextResponse.json(
            { error: "Parent ID (province) is required for districts" },
            { status: 400 }
          );
        }
        const districts = await prisma.districts.findMany({
          where: { province_id: BigInt(parentId) },
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        });
        const districtsWithStringIds = districts.map(district => ({
          id: district.id.toString(),
          name: district.name
        }));
        return NextResponse.json(districtsWithStringIds, { status: 200 });

      case "sectors":
        if (!parentId) {
          return NextResponse.json(
            { error: "Parent ID (district) is required for sectors" },
            { status: 400 }
          );
        }
        const sectors = await prisma.sectors.findMany({
          where: { district_id: BigInt(parentId) },
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        });
        const sectorsWithStringIds = sectors.map(sector => ({
          id: sector.id.toString(),
          name: sector.name
        }));
        return NextResponse.json(sectorsWithStringIds, { status: 200 });

      case "cells":
        if (!parentId) {
          return NextResponse.json(
            { error: "Parent ID (sector) is required for cells" },
            { status: 400 }
          );
        }
        const cells = await prisma.cells.findMany({
          where: { sector_id: BigInt(parentId) },
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        });
        const cellsWithStringIds = cells.map(cell => ({
          id: cell.id.toString(),
          name: cell.name
        }));
        return NextResponse.json(cellsWithStringIds, { status: 200 });

      case "villages":
        if (!parentId) {
          return NextResponse.json(
            { error: "Parent ID (cell) is required for villages" },
            { status: 400 }
          );
        }
        const villages = await prisma.villages.findMany({
          where: { cell_id: BigInt(parentId) },
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        });
        const villagesWithStringIds = villages.map(village => ({
          id: village.id.toString(),
          name: village.name
        }));
        return NextResponse.json(villagesWithStringIds, { status: 200 });

      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: provinces, districts, sectors, cells, or villages" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
