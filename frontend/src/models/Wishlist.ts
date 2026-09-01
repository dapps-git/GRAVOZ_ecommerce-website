import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWishlistItem {
  _id?: string;
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  size?: string;
  color?: string;
  addedAt?: Date;
}

export interface IWishlist extends Document {
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  imageUrl: { type: String, required: true },
  size: { type: String },
  color: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    guestId: { type: String, index: true },
    items: [WishlistItemSchema],
  },
  { timestamps: true }
);

export const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);
