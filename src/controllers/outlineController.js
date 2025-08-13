import { getOutlineForViewer } from '../services/outlineService.js';

export async function getCourseOutline(req, res, next) {
  try {
    const out = await getOutlineForViewer({ 
      courseId: req.params.courseId, 
      viewer: req.user || null 
    });
    res.json(out);
  } catch (e) { 
    next(e); 
  }
}
