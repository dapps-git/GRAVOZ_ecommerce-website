import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem {
  _id?: string;
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  size: string;
  quantity: number;
  imageUrl: string;
  color?: string;
}

export interface ICart extends Document {
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  imageUrl: { type: String, required: true },
  color: { type: String },
});

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    guestId: { type: String, index: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

export const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
