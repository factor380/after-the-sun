export type SpotSummary = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  region: string | null;
  photoUrl: string | null;
  createdById: string;
  createdAt: string;
};
