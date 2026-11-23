export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR';

export type FulfillmentMode = 'RTW_ONLY' | 'BESPOKE_ONLY' | 'HYBRID';

export type SizeCode = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export type CategoryCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09';

export type MeasurementUnit = 'in' | 'cm';

export type HomeFilterTab =
  | 'All'
  | 'Ready-to-Wear'
  | 'Custom-Available'
  | 'Traditional & Occasion'
  | 'Corporate & Streetwear';

export type ActivePageView =
  | 'home'
  | 'brand-house'
  | 'custom-tailoring'
  | 'story'
  | 'contact'
  | 'account'
  | 'workshop';

export interface Category {
  code: CategoryCode;
  name: string;
  shortName: string;
  scope: string;
  image: string;
  defaultFilterGroup: HomeFilterTab;
}

export interface FabricSwatch {
  id: string;
  name: string;
  material: string;
  hexPrimary: string;
  hexSecondary: string;
  hexAccent: string;
  patternType: 'ankara' | 'kente' | 'adire' | 'wool' | 'aso-oke' | 'cotton';
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryCode: CategoryCode;
  categoryName: string;
  fulfillmentMode: FulfillmentMode;
  priceNGN: number;
  bespokeSurchargeNGN: number;
  image: string;
  secondaryImage: string;
  description: string;
  craftDetails: string[];
  swatches: FabricSwatch[];
  cutOptions: string[];
  stockBySize: Record<SizeCode, number>;
  modelNote: string;
  isSpotlight?: boolean;
  isNewArrival?: boolean;
  soldOutOverride?: boolean;
  filterGroups: HomeFilterTab[];
}

export interface BodyMeasurements {
  chestBust: number;
  waist: number;
  hips: number;
  shoulderWidth: number;
  sleeveLength: number;
  neck: number;
  trouserInseam: number;
  trouserOutseam: number;
  garmentLength: number;
}

export interface MeasurementProfile {
  id: string;
  name: string;
  unit: MeasurementUnit;
  measurements: BodyMeasurements; // Always stored canonically in inches for consistent conversion
  notes: string;
  updatedAt: string;
}

export interface BespokeSpec {
  profileName?: string;
  measurementsIn: BodyMeasurements;
  fitNotes: string;
  referencePhotoDataUrl?: string;
  referencePhotoName?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  image: string;
  selectedMode: 'RTW' | 'BESPOKE';
  size?: SizeCode;
  swatch: FabricSwatch;
  cutOption: string;
  unitPriceNGN: number;
  quantity: number;
  bespokeSpec?: BespokeSpec;
}

export type ShippingZoneId =
  | 'UGHELLI_PICKUP'
  | 'DELTA_METRO'
  | 'NIGERIA_INTERSTATE'
  | 'INTERNATIONAL_EXPRESS';

export interface ShippingZone {
  id: ShippingZoneId;
  label: string;
  coverage: string;
  carrier: string;
  eta: string;
  rateNGN: number;
}

export type PaymentPlan = 'FULL_UPFRONT' | 'SPLIT_DEPOSIT_60_40';

export type PaymentGateway =
  | 'Paystack (NGN Cards / Transfer / USSD)'
  | 'Flutterwave Nigeria (NGN)'
  | 'Stripe Global (Cards / Apple Pay)'
  | 'Flutterwave Global Cards';

export type RtwStage = 'Order Confirmed' | 'Packed' | 'Dispatched' | 'Delivered';

export type BespokeStage =
  | 'Measurements Confirmed'
  | 'Fabric Cutting'
  | 'Sewing & Construction'
  | 'Finishing & Quality Check'
  | 'Dispatched'
  | 'Delivered';

export interface OrderMilestoneLog {
  timestamp: string;
  stage: string;
  channel: 'Email & WhatsApp' | 'Email';
  message: string;
}

export interface Order {
  id: string;
  createdAt: string;
  targetCompletionDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  whatsappOptIn: boolean;
  deliveryAddress: string;
  shippingZone: ShippingZone;
  currency: CurrencyCode;
  paymentGateway: PaymentGateway;
  paymentPlan: PaymentPlan;
  rtwItems: CartItem[];
  bespokeItems: CartItem[];
  subtotalNGN: number;
  shippingNGN: number;
  totalNGN: number;
  amountPaidNGN: number;
  balanceDueNGN: number;
  balanceSettled: boolean;
  rtwStage?: RtwStage;
  rtwTrackingCode?: string;
  bespokeStage?: BespokeStage;
  bespokeTrackingCode?: string;
  notifications: OrderMilestoneLog[];
}

export interface StoreSettings {
  bespokeCapacityOpen: boolean;
  splitDepositEnabled: boolean;
  bespokeLeadWindow: string;
}
