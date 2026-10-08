import { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";

import { api, money, getCampaignImages } from "../api";
import { Progress } from "../components/Progress";
import type { Campaign, CampaignImage } from "../api";

interface CampaignDetailPageProps {
  campaign: Campaign | null;
  token: string | null;
  onBack: () => void;
  onAuth: () => void;
  onNotice: (message: string) => void;
}

export function CampaignDetailPage({
  campaign,
  token,
  onBack,
  onAuth,
  onNotice,
}: CampaignDetailPageProps) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<CampaignImage[]>([]);

  useEffect(() => {
    if (campaign?.id) {
      getCampaignImages(campaign.id)
        .then(setImages)
        .catch(() => {
          // Silently fail - images are optional
        });
    }
  }, [campaign?.id]);

  if (!campaign) {
    return <div className="empty-state">Đang tải chiến dịch...</div>;
  }

  const createPayment = async () => {
    if (!token) {
      onAuth();
      return;
    }

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount < 10000) {
      onNotice("Vui lòng nhập số tiền từ 10.000 VND trở lên.");
      return;
    }

    setBusy(true);
    try {
      const response = await api<{ paymentUrl: string }>(
        "/payment/vnpay/create",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            campaignId: campaign.id,
            amount: parsedAmount,
          }),
        },
      );
      window.location.assign(response.paymentUrl);
    } catch (error) {
      onNotice(
        error instanceof Error ? error.message : "Không thể tạo thanh toán.",
      );
    } finally {
      setBusy(false);
    }
  };

  const quickAmounts = [
    { label: "10k", value: "10000" },
    { label: "50k", value: "50000" },
    { label: "100k", value: "100000" },
    { label: "200k", value: "200000" },
    { label: "500k", value: "500000" },
  ];

  const coverImage =
    images.length > 0 ? images[0].url : null;

  return (
    <>
      <button className="back" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Tất cả chiến dịch
      </button>
      <section className="detail">
        <article>
          <p className="eyebrow">{campaign.category?.name ?? "CỘNG ĐỒNG"}</p>
          <h1>{campaign.title}</h1>
          <p className="lead">{campaign.description}</p>

          <div className="wide-visual">
          {coverImage ? (
            <img src={coverImage} alt="Minh họa chiến dịch" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-mint flex items-center justify-center">
              <Heart size={64} className="text-brand-300" />
            </div>
          )}
        </div>

          {images.length > 0 && (
            <div className="campaign-images-gallery">
              {images.map((image) => (
                <div key={image.id} className="campaign-image-item">
                  <img src={image.url} alt={image.objectName} />
                </div>
              ))}
            </div>
          )}

          <p className="muted">
            Người tổ chức: {campaign.creator?.name ?? "VNFundme"}
          </p>
        </article>
        <aside>
          <b>{money(campaign.current)}</b>
          <span>trên {money(campaign.target)}</span>
          <Progress
            value={
              campaign.progressPercent ??
              Math.min(
                (Number(campaign.current) / Number(campaign.target)) * 100,
                100,
              )
            }
          />
          <label>
            Số tiền donate
            <input
              type="number"
              min="10000"
              step="1000"
              placeholder="Nhập số tiền (tối thiểu 10.000 VND)"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <div className="quick">
            {quickAmounts.map((q) => (
              <button
                key={q.value}
                type="button"
                className="quick-btn"
                onClick={() => setAmount(q.value)}
                disabled={busy}
              >
                {q.label}
              </button>
            ))}
          </div>
          <button
            className="primary donate"
            type="button"
            disabled={busy}
            onClick={createPayment}
          >
            <Heart size={17} fill="currentColor" />
            {busy ? "Đang tạo giao dịch..." : "Quyên góp qua VNPay"}
          </button>
        </aside>
      </section>
    </>
  );
}