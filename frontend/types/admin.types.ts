// types/admin.types.ts

import type { Role } from './auth.types';

export interface DashboardStats {
  totalMembers:   number;
  totalFlats:     number;
  occupiedFlats:  number;
  vacantFlats:    number;
  pendingBills:   number;
  totalCollected: number;
  totalIncome:    number;
  totalExpense:   number;
  openComplaints: number;
  visitorsToday:  number;
  activeNotices:  number;
  bankBalance:    number;
}

export interface SocietySettings {
  id: number;
  societyName:                 string | null;
  registrationNo:              string | null;
  address:                     string | null;
  city:                        string | null;
  state:                       string | null;
  pincode:                     string | null;
  contactPhone:                string | null;
  contactEmail:                string | null;
  website:                     string | null;
  defaultMaintenanceAmount:    number;
  maintenanceDueDayOfMonth:    number;
  lateFineAmount:              number;
  lateFineDaysAfterDue:        number;
  bankName:                    string | null;
  bankAccountNo:               string | null;
  bankIfscCode:                string | null;
  bankBranch:                  string | null;
  financialYearStart:          string;
  currency:                    string;
  logoPath:                    string | null;
  version:                     number;
  reminderEmailSubject:        string | null;
  reminderEmailBody:           string | null;
  emailUsername:               string | null;
  emailPassword:               string | null;
}

export interface SystemUser {
  id:          number;
  username:    string;
  role:        Role;
  fullName:    string | null;
  isActive:    boolean;
  memberId:    number | null;
  memberName:  string | null;
  lastLogin:   string | null;
  createdAt:   string;
}

export interface UserCreateRequest {
  username:  string;
  password:  string;
  role:      Role;
  fullName?: string;
  memberId?: number;
}

export interface UserUpdateRequest {
  fullName?:  string;
  role:       Role;
  memberId?:  number;
  isActive?:  boolean;
}

export interface DocumentFile {
  id:             number;
  title:          string;
  documentType:   string;
  fileName:       string;
  fileSize:       number | null;
  mimeType:       string | null;
  uploadedByName: string | null;
  memberId:       number | null;
  createdAt:      string;
}

export const DOC_TYPES = ['Society', 'Legal', 'Financial', 'Member'] as const;
export type  DocType   = typeof DOC_TYPES[number];

export interface ActivityLog {
  id:        number;
  username:  string;
  action:    string;
  module:    string | null;
  details:   string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content:       T[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}
