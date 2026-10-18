import AboutOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export { alt, contentType, size };

export default function AboutTwitterImage() {
  return AboutOpenGraphImage();
}
