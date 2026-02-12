export type RequestStatus =
  | "upcoming"
  | "pending"
  | "active"
  | "applied"
  | "completed"
  | "rejected";

export const REQUEST_TRANSITIONS: Record<
  RequestStatus,
  RequestStatus[]
> = {
  upcoming: ["pending", "rejected"],

  pending: ["active"],

  "active": ["applied"],

  applied: ["completed"],

  completed: [],

  rejected: [],
};

export type RequestPriority = 'high' | 'medium' | 'low';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export type PriceCategory ='service' | 'additional';
export interface PriceItem {
  id: string;
  label: string;
  amount: number;
  category: PriceCategory;
  isAdditional?: boolean;
  isMandatory?: boolean; 
  isCustom?: boolean;
}

export interface ServiceType {
  id:string;
  name:string;
}


export interface ServiceRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName:string;
  serviceType: string;
  serviceDetails: string;
  location: string;
  requestedDate: string;
  requestedTime: string;
  status: RequestStatus;
  priority: RequestPriority;
  amount: number;
  shopName: string;
  shopLocation: string;
  shopRating: number;
  timeline?: TimelineEvent[];
  priceDetails: PriceItem[];
  otp?: string;
  referenceNumber?:string;
  notes?: string[];
  rejectionReason?: string;
  payment_status:RawServiceRequest['payment_status'];
}

export interface RawServiceRequest {
  id: string;
  request_id: string;
  status: RequestStatus;
  payment_status: 'pending' | 'paid';
  otp: string;
  created_at: string;

  shop_data: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    mobile_number: string;
  };

  user_data: {
    id: string;
    name: string;
    mobile_number: string;
  };

  service_data: {
    address: string;
    service: {
      id: string;
      name: string;
      description: string;
      total_price: number;
      service_fee?:number;
      service_fees?: RawServiceFee[];
      additional_price?: number;
    };
    service_fee?:RawServiceFee[];
    service_type?:ServiceType;
  };

  logs?: RawLog[];
}


export interface RawServiceFee {
  id: string;
  name: string;
  charge?: number;
  price?: number;
  is_mandatory?: boolean;
  active?: boolean;
  type?:'system' |'custom';
}

export interface RawLog {
  id: string;
  log: string;
  created_at: string;
  created_by: {
    id: string;
    name: string;
  } | null;
}
