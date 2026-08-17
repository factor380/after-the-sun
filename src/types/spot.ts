export type SpotSummary = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  region: string | null;
  /** Cover image: the spot's own photo, falling back to the oldest community photo. */
  photoUrl: string | null;
  /** Total images available for the spot, cover included. */
  photoCount: number;
  createdAt: string;
};

export type SpotPhotoItem = {
  id: string;
  url: string;
  uploadedById: string;
  createdAt: string;
};
