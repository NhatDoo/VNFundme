import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, X } from "lucide-react";
import type { User } from "../api";
import { api } from "../api";

export function AdminResetPasswordModal({
  user,
  token,
  onClose,
  onNotice,
}: {
  user: User;
  token: string;
  onClose: () => void;
  onNotice: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      onNotice("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    setBusy(true);
    try {
      await api(`/user/admin/${user.id}/password`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ newPassword }),
      });
      onNotice(`Đã đổi mật khẩu cho tài khoản ${user.email}.`);
      onClose();
    } catch (error) {
      onNotice(
        error instanceof Error ? error.message : "Không thể đổi mật khẩu.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal">
      <form onSubmit={(event) => void submit(event)}>
        <button className="close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">QUẢN LÝ TÀI KHOẢN</p>
        <h2>
          <KeyRound size={22} />
          Đổi mật khẩu user
        </h2>
        <p>{user.name} · {user.email}</p>
        <label>
          Mật khẩu mới
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Xác nhận mật khẩu mới
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </div>
  );
}
