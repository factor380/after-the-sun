import ShfelaSouthSunsetOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export const runtime = "nodejs";
export const revalidate = 600;
export { alt, contentType, size };

export default function ShfelaSouthSunsetTwitterImage() {
  return ShfelaSouthSunsetOpenGraphImage();
}
