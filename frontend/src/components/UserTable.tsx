import { dateTime } from "../api";
import type { User, Role } from "../api";
import { Status } from "./Status";

interface UserTableProps {
  users: User[];
  currentUserId?: string;
  onRoleChange: (id: string, role: Role) => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onDelete: (id: string) => void;
}

export function UserTable({
  users,
  currentUserId,
  onRoleChange,
  onLock,
  onUnlock,
  onDelete,
}: UserTableProps) {
  const statusVariant = (status: string) => {
    if (status === "ACTIVE") return "success";
    if (status === "LOCKED") return "failed";
    return "cancelled";
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ten</th>
            <th>Email</th>
            <th>Dien thoai</th>
            <th>Vai tro</th>
            <th>Trang thai</th>
            <th>Ngay tao</th>
            <th>Thao tac</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td className="mono">{user.email}</td>
                <td className="mono">{user.phonenumber}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      onRoleChange(user.id, e.target.value as Role)
                    }
                    disabled={user.id === currentUserId}
                    style={{ fontSize: "12px", padding: "4px" }}
                  >
                    <option value="DONOR">Donor</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>
                  <Status value={user.status} variant={statusVariant(user.status)} />
                </td>
                <td>{dateTime(user.createdAt)}</td>
                <td>
                  <div className="user-actions">
                    {user.status === "ACTIVE" ? (
                      <button
                        className="link"
                        onClick={() => onLock(user.id)}
                        disabled={user.id === currentUserId}
                      >
                        Khoa
                      </button>
                    ) : (
                      <button
                        className="link"
                        onClick={() => onUnlock(user.id)}
                        disabled={user.id === currentUserId}
                      >
                        Mo khoa
                      </button>
                    )}
                    <button
                      className="link danger"
                      onClick={() => onDelete(user.id)}
                      disabled={user.id === currentUserId}
                    >
                      Xoa
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>Chua co guoi dung nao.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}