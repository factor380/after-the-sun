import JudeaSamariaOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export const runtime = "nodejs";
export { alt, contentType, size };

export default function JudeaSamariaTwitterImage() {
  return JudeaSamariaOpenGraphImage();
}
