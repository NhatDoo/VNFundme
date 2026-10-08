import { useEffect, useState } from "react";
import {
  BarChart3,
  Heart,
  Plus,
  ShieldCheck,
  UserRound,
  WalletCards,
  Users,
  CheckSquare,
} from "lucide-react";

import { api, fetchUsers, fetchAdminCampaigns, approveCampaign, rejectCampaign } from "../api";
import { SectionHeader, StatCard } from "../components/SectionHeader";
import { PaymentTable } from "../components/Tables";
import { UserTable } from "../components/UserTable";
import { CreateUserModal } from "../components/CreateUserModal";
import { AdminCampaignTable } from "../components/AdminCampaignTable";
import { ReviewCampaignModal } from "../components/ReviewCampaignModal";
import { AdminAnalytics } from "../components/AnalyticsCharts";
import type { Payment, User, Role, AdminCampaign } from "../api";

interface AdminDashboard {
  users: number;
  activeCampaigns: number;
  pendingCampaigns: number;
  totalRaised: string | number;
}

interface AdminPageProps {
  token: string;
  onNotice: (message: string) => void;
}

export function AdminPage({ token, onNotice }: AdminPageProps) {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("");

  // Campaign review state
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>("PENDING_REVIEW");
  const [reviewModal, setReviewModal] = useState<{ campaign: AdminCampaign; mode: "approve" | "reject" } | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const loadCampaigns = async () => {
    try {
      const result = await fetchAdminCampaigns(token, {
        status: campaignStatusFilter || undefined,
        limit: 50,
      });
      setCampaigns(result.items);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Không thể tải dữ liệu.");
    }
  };

  const loadUsers = async () => {
    try {
      const result = await fetchUsers(token, {
        search: userSearch || undefined,
        role: (userRoleFilter || undefined) as Role | undefined,
        limit: 50,
      });
      setUsers(result.items);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Không thể tải dữ liệu.");
    }
  };

  useEffect(() => {
    void Promise.all([
      api<AdminDashboard>("/admin/dashboard", { token }),
      api<{ items: Payment[] }>(`/admin/transactions?limit=10`, { token }),
    ])
      .then(([stats, transactions]) => {
        setDashboard(stats);
        setPayments(transactions.items);
      })
      .catch((error: Error) => onNotice(error.message));
    void loadUsers();
    void loadCampaigns();
  }, [token, onNotice]);

  const handleRoleChange = async (id: string, role: Role) => {
    try {
      const updated = await api<User>(`/user/admin/${id}/role`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ role }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? updated : u)),
      );
      onNotice("Cap nhat vai tro thanh cong.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Loi cap nhat.");
    }
  };

  const handleLock = async (id: string) => {
    try {
      const updated = await api<User>(`/user/admin/${id}/lock`, {
        method: "PATCH",
        token,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? updated : u)),
      );
      onNotice("Da khoa tai khoan.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Loi khoa tai khoan.");
    }
  };

  const handleUnlock = async (id: string) => {
    try {
      const updated = await api<User>(`/user/admin/${id}/unlock`, {
        method: "PATCH",
        token,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? updated : u)),
      );
      onNotice("Đã mở khóa tài khoản.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Lỗi mở khóa.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ban co chac muon xoa tai khoan nay?")) return;
    try {
      await api<User>(`/user/admin/${id}`, {
        method: "DELETE",
        token,
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      onNotice("Đã xóa tài khoản.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Lỗi xóa tài khoản.");
    }
  };

  // Campaign review handlers
  const handleApprove = (campaign: AdminCampaign) => {
    setReviewModal({ campaign, mode: "approve" });
  };

  const handleReject = (campaign: AdminCampaign) => {
    setReviewModal({ campaign, mode: "reject" });
  };

  const handleReviewSubmit = async (
    campaignId: string,
    reviewNote: string | undefined,
  ) => {
    setReviewBusy(true);
    try {
      const mode = reviewModal?.mode;
      if (mode === "approve") {
        await approveCampaign(campaignId, reviewNote, token);
        onNotice("Đã duyệt chiến dịch.");
      } else {
        await rejectCampaign(campaignId, reviewNote ?? "", token);
        onNotice("Đã từ chối chiến dịch.");
      }
      setReviewModal(null);
      void loadCampaigns();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Lỗi xử lý.");
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <section className="workspace">
      <SectionHeader
        eyebrow="ADMIN CONSOLE"
        title="Quản lý hệ thống"
        action={<ShieldCheck />}
      />
      <div className="stats four">
        <StatCard
          label="Người dùng"
          value={String(dashboard?.users ?? 0)}
          icon={<UserRound />}
        />
        <StatCard
          label="Campaign active"
          value={String(dashboard?.activeCampaigns ?? 0)}
          icon={<Heart />}
        />
        <StatCard
          label="Chờ duyệt"
          value={String(dashboard?.pendingCampaigns ?? 0)}
          icon={<BarChart3 />}
        />
        <StatCard
          label="Tổng quy"
          value={String(dashboard?.totalRaised ?? 0)}
          icon={<WalletCards />}
        />
      </div>

      <AdminAnalytics campaigns={campaigns} users={users} />

      <div className="campaign-review">
        <div className="section-head">
          <h2 className="table-title">
            <CheckSquare size={18} /> Duyệt chiến dịch
          </h2>
        </div>
        <div className="toolbar">
          <label>
            <select
              value={campaignStatusFilter}
              onChange={(e) => setCampaignStatusFilter(e.target.value)}
            >
              <option value="PENDING_REVIEW">Chờ duyệt</option>
              <option value="ACTIVE">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
              <option value="">Tất cả</option>
            </select>
          </label>
        </div>
        <AdminCampaignTable
          campaigns={campaigns}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>

      <div className="user-management">
        <div className="section-head">
          <h2 className="table-title">
            <Users size={18} /> Quản lý tài khoản
          </h2>
          <button
            className="primary"
            type="button"
            onClick={() => setShowCreateUser(true)}
          >
            <Plus size={16} /> Tạo tài khoản
          </button>
        </div>

        <div className="toolbar">
          <label>
            <input
              type="text"
              placeholder="Tìm kiếm tên, email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </label>
          <label>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="DONOR">Donor</option>
              <option value="ORGANIZER">Organizer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>

        <UserTable
          users={users}
          onRoleChange={handleRoleChange}
          onLock={handleLock}
          onUnlock={handleUnlock}
          onDelete={handleDelete}
        />
      </div>

      <h2 className="table-title">Giao dịch gần đây</h2>
      <PaymentTable items={payments} admin />

      {showCreateUser && (
        <CreateUserModal
          token={token}
          onClose={() => setShowCreateUser(false)}
          onCreated={() => {
            setShowCreateUser(false);
            void loadUsers();
          }}
          onNotice={onNotice}
        />
      )}

      {reviewModal && (
        <ReviewCampaignModal
          campaign={reviewModal.campaign}
          mode={reviewModal.mode}
          onClose={() => setReviewModal(null)}
          onSubmit={handleReviewSubmit}
          busy={reviewBusy}
        />
      )}
    </section>
  );
}