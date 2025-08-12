import * as adminService from '../services/adminService.js';

export async function listApprovalRequests(_req,res,next){ try{ res.json(await adminService.listApprovalRequests()); }catch(e){next(e);} }
export async function decideApproval(req,res,next){ try{ const out=await adminService.decideApproval({ approvalRequestId:req.params.approvalId, adminId:req.user.id, decision:req.body.decision, notes:req.body?.notes }); res.json(out);}catch(e){next(e);} }
export async function publishCourse(req,res,next){ try{ const out=await adminService.publishCourse({ courseId:req.params.courseId }); res.json(out);}catch(e){next(e);} }
