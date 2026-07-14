// types/property.types.ts

export type FlatStatus = 'VACANT' | 'OCCUPIED';
export type FlatType   = 'BHK_1' | 'BHK_2' | 'BHK_3' | 'STUDIO' | 'PENTHOUSE';
export type MemberType = 'OWNER' | 'TENANT' | 'CO_OWNER';

export const FLAT_TYPE_LABELS: Record<FlatType, string> = {
  BHK_1:     '1 BHK',
  BHK_2:     '2 BHK',
  BHK_3:     '3 BHK',
  STUDIO:    'Studio',
  PENTHOUSE: 'Penthouse',
};

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  OWNER:    'Owner',
  TENANT:   'Tenant',
  CO_OWNER: 'Co-Owner',
};

// ── Wings ─────────────────────────────────────────────────────────────────────

export interface Wing {
  id: number;
  name: string;
  totalFlats: number;
  occupiedCount: number;
  vacantCount: number;
  createdAt: string;
}

export interface WingRequest {
  name: string;
}

// ── Flats ─────────────────────────────────────────────────────────────────────

export interface Flat {
  id: number;
  flatNumber: string;
  floorNumber: number | null;
  flatType: FlatType | null;
  flatTypeLabel: string | null;
  areaSqft: number | null;
  status: FlatStatus;
  wingId: number;
  wingName: string;
  createdAt: string;
  updatedAt: string;
  memberId?: number | null;
  memberName?: string | null;
  memberPhone?: string | null;
}

export interface FlatRequest {
  wingId: number;
  flatNumber: string;
  floorNumber?: number;
  flatType?: FlatType;
  areaSqft?: number;
}

// ── Members ───────────────────────────────────────────────────────────────────

export interface FlatSummary {
  id: number;
  flatNumber: string;
  wingName: string;
}

export interface Member {
  id: number;
  fullName: string;
  mobile: string | null;
  email: string | null;
  aadharNumber: string | null;
  memberType: MemberType;
  flat: FlatSummary | null;
  moveInDate: string | null;
  moveOutDate: string | null;
  vehicleNumber: string | null;
  parkingSlot: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberRequest {
  fullName: string;
  mobile?: string;
  email?: string;
  aadharNumber?: string;
  memberType: MemberType;
  flatId: number;
  moveInDate?: string;
  vehicleNumber?: string;
  parkingSlot?: string;
}

// ── Pagination wrapper (matches Spring Page<T>) ───────────────────────────────

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
