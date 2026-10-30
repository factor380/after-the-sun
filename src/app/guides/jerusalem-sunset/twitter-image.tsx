import JerusalemSunsetOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export const runtime = "nodejs";
export { alt, contentType, size };

export default function JerusalemSunsetTwitterImage() {
  return JerusalemSunsetOpenGraphImage();
}
