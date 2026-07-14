// types/operations.types.ts

export type ComplaintStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ComplaintCategory = 'Water'|'Electricity'|'Lift'|'Parking'|'Security'|'Cleanliness'|'Noise'|'Other';
export type NoticeCategory    = 'General'|'Meeting'|'Emergency'|'Maintenance'|'Event';

export interface Complaint {
  id:          number;
  title:       string;
  description: string | null;
  category:    ComplaintCategory | null;
  status:      ComplaintStatus;
  memberId:    number;
  memberName:  string;
  flatNumber:  string | null;
  wingName:    string | null;
  remarks:     string | null;
  resolvedAt:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface ComplaintRequest {
  title:       string;
  description?: string;
  category?:   ComplaintCategory;
  memberId:    number;
}

export interface Visitor {
  id:             number;
  visitorName:    string;
  mobile:         string | null;
  purpose:        string | null;
  flatId:         number | null;
  flatNumber:     string | null;
  wingName:       string | null;
  hostMemberId:   number | null;
  hostMemberName: string | null;
  entryTime:      string;
  exitTime:       string | null;
  vehicleNo:      string | null;
  insidePremises: boolean;
  createdAt:      string;
}

export interface VisitorRequest {
  visitorName:   string;
  mobile?:       string;
  purpose?:      string;
  flatId:        number;
  hostMemberId?: number;
  vehicleNo?:    string;
}

export interface Notice {
  id:            number;
  title:         string;
  content:       string | null;
  category:      NoticeCategory;
  createdBy:     number | null;
  createdByName: string | null;
  isActive:      boolean;
  expiresAt:     string | null;
  hasPoll:       boolean;
  ackCount:      number;
  createdAt:     string;
  updatedAt:     string;
}

export interface NoticeRequest {
  title:      string;
  content?:   string;
  category:   NoticeCategory;
  expiresAt?: string;
}

export interface PollResult {
  pollId:     number;
  noticeId:   number;
  question:   string;
  optionA:    string; votesA: number;
  optionB:    string; votesB: number;
  optionC:    string | null; votesC: number;
  optionD:    string | null; votesD: number;
  totalVotes: number;
  isActive:   boolean;
  endsAt:     string | null;
  myVote:     'A'|'B'|'C'|'D' | null;
}

export interface PollRequest {
  question:  string;
  optionA:   string;
  optionB:   string;
  optionC?:  string;
  optionD?:  string;
  endsAt?:   string;
}

export interface AcknowledgementList {
  count:   number;
  members: { memberName: string; readAt: string }[];
}
