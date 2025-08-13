import * as courseRepo from '../repositories/courseRepo.js';
import * as moduleRepo from '../repositories/moduleRepo.js';
import * as lessonRepo from '../repositories/lessonRepo.js';
import Course from '../models/Course.js';

function secsToHoursLabel(sec=0){
  const h = Math.round(sec/3600);
  return `${h} horas`;
}

export async function listCards({ limit=20, skip=0, level, tag, search }={}) {
  const rows = await courseRepo.listPublished({ limit, skip, level, tag, search });
  return rows.map(c => ({
    id: String(c._id),
    slug: c.slug,
    title: c.title,
    subtitle: c.marketing?.card?.subtitle || '',
    excerpt: c.excerpt || '',
    level: c.level,
    pricing: c.pricing,
    coverImageUrl: c.marketing?.card?.coverImageUrl || '',
    badges: c.marketing?.card?.badges?.length ? c.marketing.card.badges : [
      secsToHoursLabel(c.stats?.totalDurationSec || 0),
      c.stats?.hasCertificate ? 'Certificación' : null,
      'Recursos incluidos'
    ].filter(Boolean),
    learnOutcomes: (c.marketing?.card?.learnOutcomes || []).slice(0,6),
    stats: c.stats || {}
  }));
}

export async function getDetailBySlug(slug) {
  const course = await Course.findOne({ slug, status: 'published', visibility: 'public' })
    .populate('marketing.teacher')
    .populate('marketing.hero.previewVideoAsset')
    .lean();

  if (!course) return null;

  const modules = await moduleRepo.listByCourse(course._id);
  const curriculum = [];
  for (const m of modules) {
    const lessons = await lessonRepo.listByModule(m._id);
    curriculum.push({
      id: String(m._id), title: m.title, index: m.index,
      lessons: lessons.map(l => ({
        id: String(l._id), title: l.title, index: l.index, durationSec: l.durationSec || 0
      }))
    });
  }

  const preview = course.marketing?.hero?.previewVideoAsset;
  const previewVideoUrl = preview?.playbackUrl || null;

  return {
    id: String(course._id),
    slug: course.slug,
    title: course.title,
    excerpt: course.excerpt,
    description: course.description,
    level: course.level,
    tags: course.tags || [],
    pricing: course.pricing,
    hero: {
      previewVideoUrl,
      posterImageUrl: course.marketing?.hero?.posterImageUrl || ''
    },
    objectives: course.marketing?.objectives || [],
    methodology: course.marketing?.methodology || [],
    resources: course.marketing?.resources || [],
    teacher: course.marketing?.teacher ? {
      name: course.marketing.teacher.name,
      photoUrl: course.marketing.teacher.photoUrl,
      bioShort: course.marketing.teacher.bioShort
    } : null,
    testimonials: course.marketing?.testimonials || [],
    faqs: course.marketing?.faqs || [],
    stats: course.stats || {},
    curriculum,
    // recomendado lo puedes calcular aquí por tags/level si quieres
    recommended: []
  };
}
