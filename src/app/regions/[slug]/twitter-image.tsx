import RegionOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export const revalidate = 600;
export const runtime = "nodejs";
export { alt, contentType, size };

type ImageProps = { params: Promise<{ slug: string }> };

export default function RegionTwitterImage({ params }: ImageProps) {
  return RegionOpenGraphImage({ params });
}
