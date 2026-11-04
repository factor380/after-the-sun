import RegionsOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export const revalidate = 600;
export const runtime = "nodejs";
export { alt, contentType, size };

export default function RegionsTwitterImage() {
  return RegionsOpenGraphImage();
}
