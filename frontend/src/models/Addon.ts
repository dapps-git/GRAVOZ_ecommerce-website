import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddon extends Document {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sku: string;
  stock: number;
  /** e.g. ['all'] or ['shoes', 'casual', 'formal', 'sports', 'babies'] */
  applicableCategories: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddonSchema = new Schema<IAddon>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    sku: { type: String, required: true, unique: true, trim: true },
    stock: { type: Number, default: 99999, min: 0 },
    applicableCategories: {
      type: [String],
      default: ['all'],
      // Supported values: 'all', 'shoes', 'casual', 'formal', 'sports', 'sandals', 'boots', 'babies'
    },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Addon: Model<IAddon> =
  mongoose.models.Addon || mongoose.model<IAddon>('Addon', AddonSchema);

export { Addon };
export default Addon;
