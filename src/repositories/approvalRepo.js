import ApprovalRequest from '../models/ApprovalRequest.js';
export const createPending = ({ courseId, submittedBy, notes })=> ApprovalRequest.create({ courseId, submittedBy, notes });
export const listPending = ()=> ApprovalRequest.find({ status:'pending' }).sort('-createdAt').lean();
export const findById = (id)=> ApprovalRequest.findById(id);
export const save = (doc)=> doc.save();
