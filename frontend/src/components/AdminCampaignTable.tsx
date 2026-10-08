import { dateTime, money } from "../api";
import type { AdminCampaign } from "../api";
import { Status } from "./Status";

interface AdminCampaignTableProps {
  campaigns: AdminCampaign[];
  onApprove: (campaign: AdminCampaign) => void;
  onReject: (campaign: AdminCampaign) => void;
}

export function AdminCampaignTable({
  campaigns,
  onApprove,
  onReject,
}: AdminCampaignTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tieu de</th>
            <th>Nguyen tao</th>
            <th>Danh muc</th>
            <th>Muc tieu</th>
            <th>Trang thai</th>
            <th>Ngay tao</th>
            <th>Thao tac</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.length ? (
            campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>
                  <div className="campaign-title">
                    <span className="campaign-title-text">{campaign.title}</span>
                    <span className="campaign-meta">
                      {money(campaign.current)} / {money(campaign.target)} &middot; {campaign._count.donations} donate
                    </span>
                  </div>
                </td>
                <td>{campaign.creator.name}</td>
                <td>{campaign.category?.name ?? "—"}</td>
                <td>{money(campaign.target)}</td>
                <td>
                  <Status value={campaign.status} />
                </td>
                <td>{dateTime(campaign.createdAt)}</td>
                <td>
                  {campaign.status === "PENDING_REVIEW" ? (
                    <div className="campaign-actions">
                      <button
                        className="primary small"
                        type="button"
                        onClick={() => onApprove(campaign)}
                      >
                        Duyet
                      </button>
                      <button
                        className="danger small"
                        type="button"
                        onClick={() => onReject(campaign)}
                      >
                        Tu choi
                      </button>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>Chua co chien dich nao.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}