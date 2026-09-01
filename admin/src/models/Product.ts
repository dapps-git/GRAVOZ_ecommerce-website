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
  isAvailable?: boolean;
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  targetAudience: 'Men' | 'Women' | 'Babies';
  category?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  subCategory: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sizes: string[];
  sizeAvailability?: IProductSizeItem[];
  colors: string[];
  colorVariants?: IProductColorVariant[];
  images: IProductImage[];
  seo?: IProductSEO;
  isBestSeller: boolean;
  isTopSeller?: boolean;
  isFeatured: boolean;
  isLatest?: boolean;
  badge?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  alt: { type: String, required: true, default: 'Shoe image' },
  publicId: { type: String },
});

const ProductSizeItemSchema = new Schema<IProductSizeItem>({
  size: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number, default: 10 },
}, { _id: false });

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
    sku: { type: String, required: true, unique: true },
    targetAudience: { type: String, required: true, enum: ['Men', 'Women', 'Babies'], index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
    subCategory: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0, index: true },
    sizes: [{ type: String }],
    sizeAvailability: { type: [ProductSizeItemSchema], default: [] },
    colors: [{ type: String }],
    colorVariants: { type: [ProductColorVariantSchema], default: [] },
    images: {
      type: [ProductImageSchema],
      validate: [
        function (val: IProductImage[]) {
          return val.length >= 1 && val.length <= 6;
        },
        'Product must have between 1 and 6 photos',
      ],
    },
    seo: { type: ProductSEOSchema, default: () => ({}) },
    isBestSeller: { type: Boolean, default: false, index: true },
    isTopSeller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isLatest: { type: Boolean, default: false, index: true },
    badge: { type: String, default: '' },
    status: { type: String, default: 'active', enum: ['active', 'draft', 'archived'] },
  },
  { timestamps: true }
);

ProductSchema.index({ targetAudience: 1, isBestSeller: 1 });
ProductSchema.index({ name: 'text', description: 'text', subCategory: 'text' });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export { Product };
export default Product;
