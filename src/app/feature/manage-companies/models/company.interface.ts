import { PaginationObj } from '@mohammed_a4rf/core-ui/utils';

export const CompanyStatus = {
  Active: 1,
  Suspended: 2,
} as const;

export interface CompanyFilter extends PaginationObj {
  status?: (typeof CompanyStatus)[keyof typeof CompanyStatus];
  expired?: boolean;
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
