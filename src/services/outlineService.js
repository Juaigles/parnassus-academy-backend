import * as courseRepo from '../repositories/courseRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import * as progressRepo from '../repositories/progressRepo.js';
import * as moduleQuizRepo from '../repositories/moduleQuizRepo.js';
import * as moduleQuizAttemptRepo from '../repositories/moduleQuizAttemptRepo.js';
import { assertCanViewCourse, isAdmin, isOwner } from './_rules.js';
import { isModuleUnlocked, isLessonUnlocked, canAttemptModuleQuiz, canAttemptFinalQuiz } from './gatingService.js';

function byIndex(a,b){ return (a.index||0)-(b.index||0); }

export async function getOutline({ courseId, viewer }) {
  const course = await courseRepo.findById(courseId);
  assertCanViewCourse(course, viewer || null);

  const [modules, lessons, progresses] = await Promise.all([
    moduleRepo.listByCourse(courseId),
    lessonRepo.listByCourse(courseId),
    viewer ? progressRepo.listByUserCourse(viewer.id, courseId) : Promise.resolve([])
  ]);
  modules.sort(byIndex);
  lessons.sort((a,b)=> (String(a.moduleId)===String(b.moduleId) ? (a.index||0)-(b.index||0) : String(a.moduleId).localeCompare(String(b.moduleId))));

  const progByLesson = new Map(progresses.map(p => [String(p.lessonId), p]));
  const outline = [];
  let nextUp = null;
  let lastResume = null;

  for (const m of modules) {
    const mLessons = lessons.filter(l => String(l.moduleId)===String(m._id)).sort(byIndex);
    const mUnlocked = viewer ? await isModuleUnlocked({ user: viewer, course, module: m }) : (m.index===0);
    const quiz = await moduleQuizRepo.findByModule(m._id);
    const quizPassed = viewer ? !!(await moduleQuizAttemptRepo.anyPassedForUserModule(viewer.id, m._id)) : false;
    const quizAvailable = viewer ? await canAttemptModuleQuiz({ userId: viewer.id, moduleId: m._id }) : false;

    const lessonItems = [];
    for (const l of mLessons) {
      const unlocked = viewer ? await isLessonUnlocked({ user: viewer, course, module: m, lesson: l }) : (mUnlocked && l.index===0);
      const p = progByLesson.get(String(l._id));
      const completed = !!p?.lessonCompleted;
      const percent = Math.round(((p?.video?.percentMax || 0))*100);
      const lastPos = p?.video?.lastPositionSec || 0;

      if (!nextUp && unlocked && !completed) nextUp = { moduleId: m._id, lessonId: l._id };
      if (!lastResume || (p && p.updatedAt > lastResume.updatedAt)) lastResume = p || lastResume;

      lessonItems.push({
        lessonId: l._id, title: l.title, index: l.index,
        unlocked, completed, percent, lastPositionSec: lastPos
      });
    }

    const total = lessonItems.length || 1;
    const completedCount = lessonItems.filter(x=>x.completed).length;
    const modPercent = Math.round((completedCount/total)*100);

    outline.push({
      moduleId: m._id, title: m.title, index: m.index, unlocked: mUnlocked,
      percent: modPercent,
      quiz: quiz ? { exists: true, passed: quizPassed, available: quizAvailable } : { exists: false },
      lessons: lessonItems
    });
  }

  const totalLessons = lessons.length || 1;
  const totalCompleted = outline.flatMap(m=>m.lessons).filter(x=>x.completed).length;
  const coursePercent = Math.round((totalCompleted/totalLessons)*100);
  const finalAllowed = viewer ? await canAttemptFinalQuiz({ userId: viewer.id, courseId }) : false;

  return {
    course: { id: course._id, title: course.title, percent: coursePercent },
    modules: outline,
    nextUp,
    resume: lastResume ? { lessonId: lastResume.lessonId, lastPositionSec: lastResume.video?.lastPositionSec || 0 } : null,
    finalQuiz: { canAttempt: finalAllowed }
  };
}
