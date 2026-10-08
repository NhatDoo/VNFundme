import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { X, CheckCircle, XCircle } from "lucide-react";
import type { AdminCampaign } from "../api";

interface ReviewCampaignModalProps {
  campaign: AdminCampaign | null;
  mode: "approve" | "reject";
  onClose: () => void;
  onSubmit: (campaignId: string, reviewNote: string | undefined) => Promise<void>;
  busy: boolean;
}

export function ReviewCampaignModal({
  campaign,
  mode,
  onClose,
  onSubmit,
  busy,
}: ReviewCampaignModalProps) {
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!campaign) return null;

  const isApprove = mode === "approve";
  const title = isApprove ? "Duyet chien dich" : "Tu choi chien dich";
  const buttonLabel = isApprove ? "Duyet" : "Tu choi";
  const buttonClass = isApprove ? "primary" : "danger";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(
        campaign.id,
        isApprove ? (reviewNote.trim() || undefined) : reviewNote.trim(),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loi xu ly.");
    }
  };

  return (
    <div className="modal">
      <form onSubmit={(event) => void submit(event)}>
        <button className="close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">ADMIN</p>
        <h2>
          {isApprove ? <CheckCircle size={22} /> : <XCircle size={22} />}
          {title}
        </h2>

        <div className="review-campaign-info">
          <p><strong>Tieu de:</strong> {campaign.title}</p>
          <p><strong>Nguyen tao:</strong> {campaign.creator.name}</p>
          <p><strong>Muc tieu:</strong> {campaign.target}</p>
        </div>

        {isApprove ? (
          <label>
            Ghi chu (tuy chon)
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReviewNote(e.target.value)}
              placeholder="Nhac nhieu cho nguyen tao..."
            />
          </label>
        ) : (
          <label>
            Ly do tu choi *
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReviewNote(e.target.value)}
              placeholder="Nhap ly do tu choi..."
              required
            />
          </label>
        )}

        {error && <p className="error-text">{error}</p>}

        <button className={buttonClass} type="submit" disabled={busy}>
          {busy ? "Dang xu ly..." : buttonLabel}
        </button>
      </form>
    </div>
  );
}