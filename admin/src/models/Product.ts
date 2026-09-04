import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductImage {
  url: string;
  alt: string;
  publicId?: string;
}

export interface IProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
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
  sizes?: IProductSizeItem[];
  isAvailable?: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  targetAudience: 'Men' | 'Women' | 'Babies';
  category?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  subCategory: string;
  itemType?: string;
  description: string;
  features?: string[];
  price: number;
  discountPrice?: number;
  gst?: number;
  stock: number;
  sizes: string[];
  sizeAvailability?: IProductSizeItem[];
  colors: string[];
  colorVariants?: IProductColorVariant[];
  images: IProductImage[];
  material?: string;
  ageRange?: string;
  occasion?: string;
  strapType?: string;
  closureType?: string;
  shoeType?: string;
  manufacturer?: string;
  hsnCode?: string;
  packingLength?: number;
  packingWidth?: number;
  packingHeight?: number;
  seo?: IProductSEO;
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
  alt: { type: String, default: 'Product image' },
  publicId: { type: String },
});

const ProductSizeItemSchema = new Schema<IProductSizeItem>(
  {
    size: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    stock: { type: Number, default: 10 },
  },
  { _id: false }
);

const ProductColorVariantSchema = new Schema<IProductColorVariant>(
  {
    id: { type: String, default: '' },
    name: { type: String, required: true },
    colorCode: { type: String, default: '#000000' },
    imageUrl: { type: String, default: '' },
    images: { type: [ProductImageSchema], default: [] },
    sizes: { type: [ProductSizeItemSchema], default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductSEOSchema = new Schema<IProductSEO>({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: [{ type: String }],
  slug: { type: String, default: '' },
  ogTitle: { type: String, default: '' },
  ogDescription: { type: String, default: '' },
  ogImage: { type: String, default: '' },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true },
    targetAudience: { type: String, required: true, enum: ['Men', 'Women', 'Babies'], index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
    subCategory: { type: String, default: 'Casual Shoes', index: true },
    itemType: { type: String, default: 'Shoe' },
    description: { type: String, default: '' },
    features: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    gst: { type: Number, default: 12 },
    stock: { type: Number, required: true, min: 0, default: 0, index: true },
    sizes: [{ type: String }],
    sizeAvailability: { type: [ProductSizeItemSchema], default: [] },
    colors: [{ type: String }],
    colorVariants: { type: [ProductColorVariantSchema], default: [] },
    images: {
      type: [ProductImageSchema],
      validate: [
        function (val: IProductImage[]) {
          return Array.isArray(val) && val.length >= 1;
        },
        'Product must have at least 1 photo',
      ],
    },
    material: { type: String, default: '' },
    ageRange: { type: String, default: '' },
    occasion: { type: String, default: '' },
    strapType: { type: String, default: '' },
    closureType: { type: String, default: '' },
    shoeType: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    hsnCode: { type: String, default: '' },
    packingLength: { type: Number, default: 0 },
    packingWidth: { type: Number, default: 0 },
    packingHeight: { type: Number, default: 0 },
    seo: { type: ProductSEOSchema, default: () => ({}) },
    isBestSeller: { type: Boolean, default: false, index: true },
    isTopSeller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isLatest: { type: Boolean, default: false, index: true },
    badge: { type: String, default: '' },
    status: { type: String, default: 'active', enum: ['active', 'draft', 'archived'] },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ targetAudience: 1, isBestSeller: 1 });
ProductSchema.index({ name: 'text', description: 'text', subCategory: 'text' });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

