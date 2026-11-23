import { PaginationObj } from '@mohammed_a4rf/core-ui/utils';

// ==========================================================================
// Companies list and form
// ==========================================================================

/** Ids of `Enums/getCompanyStatus`. */
export const CompanyStatus = {
  Active: 1,
  Suspended: 2,
} as const;

export interface CompanyFilter extends PaginationObj {
  filterValue?: string;
  status?: (typeof CompanyStatus)[keyof typeof CompanyStatus];
  expired?: boolean;
  module?: number;
}

export interface CompanySummary {
  id: number;
  name: string;
  nameAr: string;
  nameEn: string;
  code: string;
  status: number;
  statusName: string;
  licenseExpiryDate: string | null;
}

export interface Company extends CompanySummary {
  apiUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  suspendedReason: string | null;
  licenseStartDate: string;
  licenseExpiryDate: string;
  isExpired: boolean;
  daysLeft: number;
  maxUsers: number;
  graceDays: number;
  activeModules: number[];
  notes: string | null;
}

/** A table row: the company plus the names of its active modules (for the chips column). */
export interface CompanyRow extends Company {
  moduleNames: string[];
}

/** Body of `Company/register` and `Company/Edit` (`id` on edit; `modules` is ignored on edit). Blank optional fields are left out. */
export interface CompanyBody {
  id?: number;
  name: string;
  engName: string;
  code: string;
  apiUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  licenseStartDate: string;
  licenseExpiryDate: string;
  maxUsers: number;
  graceDays: number;
  notes?: string;
  modules: number[];
}

/** Returned once by `Company/register`: the HR system needs the code and this secret. */
export interface CompanySecret {
  id: number;
  code: string;
  secret: string;
}
