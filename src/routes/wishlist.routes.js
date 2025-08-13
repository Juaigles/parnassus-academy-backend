// src/routes/wishlist.routes.js
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist
} from '../controllers/wishlistController.js';

export const wishlistRouter = Router();

wishlistRouter.get('/users/wishlist', requireAuth, getMyWishlist);
wishlistRouter.post('/users/wishlist/:courseId', requireAuth, addToWishlist);
wishlistRouter.delete('/users/wishlist/:courseId', requireAuth, removeFromWishlist);
wishlistRouter.get('/users/wishlist/:courseId/check', requireAuth, checkInWishlist);
