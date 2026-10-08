import { ArrowLeft, Heart } from "lucide-react";
import { money } from "../api";
import type { Campaign } from "../api";
import { Progress } from "./Progress";

export function CampaignCard({
  campaign,
  onSelect,
}: {
  campaign: Campaign;
  onSelect: (id: string) => void;
}) {
  const progress =
    campaign.progressPercent ??
    Math.min((Number(campaign.current) / Number(campaign.target)) * 100, 100);

  const coverImage =
    campaign.images && campaign.images.length > 0
      ? campaign.images[0].url
      : null;

  return (
    <article className="campaign-card">
      <div className="visual">
        {coverImage ? (
          <img src={coverImage} alt="" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-100 to-mint flex items-center justify-center">
            <Heart size={48} className="text-brand-300" />
          </div>
        )}
        <span>{campaign.category?.name ?? "Cộng đồng"}</span>
      </div>
      <div className="card-body">
        <p className="muted">{campaign.creator?.name ?? "VNFundme"}</p>
        <h2>{campaign.title}</h2>
        <p className="description">{campaign.description}</p>
        <Progress value={progress} />
        <div className="progress-meta">
          <b>{money(campaign.current)}</b>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <button className="link" onClick={() => onSelect(campaign.id)}>
          Xem chi tiết <ArrowLeft size={15} />
        </button>
      </div>
    </article>
  );
}