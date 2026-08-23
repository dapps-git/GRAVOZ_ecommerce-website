import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  targetAudience: 'Men' | 'Women' | 'Babies' | 'All';
  image?: string;
  subCategories: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true },
    targetAudience: {
      type: String,
      enum: ['Men', 'Women', 'Babies', 'All'],
      default: 'All',
      index: true,
    },
    image: { type: String, default: '' },
    subCategories: { type: [String], default: [] },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
