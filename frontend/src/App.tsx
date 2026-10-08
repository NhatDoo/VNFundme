import { useEffect, useState } from "react";
import { X, Heart } from "lucide-react";

import { api } from "./api";
import { AppHeader } from "./components/AppHeader";
import { AuthModal } from "./components/AuthModal";
import { AdminPage } from "./pages/AdminPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { CampaignListPage } from "./pages/CampaignListPage";
import { DonationHistoryPage } from "./pages/DonationHistoryPage";
import { OrganizerPage } from "./pages/OrganizerPage";
import { PaymentConfirmationPage } from "./pages/PaymentConfirmationPage";
import { PageLoader } from "./components/Loading";
import type { Campaign, User } from "./api";
import type { Page, View } from "./types";

const accessKey = "vnfundme.accessToken";
const refreshKey = "vnfundme.refreshToken";

const isPaymentReturn = () =>
  window.location.pathname === "/payment-result" ||
  new URLSearchParams(window.location.search).has("vnp_TxnRef");

export default function App() {
  const [view, setView] = useState<View>(() =>
    isPaymentReturn() ? "payment" : "campaigns",
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [query, setQuery] = useState("");
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(accessKey),
  );
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCampaigns = async (search = "") => {
    try {
      const page = await api<Page<Campaign>>(
        `/campaign?search=${encodeURIComponent(search)}&limit=24`,
      );
      setCampaigns(page.items);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể tải chiến dịch.",
      );
    }
  };

  useEffect(() => {
    void loadCampaigns().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    void api<User>("/user/profile", { token })
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(accessKey);
        localStorage.removeItem(refreshKey);
        setToken(null);
      });
  }, [token]);

  const navigate = (next: View) => {
    if (
      next !== "campaigns" &&
      next !== "detail" &&
      next !== "payment" &&
      !token
    ) {
      setAuth(true);
      return;
    }
    setView(next);
  };

  const goHome = () => {
    window.history.replaceState(null, "", "/");
    setView("campaigns");
    window.scrollTo(0, 0);
  };

  const selectCampaign = async (id: string) => {
    try {
      setSelected(await api<Campaign>(`/campaign/${id}`));
      setView("detail");
      window.scrollTo(0, 0);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể mở chiến dịch.",
      );
    }
  };

  const logout = () => {
    localStorage.removeItem(accessKey);
    localStorage.removeItem(refreshKey);
    setToken(null);
    setUser(null);
    setView("campaigns");
  };

  return (
    <div className="min-h-screen bg-vnfundme">
      <div className="relative z-10">
        <AppHeader
          user={user}
          onNavigate={navigate}
          onAuth={() => setAuth(true)}
          onLogout={logout}
        />
        {notice && (
          <div className="toast">
            <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
              <Heart className="w-5 h-5 text-brand-400" />
              <span className="text-sm flex-1">{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && view === "campaigns" ? (
            <PageLoader />
          ) : (
            <>
              {view === "campaigns" && (
                <CampaignListPage
                  campaigns={campaigns}
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={() => void loadCampaigns(query)}
                  onSelect={selectCampaign}
                />
              )}
              {view === "detail" && (
                <CampaignDetailPage
                  campaign={selected}
                  token={token}
                  onBack={() => setView("campaigns")}
                  onAuth={() => setAuth(true)}
                  onNotice={setNotice}
                />
              )}
              {view === "history" && token && (
                <DonationHistoryPage token={token} onNotice={setNotice} />
              )}
              {view === "organizer" && token && (
                <OrganizerPage
                  token={token}
                  onNotice={setNotice}
                  onRefresh={() => void loadCampaigns()}
                />
              )}
              {view === "admin" && token && (
                <AdminPage token={token} onNotice={setNotice} />
              )}
              {view === "payment" && (
                <PaymentConfirmationPage
                  isLoggedIn={Boolean(token)}
                  onBackHome={goHome}
                  onHistory={() => navigate("history")}
                  onNotice={setNotice}
                />
              )}
            </>
          )}
        </main>
        <footer className="text-center py-6 text-sm text-gray-500 border-t border-gray-200 mt-8">
          VNFundme | Minh bạch từng khoản donate
        </footer>
      </div>
      {auth && (
        <AuthModal
          onClose={() => setAuth(false)}
          onNotice={setNotice}
          onDone={(tokens) => {
            localStorage.setItem(accessKey, tokens.accessToken);
            localStorage.setItem(refreshKey, tokens.refreshToken);
            setToken(tokens.accessToken);
            setAuth(false);
          }}
        />
      )}
    </div>
  );
}
