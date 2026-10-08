import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import type { AdminCampaign, Campaign, User } from "../api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
);

interface AdminAnalyticsProps {
  campaigns: AdminCampaign[];
  users: User[];
}

export function AdminAnalytics({ campaigns, users }: AdminAnalyticsProps) {
  // Campaign Status breakdown
  const statusCounts = {
    ACTIVE: 0,
    PENDING_REVIEW: 0,
    REJECTED: 0,
    COMPLETED: 0,
  };
  campaigns.forEach((c) => {
    const s = c.status as keyof typeof statusCounts;
    if (statusCounts[s] !== undefined) {
      statusCounts[s]++;
    }
  });

  const campaignStatusData = {
    labels: ["Đã duyệt (Active)", "Chờ duyệt", "Từ chối", "Hoàn thành"],
    datasets: [
      {
        data: [
          statusCounts.ACTIVE,
          statusCounts.PENDING_REVIEW,
          statusCounts.REJECTED,
          statusCounts.COMPLETED,
        ],
        backgroundColor: ["#28704f", "#f59e0b", "#ef4444", "#3b82f6"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  // User Role breakdown
  const roleCounts = {
    DONOR: 0,
    ORGANIZER: 0,
    ADMIN: 0,
  };
  users.forEach((u) => {
    if (roleCounts[u.role] !== undefined) {
      roleCounts[u.role]++;
    }
  });

  const userRoleData = {
    labels: ["Nhà tài trợ (Donor)", "Tổ chức (Organizer)", "Quản trị (Admin)"],
    datasets: [
      {
        data: [roleCounts.DONOR, roleCounts.ORGANIZER, roleCounts.ADMIN],
        backgroundColor: ["#3b82f6", "#8b5cf6", "#e85d4a"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  // Top campaigns raised
  const topCampaigns = [...campaigns]
    .sort((a, b) => Number(b.current) - Number(a.current))
    .slice(0, 5);

  const topRaisedData = {
    labels: topCampaigns.map((c) =>
      c.title.length > 20 ? c.title.substring(0, 20) + "..." : c.title,
    ),
    datasets: [
      {
        label: "Đã quyên góp (VND)",
        data: topCampaigns.map((c) => Number(c.current)),
        backgroundColor: "rgba(40, 112, 79, 0.85)",
        borderRadius: 6,
      },
      {
        label: "Mục tiêu (VND)",
        data: topCampaigns.map((c) => Number(c.target)),
        backgroundColor: "rgba(232, 93, 74, 0.35)",
        borderRadius: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 16,
          font: { size: 12, family: "Inter, sans-serif" },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 12, family: "Inter, sans-serif" } },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) =>
            new Intl.NumberFormat("vi-VN", {
              notation: "compact",
              compactDisplay: "short",
            }).format(Number(value)) + " đ",
        },
      },
    },
  };

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h3 className="chart-title">
          <PieChart size={18} /> Phân bổ trạng thái chiến dịch
        </h3>
        <div className="chart-wrapper doughnut">
          <Doughnut data={campaignStatusData} options={doughnutOptions} />
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">
          <PieChart size={18} /> Phân bổ người dùng theo vai trò
        </h3>
        <div className="chart-wrapper doughnut">
          <Doughnut data={userRoleData} options={doughnutOptions} />
        </div>
      </div>

      <div className="chart-card full-width">
        <h3 className="chart-title">
          <TrendingUp size={18} /> Top chiến dịch huy động vốn tốt nhất
        </h3>
        <div className="chart-wrapper bar">
          <Bar data={topRaisedData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}

interface OrganizerAnalyticsProps {
  campaigns: Campaign[];
}

export function OrganizerAnalytics({ campaigns }: OrganizerAnalyticsProps) {
  const topCampaigns = campaigns.slice(0, 6);

  const progressData = {
    labels: topCampaigns.map((c) =>
      c.title.length > 18 ? c.title.substring(0, 18) + "..." : c.title,
    ),
    datasets: [
      {
        label: "Đã đạt được (VND)",
        data: topCampaigns.map((c) => Number(c.current)),
        backgroundColor: "rgba(40, 112, 79, 0.85)",
        borderRadius: 6,
      },
      {
        label: "Mục tiêu (VND)",
        data: topCampaigns.map((c) => Number(c.target)),
        backgroundColor: "rgba(232, 93, 74, 0.35)",
        borderRadius: 6,
      },
    ],
  };

  const statusCounts = {
    ACTIVE: 0,
    PENDING_REVIEW: 0,
    REJECTED: 0,
    COMPLETED: 0,
  };
  campaigns.forEach((c) => {
    const s = c.status as keyof typeof statusCounts;
    if (statusCounts[s] !== undefined) {
      statusCounts[s]++;
    }
  });

  const statusData = {
    labels: ["Đã duyệt (Active)", "Chờ duyệt", "Từ chối", "Hoàn thành"],
    datasets: [
      {
        data: [
          statusCounts.ACTIVE,
          statusCounts.PENDING_REVIEW,
          statusCounts.REJECTED,
          statusCounts.COMPLETED,
        ],
        backgroundColor: ["#28704f", "#f59e0b", "#ef4444", "#3b82f6"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 12, family: "Inter, sans-serif" } },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) =>
            new Intl.NumberFormat("vi-VN", {
              notation: "compact",
              compactDisplay: "short",
            }).format(Number(value)) + " đ",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 14,
          font: { size: 12, family: "Inter, sans-serif" },
        },
      },
    },
  };

  if (!campaigns.length) return null;

  return (
    <div className="charts-grid organizer">
      <div className="chart-card flex-2">
        <h3 className="chart-title">
          <BarChart3 size={18} /> Tiến độ huy động vốn các chiến dịch
        </h3>
        <div className="chart-wrapper bar">
          <Bar data={progressData} options={barOptions} />
        </div>
      </div>

      <div className="chart-card flex-1">
        <h3 className="chart-title">
          <PieChart size={18} /> Trạng thái chiến dịch
        </h3>
        <div className="chart-wrapper doughnut">
          <Doughnut data={statusData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
