// src/controllers/searchController.js
import * as searchService from '../services/searchService.js';
import { z } from 'zod';

const searchCoursesSchema = z.object({
  query: z.string().optional().default(''),
  category: z.string().optional().default(''),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default(''),
  priceRange: z.string().optional().default(''),
  rating: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  language: z.string().optional().default('es'),
  sortBy: z.enum(['relevance', 'newest', 'price_low', 'price_high', 'rating', 'popular']).optional().default('relevance'),
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 12, 50))
});

const searchInstructorsSchema = z.object({
  query: z.string().optional().default(''),
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50))
});

/**
 * Búsqueda de cursos
 * GET /api/search/courses
 */
export async function searchCourses(req, res) {
  try {
    const searchParams = searchCoursesSchema.parse(req.query);
    
    const result = await searchService.searchCourses(searchParams);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Autocompletado de búsqueda
 * GET /api/search/autocomplete
 */
export async function searchAutocomplete(req, res) {
  try {
    const { query } = req.query;
    
    const result = await searchService.searchAutocomplete(query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Búsqueda de instructores
 * GET /api/search/instructors
 */
export async function searchInstructors(req, res) {
  try {
    const searchParams = searchInstructorsSchema.parse(req.query);
    
    const result = await searchService.searchInstructors(searchParams);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Obtener cursos relacionados
 * GET /api/search/related/:courseId
 */
export async function getRelatedCourses(req, res) {
  try {
    const { courseId } = req.params;
    const limit = parseInt(req.query.limit) || 6;
    
    const result = await searchService.getRelatedCourses(courseId, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Obtener tendencias de búsqueda
 * GET /api/search/trends
 */
export async function getSearchTrends(req, res) {
  try {
    const result = await searchService.getSearchTrends();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
