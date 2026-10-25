import { dateTime, money } from "../api";
import type { Campaign, Payment } from "../api";
import { Status } from "./Status";

export function CampaignTable({
  items,
  onEdit,
}: {
  items: Campaign[];
  onEdit: (campaign: Campaign) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Chien dich</th>
            <th>Trang thai</th>
            <th>Da nhan</th>
            <th>Muc tieu</th>
            <th>Thao tac</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>
                  <Status value={item.status} />
                </td>
                <td>{money(item.current)}</td>
                <td>{money(item.target)}</td>
                <td>
                  <button
                    className="link"
                    type="button"
                    onClick={() => onEdit(item)}
                  >
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>Chua co chien dich.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentTable({
  items,
  admin = false,
}: {
  items: Payment[];
  admin?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Chien dich</th>
            <th>Ma giao dich</th>
            {admin && <th>Donor</th>}
            <th>So tien</th>
            <th>Trang thai</th>
            <th>Thoi gian</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((item) => (
              <tr key={item.id}>
                <td>{item.donation.campaign.title}</td>
                <td className="mono">{item.reference}</td>
                {admin && <td>{item.donation.donor?.name ?? "-"}</td>}
                <td>{money(item.amount)}</td>
                <td>
                  <Status value={item.status} />
                </td>
                <td>{dateTime(item.paidAt ?? item.createdAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={admin ? 6 : 5}>Chua co giao dich.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
