// src/app/api/attendance/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Attendance from '@/lib/models/Attendance'
import { Group, IGroup } from '@/lib/models/Group'
import { Types } from 'mongoose'
import { requireSessionAndRoles } from "@/lib/authMiddleware";

interface AttendanceRequest {
  date: string
  groupId: string
  presentMembers: string[]
  absentMembers: string[]
  recordedBy: string
  eventId?: string
}




export async function POST(request: Request) {
  try {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, groupId, presentMembers, absentMembers, recordedBy, eventId }: AttendanceRequest = await request.json()

    if (!date || !groupId || !Array.isArray(presentMembers)) {
      return NextResponse.json(
        { error: 'Date, group ID, and present members array are required' },
        { status: 400 }
      )
    }

    const attendanceDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      )
    }

    if (attendanceDate > today) {
      return NextResponse.json(
        { error: 'Cannot record attendance for future dates' },
        { status: 400 }
      )
    }

    attendanceDate.setHours(0, 0, 0, 0)

    await dbConnect()

    const group = await Group.findById(groupId).exec() as (IGroup & { _id: Types.ObjectId }) | null

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.leader || group.leader.toString() !== user.id) {
      return NextResponse.json(
        { error: 'Only group leaders can record attendance' },
        { status: 403 }
      )
    }

    const presentObjectIds = presentMembers.map(id => new Types.ObjectId(id))
    const absentObjectIds = absentMembers.map(id => new Types.ObjectId(id))
    const groupMemberIds = new Set(group.members.map(memberId => memberId.toString()))
    const invalidMembers = presentMembers.filter(id => !groupMemberIds.has(id))

    if (invalidMembers.length > 0) {
      return NextResponse.json(
        { error: `Invalid members: ${invalidMembers.join(', ')}` },
        { status: 400 }
      )
    }

    const existingAttendance = await Attendance.findOne({
      date: attendanceDate,
      group: group._id
    }).exec()

    if (existingAttendance) {
      existingAttendance.presentMembers = presentObjectIds
      existingAttendance.absentMembers = absentObjectIds
      existingAttendance.updatedBy = new Types.ObjectId(user.id)
      existingAttendance.updatedAt = new Date()
      if (eventId) {
        existingAttendance.event = new Types.ObjectId(eventId)
      }

      await existingAttendance.save()

      return NextResponse.json({
        message: 'Attendance updated successfully',
        data: {
          id: existingAttendance._id.toString(),
          date: existingAttendance.date.toISOString().split('T')[0],
          group: group.name,
          presentCount: existingAttendance.presentMembers.length,
          absentCount: existingAttendance.absentMembers.length,
          updated: true
        }
      })
    }

    const attendance = new Attendance({
      date: attendanceDate,
      group: group._id,
      presentMembers: presentObjectIds,
      absentMembers: absentObjectIds,
      recordedBy: new Types.ObjectId(user.id),
      updatedBy: new Types.ObjectId(user.id),
      notes: '',
      ...(eventId && { event: new Types.ObjectId(eventId) })
    })

    await attendance.save()

    return NextResponse.json(
      {
        message: 'Attendance recorded successfully',
        data: {
          id: attendance._id.toString(),
          date: attendance.date.toISOString().split('T')[0],
          group: group.name,
          presentCount: attendance.presentMembers.length,
          absentCount: attendance.absentMembers.length,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
