import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomerAddress {
  label?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface ICustomerActivityLog {
  action: string;
  details?: string;
  timestamp?: Date;
}

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  addresses: ICustomerAddress[];
  rewardPoints: number;
  referralCode: string;
  referredBy?: string;
  activityLogs: ICustomerActivityLog[];
  totalOrders: number;
  totalSpent: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<ICustomerAddress>({
  label: { type: String, default: 'Home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const ActivityLogSchema = new Schema<ICustomerActivityLog>({
  action: { type: String, required: true },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    addresses: [AddressSchema],
    rewardPoints: { type: Number, default: 0 },
    referralCode: { type: String, required: true, unique: true, index: true },
    referredBy: { type: String, default: '' },
    activityLogs: [ActivityLogSchema],
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    tier: { type: String, default: 'Silver', enum: ['Silver', 'Gold', 'Platinum'] },
  },
  { timestamps: true }
);

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export { Customer };
export default Customer;
