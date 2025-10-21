import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserScope, getTableRLSConditions } from "@/lib/rls";

export async function GET(request: NextRequest) {
    try {
        // Get user scope for RLS
        const userScope = await getUserScope();
        if (!userScope) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const includeStats = searchParams.get("includeStats") === "true";
        
        // Apply RLS conditions to members (since attendance is linked through members)
        const memberRLSConditions = getTableRLSConditions(userScope, 'member');
        
        // Get distinct dates from attendance table through member relationship
        const attendanceDates = await prisma.attendance.findMany({
            where: {
                member: memberRLSConditions
            },
            select: {
                recordedAt: true
            },
            distinct: ['recordedAt'],
            orderBy: {
                recordedAt: 'desc'
            }
        });
        
        // Extract dates and format them (convert to date only, no time)
        const dates = attendanceDates.map(record => {
            const date = new Date(record.recordedAt);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        });
        
        // Remove duplicates and sort
        const uniqueDates = [...new Set(dates.map(d => d.getTime()))]
            .map(time => new Date(time))
            .sort((a, b) => b.getTime() - a.getTime());
        
        // Get the latest date (first in the ordered list)
        const latestDate = uniqueDates.length > 0 ? uniqueDates[0] : null;
        
        // Calculate date statistics if requested
        let dateStats = null;
        if (includeStats && uniqueDates.length > 0) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            const last3Months = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
            
            dateStats = {
                totalDates: uniqueDates.length,
                hasToday: uniqueDates.some(d => d.getTime() === today.getTime()),
                hasYesterday: uniqueDates.some(d => d.getTime() === yesterday.getTime()),
                datesLastWeek: uniqueDates.filter(d => d.getTime() >= lastWeek.getTime()).length,
                datesLastMonth: uniqueDates.filter(d => d.getTime() >= lastMonth.getTime()).length,
                datesLast3Months: uniqueDates.filter(d => d.getTime() >= last3Months.getTime()).length,
                oldestDate: uniqueDates[uniqueDates.length - 1],
                newestDate: uniqueDates[0]
            };
        }
        
        // Generate predefined date ranges
        const predefinedRanges = generatePredefinedRanges(uniqueDates);
        
        return NextResponse.json({
            dates: uniqueDates,
            latestDate: latestDate,
            count: uniqueDates.length,
            predefinedRanges,
            stats: dateStats
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error fetching attendance dates:", error);
        return NextResponse.json({ error: 'Failed to fetch attendance dates' }, { status: 500 });
    }
}

/**
 * Generate predefined date ranges for professional attendance filtering
 */
function generatePredefinedRanges(availableDates: Date[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const ranges = [
        {
            id: 'today',
            label: 'Today',
            description: 'Attendance records for today',
            dateFrom: today.toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() === today.getTime())
        },
        {
            id: 'yesterday',
            label: 'Yesterday',
            description: 'Attendance records for yesterday',
            dateFrom: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() === today.getTime() - 24 * 60 * 60 * 1000)
        },
        {
            id: 'last7days',
            label: 'Last 7 Days',
            description: 'Attendance records from the past 7 days',
            dateFrom: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() >= today.getTime() - 6 * 24 * 60 * 60 * 1000)
        },
        {
            id: 'last14days',
            label: 'Last 14 Days',
            description: 'Attendance records from the past 14 days',
            dateFrom: new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() >= today.getTime() - 13 * 24 * 60 * 60 * 1000)
        },
        {
            id: 'last30days',
            label: 'Last 30 Days',
            description: 'Attendance records from the past 30 days',
            dateFrom: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() >= today.getTime() - 29 * 24 * 60 * 60 * 1000)
        },
        {
            id: 'thisweek',
            label: 'This Week',
            description: 'Attendance records for this week (Monday to Sunday)',
            dateFrom: getWeekStart(today).toISOString().split('T')[0],
            dateTo: getWeekEnd(today).toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() >= getWeekStart(today).getTime() && d.getTime() <= getWeekEnd(today).getTime())
        },
        {
            id: 'lastweek',
            label: 'Last Week',
            description: 'Attendance records for last week (Monday to Sunday)',
            dateFrom: getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            dateTo: getWeekEnd(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            available: availableDates.some(d => {
                const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
                const lastWeekEnd = getWeekEnd(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
                return d.getTime() >= lastWeekStart.getTime() && d.getTime() <= lastWeekEnd.getTime();
            })
        },
        {
            id: 'thismonth',
            label: 'This Month',
            description: 'Attendance records for this month',
            dateFrom: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
            dateTo: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0],
            available: availableDates.some(d => d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear())
        },
        {
            id: 'lastmonth',
            label: 'Last Month',
            description: 'Attendance records for last month',
            dateFrom: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0],
            dateTo: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0],
            available: availableDates.some(d => d.getMonth() === today.getMonth() - 1 && d.getFullYear() === today.getFullYear())
        },
        {
            id: 'last3months',
            label: 'Last 3 Months',
            description: 'Attendance records from the past 3 months',
            dateFrom: new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() >= new Date(today.getFullYear(), today.getMonth() - 3, 1).getTime())
        },
        {
            id: 'last6months',
            label: 'Last 6 Months',
            description: 'Attendance records from the past 6 months',
            dateFrom: new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            available: availableDates.some(d => d.getTime() >= new Date(today.getFullYear(), today.getMonth() - 6, 1).getTime())
        },
        {
            id: 'thisyear',
            label: 'This Year',
            description: 'Attendance records for this year',
            dateFrom: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
            dateTo: new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0],
            available: availableDates.some(d => d.getFullYear() === today.getFullYear())
        }
    ];
    
    return ranges;
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
}

/**
 * Get the end of the week (Sunday) for a given date
 */
function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(new Date(date));
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}
