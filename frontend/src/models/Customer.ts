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
  passwordHash?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  isEmailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  phone?: string;
  otpCode?: string;
  otpExpires?: Date;
  avatarUrl?: string;
  addresses: ICustomerAddress[];
  rewardPoints: number;
  referralCode: string;
  referredBy?: string;
  activityLogs: ICustomerActivityLog[];
  totalOrders: number;
  totalSpent: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  isActive: boolean;
  lastLogin?: Date;
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
    passwordHash: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    phone: { type: String, default: '' },
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    avatarUrl: { type: String, default: '' },
    addresses: [AddressSchema],
    rewardPoints: { type: Number, default: 0 },
    referralCode: { type: String, required: true, unique: true, index: true },
    referredBy: { type: String, default: '' },
    activityLogs: [ActivityLogSchema],
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    tier: { type: String, default: 'Silver', enum: ['Silver', 'Gold', 'Platinum'] },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export { Customer };
export default Customer;
