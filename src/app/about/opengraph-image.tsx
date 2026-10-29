import { CAMPAIGN_GOAL, campaignTitle, getCampaignSpotCount } from "@/lib/campaign";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const alt = "נקודות שקיעה בישראל";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 600;
export const runtime = "nodejs";

export default async function AboutOpenGraphImage() {
  const count = await getCampaignSpotCount();
  return renderOgCard({
    title: campaignTitle(count),
    subtitle: `${count} מתוך ${CAMPAIGN_GOAL}`,
  });
}
