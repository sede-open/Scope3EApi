export interface CorporateEmissionAccess {
  id: string;
  emissionId: string;
  scope1And2: boolean;
  scope3: boolean;
  carbonOffsets: boolean;
  carbonIntensity: boolean;
  publicLink?: string | null;
}
