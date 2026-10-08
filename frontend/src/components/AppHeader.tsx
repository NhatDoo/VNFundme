import { Heart, LogIn, LogOut, Menu, UserRound } from "lucide-react";
import type { User } from "../api";
import type { View } from "../types";

export function AppHeader({
  user,
  onNavigate,
  onAuth,
  onLogout,
}: {
  user: User | null;
  onNavigate: (view: View) => void;
  onAuth: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => onNavigate("campaigns")}>
        <span>
          <Heart size={17} fill="currentColor" />
        </span>
        VNFundme
      </button>
      <nav>
        <button onClick={() => onNavigate("campaigns")}>Chiến dịch</button>
        {user && <button onClick={() => onNavigate("history")}>Lịch sử</button>}
        {(user?.role === "ORGANIZER") && (
          <button onClick={() => onNavigate("organizer")}>Tổ chức</button>
        )}
        {user?.role === "ADMIN" && (
          <button onClick={() => onNavigate("admin")}>Quản trị</button>
        )}
      </nav>
      <div className="top-actions">
        {user ? (
          <button className="user-button" onClick={onLogout}>
            <UserRound size={16} />
            {user.name}
            <LogOut size={15} />
          </button>
        ) : (
          <button className="primary compact" onClick={onAuth}>
            <LogIn size={16} /> Đăng nhập
          </button>
        )}
        <Menu className="menu" size={20} />
      </div>
    </header>
  );
}
