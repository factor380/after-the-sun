import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const alt = "נקודות שקיעה ביהודה ובשומרון";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default function JudeaSamariaOpenGraphImage() {
  return renderOgCard({
    title: "נקודות שקיעה ביהודה ובשומרון",
    subtitle: "יהודה · שומרון ובנימין",
  });
}
