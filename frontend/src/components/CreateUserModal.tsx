import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { X, UserPlus } from "lucide-react";
import { registerUser } from "../api";
import type { Role } from "../api";

export function CreateUserModal({
  token,
  onClose,
  onCreated,
  onNotice,
}: {
  token: string;
  onClose: () => void;
  onCreated: () => void;
  onNotice: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ORGANIZER");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await registerUser(
        { name, email, phonenumber, password, role },
        token,
      );
      onNotice("Da tao tai khoan thanh cong.");
      onCreated();
    } catch (error) {
      onNotice(
        error instanceof Error ? error.message : "Khong the tao tai khoan.",
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
        <p className="eyebrow">ADMIN</p>
        <h2>Tao tai khoan moi</h2>

        <label>
          Ho va ten
          <input
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            minLength={2}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          So dien thoai
          <input
            type="tel"
            value={phonenumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhonenumber(e.target.value)}
            required
          />
        </label>

        <label>
          Mat khau tam thoi
          <input
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        <label>
          Vai tro
          <select
            value={role}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as Role)}
          >
            <option value="ORGANIZER">Organizer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <button className="primary" type="submit" disabled={busy}>
          <UserPlus size={16} />
          {busy ? "Dang tao..." : "Tao tai khoan"}
        </button>
      </form>
    </div>
  );
}