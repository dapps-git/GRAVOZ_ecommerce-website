import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestimonial extends Document {
  customerName: string;
  roleOrLocation: string;
  avatar?: string;
  rating: number; // 1 to 5
  comment: string;
  productRef?: mongoose.Types.ObjectId;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema: Schema<ITestimonial> = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    roleOrLocation: { type: String, default: 'Verified Buyer' },
    avatar: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    productRef: { type: Schema.Types.ObjectId, ref: 'Product' },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
