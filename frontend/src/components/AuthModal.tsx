import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../api";

export function AuthModal({
  onClose,
  onDone,
  onNotice,
}: {
  onClose: () => void;
  onDone: (tokens: { accessToken: string; refreshToken: string }) => void;
  onNotice: (message: string) => void;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (register) {
        await api("/user/register", {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            email: form.get("email"),
            phonenumber: form.get("phone"),
            password: form.get("password"),
          }),
        });
        onNotice("Đăng ký thành công. Hãy đăng nhập.");
        setRegister(false);
      } else {
        onDone(
          await api("/user/login", {
            method: "POST",
            body: JSON.stringify({
              email: form.get("email"),
              password: form.get("password"),
            }),
          }),
        );
      }
    } catch (error) {
      onNotice(
        error instanceof Error ? error.message : "Không thể xử lý yêu cầu.",
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
        <p className="eyebrow">
          {register ? "THAM GIA VN FUNDME" : "CHÀO MỪNG TRỞ LẠI"}
        </p>
        <h2>{register ? "Tài khoản" : "Đăng nhập"}</h2>
        {register && (
          <label>
            Họ và tên
            <input name="name" minLength={2} required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        {register && (
          <label>
            Số điện thoại
            <input name="phone" placeholder="+84901234567" required />
          </label>
        )}
        <label>
          Mật khẩu
          <input name="password" type="password" minLength={8} required />
        </label>
        <button className="primary donate" disabled={busy}>
          {busy ? "Đang xử lý..." : register ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
        <button
          type="button"
          className="link switch"
          onClick={() => setRegister(!register)}
        >
          {register
            ? "Đã có tài khoản? Đăng nhập"
            : "Chưa có tài khoản? Đăng ký"}
        </button>
      </form>
    </div>
  );
}
