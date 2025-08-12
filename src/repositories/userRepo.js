import User from '../models/User.js';
export const create = (d)=> User.create(d);
export const findByEmail = (email)=> User.findOne({ email });
export const findById = (id)=> User.findById(id);
