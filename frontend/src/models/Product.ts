import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductImage {
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface IProductSizeItem {
  size: string;
  isAvailable: boolean;
  stock?: number;
}

export interface IProductColorVariant {
  id?: string;
  name: string;
  colorCode?: string;
  imageUrl?: string;
  images?: IProductImage[];
  isAvailable?: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description: string;
  targetAudience: 'Men' | 'Women' | 'Babies';
  category: mongoose.Types.ObjectId;
  subCategory: string;
  images: IProductImage[];
  price: number;
  discountPrice?: number;
  stock: number;
  sizes: string[];
  sizeAvailability?: IProductSizeItem[];
  colors: string[];
  colorVariants?: IProductColorVariant[];
  isBestSeller: boolean;
  isTopSeller?: boolean;
  isFeatured: boolean;
  isLatest?: boolean;
  badge?: string;
  status: 'active' | 'draft' | 'archived';
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  alt: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
});

const ProductColorVariantSchema = new Schema<IProductColorVariant>(
  {
    id: { type: String, default: '' },
    name: { type: String, required: true },
    colorCode: { type: String, default: '#000000' },
    imageUrl: { type: String, default: '' },
    images: { type: [ProductImageSchema], default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    targetAudience: { type: String, required: true, enum: ['Men', 'Women', 'Babies'], index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: String, required: true, index: true },
    images: { type: [ProductImageSchema], required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    colorVariants: { type: [ProductColorVariantSchema], default: [] },
    isBestSeller: { type: Boolean, default: false, index: true },
    isTopSeller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isLatest: { type: Boolean, default: false, index: true },
    badge: { type: String, default: '' },
    status: { type: String, default: 'active', enum: ['active', 'draft', 'archived'], index: true },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export { Product };
export default Product;
