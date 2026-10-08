import { Heart, Search } from "lucide-react";

import { CampaignCard } from "../components/CampaignCard";
import type { Campaign } from "../api";

interface CampaignListPageProps {
  campaigns: Campaign[];
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onSelect: (id: string) => void;
}

export function CampaignListPage({
  campaigns,
  query,
  onQueryChange,
  onSearch,
  onSelect,
}: CampaignListPageProps) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">CÁC CHIẾN DỊCH ĐANG HOẠT ĐỘNG</p>
          <h1>Quyên góp đồng hành</h1>
          <p>
            Chọn chiến dịch, theo dõi tiến độ và báo cáo sử dụng quy minh bạch.
          </p>
        </div>
        <div className="hero-mark">
          <Heart size={38} fill="currentColor" />
        </div>
      </section>

      <section className="toolbar">
        <label>
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onSearch()}
            placeholder="Tìm chiến dịch"
          />
        </label>
        <button className="primary" type="button" onClick={onSearch}>
          <Search size={16} /> Tìm kiếm
        </button>
      </section>

      <section className="grid">
        {campaigns.length ? (
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="empty">Không tìm thấy chiến dịch phù hợp.</div>
        )}
      </section>
    </>
  );
}
