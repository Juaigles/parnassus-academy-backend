// src/services/searchService.js
import Course from '../models/Course.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Búsqueda avanzada de cursos
 */
export async function searchCourses({
  query = '',
  category = '',
  level = '',
  priceRange = '',
  rating = '',
  duration = '',
  language = 'es',
  sortBy = 'relevance',
  page = 1,
  limit = 12
} = {}) {
  
  const skip = (page - 1) * limit;
  
  // Construir filtros
  const filters = {
    status: 'published'
  };

  // Filtro de texto
  if (query) {
    filters.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'tags': { $in: [new RegExp(query, 'i')] } },
      { 'marketing.benefits': { $regex: query, $options: 'i' } }
    ];
  }

  // Filtro por categoría
  if (category) {
    filters.category = category;
  }

  // Filtro por nivel
  if (level) {
    filters.level = level;
  }

  // Filtro por idioma
  if (language) {
    filters.language = language;
  }

  // Filtro por rating
  if (rating) {
    const minRating = parseFloat(rating);
    filters['rating.average'] = { $gte: minRating };
  }

  // Filtro por precio
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    if (max) {
      filters['price.amountCents'] = { $gte: min * 100, $lte: max * 100 };
    } else {
      filters['price.amountCents'] = { $gte: min * 100 };
    }
  }

  // Filtro por duración
  if (duration) {
    const [minHours, maxHours] = duration.split('-').map(Number);
    if (maxHours) {
      filters.estimatedHours = { $gte: minHours, $lte: maxHours };
    } else {
      filters.estimatedHours = { $gte: minHours };
    }
  }

  // Configurar ordenación
  let sortOrder = {};
  switch (sortBy) {
    case 'newest':
      sortOrder = { createdAt: -1 };
      break;
    case 'price_low':
      sortOrder = { 'price.amountCents': 1 };
      break;
    case 'price_high':
      sortOrder = { 'price.amountCents': -1 };
      break;
    case 'rating':
      sortOrder = { 'rating.average': -1, 'rating.count': -1 };
      break;
    case 'popular':
      sortOrder = { 'stats.enrollments': -1 };
      break;
    default: // relevance
      if (query) {
        sortOrder = { score: { $meta: 'textScore' } };
        filters.$text = { $search: query };
      } else {
        sortOrder = { 'rating.average': -1, createdAt: -1 };
      }
  }

  // Ejecutar búsqueda
  const [courses, total, facets] = await Promise.all([
    Course.find(filters)
      .select('title slug description thumbnail price level category language rating stats estimatedHours createdAt')
      .populate('owner', 'firstName lastName avatar')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(),
    
    Course.countDocuments(filters),
    
    // Obtener facetas para filtros
    Course.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          categories: { $addToSet: '$category' },
          levels: { $addToSet: '$level' },
          languages: { $addToSet: '$language' },
          priceRanges: {
            $push: {
              $switch: {
                branches: [
                  { case: { $eq: ['$price.amountCents', 0] }, then: 'free' },
                  { case: { $lte: ['$price.amountCents', 2000] }, then: '0-20' },
                  { case: { $lte: ['$price.amountCents', 5000] }, then: '20-50' },
                  { case: { $lte: ['$price.amountCents', 10000] }, then: '50-100' }
                ],
                default: '100+'
              }
            }
          }
        }
      }
    ])
  ]);

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    facets: facets[0] || {
      categories: [],
      levels: [],
      languages: [],
      priceRanges: []
    },
    query: {
      query,
      category,
      level,
      priceRange,
      rating,
      duration,
      language,
      sortBy
    }
  };
}

/**
 * Búsqueda de autocompletado
 */
export async function searchAutocomplete(query) {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  const [courseSuggestions, categorySuggestions] = await Promise.all([
    // Sugerencias de cursos
    Course.find({
      status: 'published',
      title: { $regex: query, $options: 'i' }
    })
    .select('title slug')
    .limit(5)
    .lean(),

    // Sugerencias de categorías
    Course.distinct('category', {
      status: 'published',
      category: { $regex: query, $options: 'i' }
    }).limit(3)
  ]);

  return {
    suggestions: [
      ...courseSuggestions.map(course => ({
        type: 'course',
        title: course.title,
        slug: course.slug
      })),
      ...categorySuggestions.map(category => ({
        type: 'category',
        title: category,
        slug: category.toLowerCase().replace(/\s+/g, '-')
      }))
    ]
  };
}

/**
 * Búsqueda de instructores
 */
export async function searchInstructors({
  query = '',
  page = 1,
  limit = 10
} = {}) {
  
  const skip = (page - 1) * limit;
  
  const filters = {
    roles: 'teacher'
  };

  if (query) {
    filters.$or = [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { bio: { $regex: query, $options: 'i' } }
    ];
  }

  const [instructors, total] = await Promise.all([
    User.find(filters)
      .select('firstName lastName avatar bio specialties')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    
    User.countDocuments(filters)
  ]);

  // Enriquecer con estadísticas de cursos
  const enrichedInstructors = await Promise.all(
    instructors.map(async (instructor) => {
      const courseStats = await Course.aggregate([
        { $match: { owner: instructor._id, status: 'published' } },
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            avgRating: { $avg: '$rating.average' },
            totalStudents: { $sum: '$stats.enrollments' }
          }
        }
      ]);

      return {
        ...instructor,
        stats: courseStats[0] || {
          totalCourses: 0,
          avgRating: 0,
          totalStudents: 0
        }
      };
    })
  );

  return {
    instructors: enrichedInstructors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Obtener cursos relacionados
 */
export async function getRelatedCourses(courseId, limit = 6) {
  const course = await Course.findById(courseId).select('category level tags');
  if (!course) return [];

  const relatedCourses = await Course.find({
    _id: { $ne: courseId },
    status: 'published',
    $or: [
      { category: course.category },
      { level: course.level },
      { tags: { $in: course.tags || [] } }
    ]
  })
  .select('title slug thumbnail price rating level')
  .populate('owner', 'firstName lastName')
  .sort({ 'rating.average': -1, createdAt: -1 })
  .limit(limit)
  .lean();

  return relatedCourses;
}

/**
 * Obtener tendencias de búsqueda
 */
export async function getSearchTrends() {
  // Esto se implementaría con un sistema de logging de búsquedas
  // Por ahora devolvemos categorías más populares
  const trends = await Course.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating.average' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return {
    categories: trends.map(trend => ({
      name: trend._id,
      count: trend.count,
      avgRating: trend.avgRating || 0
    }))
  };
}
