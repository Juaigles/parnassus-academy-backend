// src/repositories/userRepo.js
import User from '../models/User.js';
export const create = (data) => User.create(data);
export const findByEmail = (email) => User.findOne({ email });
export const findById = (id) => User.findById(id);
