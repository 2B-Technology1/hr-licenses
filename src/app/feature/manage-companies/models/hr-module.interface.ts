// ==========================================================================
// Module catalogue
// ==========================================================================

export interface HrModule {
  code: number;
  name: string;
  description: string;
  isCore: boolean;
  sortOrder: number;
  dependsOn: number[];
}
