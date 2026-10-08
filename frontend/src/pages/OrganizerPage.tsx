import { useCallback, useEffect, useState } from "react";
import { BarChart3, Heart, Plus, WalletCards } from "lucide-react";

import { api } from "../api";
import { CreateCampaignModal } from "../components/CreateCampaignModal";
import { SectionHeader, StatCard } from "../components/SectionHeader";
import { CampaignTable } from "../components/Tables";
import { OrganizerAnalytics } from "../components/AnalyticsCharts";
import type { Campaign } from "../api";
import type { Page } from "../types";

interface OrganizerDashboard {
  campaigns: number;
  successfulDonations: number;
  totalRaised: string | number;
}

interface OrganizerPageProps {
  token: string;
  onNotice: (message: string) => void;
  onRefresh: () => void;
}

export function OrganizerPage({
  token,
  onNotice,
  onRefresh,
}: OrganizerPageProps) {
  const [dashboard, setDashboard] = useState<OrganizerDashboard | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [stats, mine] = await Promise.all([
        api<OrganizerDashboard>("/campaign/organizer/dashboard", { token }),
        api<Page<Campaign>>("/campaign/organizer/mine?limit=50", { token }),
      ]);
      setDashboard(stats);
      setCampaigns(mine.items);
    } catch (error) {
      onNotice(
        error instanceof Error ? error.message : "Không thể tải dữ liệu.",
      );
    }
  }, [token, onNotice]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="workspace">
      <SectionHeader
        eyebrow="Organizer"
        title="Quản lý chiến dịch"
        action={
          <button
            className="primary"
            type="button"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> Tạo chiến dịch
          </button>
        }
      />
      <div className="stats">
        <StatCard
          label="Chiến dịch"
          value={String(dashboard?.campaigns ?? 0)}
          icon={<Heart />}
        />
        <StatCard
          label="Lượt donate"
          value={String(dashboard?.successfulDonations ?? 0)}
          icon={<WalletCards />}
        />
        <StatCard
          label="Tổng đã nhận"
          value={String(dashboard?.totalRaised ?? 0)}
          icon={<BarChart3 />}
        />
      </div>

      <OrganizerAnalytics campaigns={campaigns} />

      <CampaignTable items={campaigns} />
      {showCreate && (
        <CreateCampaignModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            onRefresh();
            void load();
          }}
          onNotice={onNotice}
        />
      )}
    </section>
  );
}
