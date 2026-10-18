import RegionOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export { alt, contentType, size };

type ImageProps = { params: Promise<{ slug: string }> };

export default function RegionTwitterImage({ params }: ImageProps) {
  return RegionOpenGraphImage({ params });
}
