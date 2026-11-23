// ==========================================================================
// A company's license
// ==========================================================================

/** Ids of `Enums/getLicenseState`. */
export const LicenseState = {
  Active: 1,
  ExpiringSoon: 2,
  Expired: 3,
  Stopped: 4,
  NotStarted: 5,
} as const;

export interface CompanyLicense {
  companyId: number;
  companyName: string;
  code: string;
  state: number;
  stateName: string;
  status: number;
  statusName: string;
  licenseStartDate: string;
  licenseExpiryDate: string;
  daysLeft: number;
  daysOverdue: number;
  maxUsers: number;
  graceDays: number;
  suspendedReason: string | null;
  suspendedAt: string | null;
}

export interface LicenseExtendBody {
  companyId: number;
  months?: number;
  days?: number;
  note?: string;
}

export interface LicenseStopBody {
  companyId: number;
  reason: string;
}

export interface LicenseResumeBody {
  companyId: number;
  note?: string;
}
