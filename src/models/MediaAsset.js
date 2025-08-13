import mongoose from 'mongoose';
const mediaAssetSchema = new mongoose.Schema({
  kind: { type: String, enum: ['image','pdf','other'], required: true },
  key: { type: String, required: true }, // s3 key
  url: { type: String },                 // opcional si generas prefirmada al vuelo
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });
export default mongoose.model('MediaAsset', mediaAssetSchema);
