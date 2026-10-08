import { useState, useEffect } from "react";
import { TrendingUp, Heart, DollarSign, Target } from "lucide-react";
import { api } from "../api";
import { StatCard } from "./StatCard";
import { LoadingSpinner, SkeletonTable } from "./Loading";

interface DashboardStats {
  campaigns: number;
  successfulDonations: number;
  totalRaised: number;
}

interface RecentDonation {
  id: string;
  amount: number;
  createdAt: string;
  donor: { name: string };
  campaign: { title: string };
}

export function OrganizerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
      api<DashboardStats>("/campaign/organizer/dashboard", { token }),
      api<{ items: RecentDonation[] }>("/payment/history?limit=5", { token }),
    ])
      .then(([s, r]) => {
        setStats(s);
        setRecent(r.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-24 skeleton mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32 skeleton" />
            </div>
          ))}
        </div>
        <SkeletonTable rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Chiến dịch"
          value={stats?.campaigns ?? 0}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={<Heart className="w-6 h-6" />}
          label="Lượt donate"
          value={stats?.successfulDonations ?? 0}
          gradient="from-pink-500 to-rose-500"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Tổng đã nhận"
          value={new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats?.totalRaised ?? 0)}
          gradient="from-green-500 to-emerald-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-500" />
          Donate gần đây
        </h3>
        {recent.length === 0 ? (
          <LoadingSpinner message="Chưa có donate nào" size="sm" />
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800">{r.campaign.title}</p>
                  <p className="text-sm text-gray-500">{r.donor.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    +{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(r.amount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}