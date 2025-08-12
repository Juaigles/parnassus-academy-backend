import { getOutline } from '../services/outlineService.js';
export async function getCourseOutline(req,res,next){
  try{ const out=await getOutline({ courseId:req.params.courseId, viewer:req.user||null }); res.json(out); }
  catch(e){ next(e); }
}
