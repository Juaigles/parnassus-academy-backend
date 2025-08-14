// src/routes/search.routes.js
import { Router } from 'express';
import {
  searchCourses,
  searchAutocomplete,
  searchInstructors,
  getRelatedCourses,
  getSearchTrends
} from '../controllers/searchController.js';

export const searchRouter = Router();

// Búsqueda principal
searchRouter.get('/search/courses', searchCourses);
searchRouter.get('/search/autocomplete', searchAutocomplete);
searchRouter.get('/search/instructors', searchInstructors);
searchRouter.get('/search/related/:courseId', getRelatedCourses);
searchRouter.get('/search/trends', getSearchTrends);
