import Course from '../models/Course.js';

export const create = (d)=> Course.create(d);
export const findById = (id)=> Course.findById(id);
export const updateById = (id, patch)=> Course.findByIdAndUpdate(id, patch, { new:true });

export const findBySlug = (slug)=> Course.findOne({ slug });

export function listPublished({ limit=20, skip=0, level, tag, search } = {}) {
  const q = { status: 'published', visibility: 'public' };
  if (level) q.level = level;
  if (tag) q.tags = tag;
  if (search) q.$text = { $search: search }; // crea índice si lo usas
  return Course.find(q)
    .sort('-publishedAt -createdAt')
    .skip(skip)
    .limit(limit)
    .lean();
}
