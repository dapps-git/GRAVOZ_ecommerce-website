import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  targetAudience: 'Men' | 'Women' | 'Babies' | 'Kids';
  image: string;
  subCategories: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    targetAudience: { type: String, required: true, enum: ['Men', 'Women', 'Babies', 'Kids'], index: true },
    image: { type: String, required: true },
    subCategories: [{ type: String }],
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export { Category };
export default Category;
