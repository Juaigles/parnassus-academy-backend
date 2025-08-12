import mongoose from 'mongoose';
import * as approvalRepo from '../repositories/approvalRepo.js';
import * as courseRepo from '../repositories/courseRepo.js';
import AppError from '../libs/appError.js';

export async function listApprovalRequests(){ return approvalRepo.listPending(); }

export async function decideApproval({ approvalRequestId, adminId, decision, notes }){
  const ar = await approvalRepo.findById(approvalRequestId);
  if (!ar) throw new AppError('Approval request not found', 404);
  if (ar.status!=='pending') throw new AppError('Conflict', 409, 'Solicitud ya resuelta');
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async ()=>{
      ar.status = decision==='approve' ? 'approved':'rejected';
      ar.reviewedBy = adminId; ar.notes = notes; await approvalRepo.save(ar);
      const course = await courseRepo.findById(ar.courseId);
      if (!course) throw new AppError('Course not found', 404);
      course.status = (ar.status==='approved') ? 'approved' : 'draft';
      await course.save({ session });
    });
    return { ok:true, status: ar.status };
  } finally { session.endSession(); }
}

export async function publishCourse({ courseId }){
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (course.status!=='approved') throw new AppError('Conflict', 409, 'Solo cursos aprobados pueden publicarse');
  course.status='published'; await course.save(); return { status: course.status };
}
