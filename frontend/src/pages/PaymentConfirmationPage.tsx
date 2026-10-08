import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RotateCcw,
} from "lucide-react";

import { api, dateTime, money } from "../api";

type PaymentState = "loading" | "success" | "failed" | "error";

interface PaymentReturnResponse {
  payment?: {
    id: string;
    amount: string | number;
    status: string;
  };
  processed?: boolean;
}

interface PaymentConfirmationPageProps {
  onBackHome: () => void;
  onHistory: () => void;
  onNotice: (message: string) => void;
  isLoggedIn: boolean;
}

const responseMessages: Record<string, string> = {
  "00": "Giao dich thanh cong.",
  "07": "Giao dich bi nghi ngo hoac dang duoc ngan hang xu ly.",
  "09": "The hoac tai khoan chua dang ky Internet Banking.",
  "10": "Thong tin xac thuc khong dung.",
  "11": "Da het han thanh toan.",
  "12": "The hoac tai khoan bi khoa.",
  "13": "Nhap sai mat khau OTP.",
  "24": "Ban da huy giao dich.",
  "51": "Tai khoan khong du so du.",
  "65": "Tai khoan vuot qua han muc giao dich.",
  "75": "Ngan hang dang bao tri.",
  "79": "Nhap sai mat khau thanh toan qua so lan quy dinh.",
  "99": "Giao dich khong thanh cong.",
};

function pickVnpayParams(search: string) {
  const currentParams = new URLSearchParams(search);
  const vnpayParams = new URLSearchParams();

  currentParams.forEach((value, key) => {
    if (key.startsWith("vnp_")) {
      vnpayParams.set(key, value);
    }
  });

  return vnpayParams;
}

function formatVnpayDate(value: string | null) {
  if (!value || !/^\d{14}$/.test(value)) {
    return "-";
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));

  return dateTime(new Date(year, month, day, hour, minute, second).toISOString());
}

export function PaymentConfirmationPage({
  onBackHome,
  onHistory,
  onNotice,
  isLoggedIn,
}: PaymentConfirmationPageProps) {
  const [payment, setPayment] = useState<PaymentReturnResponse["payment"]>();

  const vnpayParams = useMemo(() => pickVnpayParams(window.location.search), []);
  const reference = vnpayParams.get("vnp_TxnRef");
  const hasValidCallback = Boolean(reference && vnpayParams.has("vnp_SecureHash"));
  const [state, setState] = useState<PaymentState>(
    hasValidCallback ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    hasValidCallback
      ? "Dang xac nhan giao dich voi VNPay..."
      : "Khong tim thay du lieu thanh toan tu VNPay.",
  );
  const responseCode = vnpayParams.get("vnp_ResponseCode");
  const transactionNo = vnpayParams.get("vnp_TransactionNo");
  const bankCode = vnpayParams.get("vnp_BankCode");
  const payDate = vnpayParams.get("vnp_PayDate");
  const rawAmount = vnpayParams.get("vnp_Amount");
  const fallbackAmount = rawAmount ? Number(rawAmount) / 100 : 0;

  useEffect(() => {
    if (!hasValidCallback) {
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api<PaymentReturnResponse>(
          `/payment/vnpay/return?${vnpayParams.toString()}`,
        );
        const status = response.payment?.status.toUpperCase();
        setPayment(response.payment);

        if (status === "SUCCESS") {
          setState("success");
          setMessage("Cam on ban. Khoan ung ho da duoc ghi nhan.");
          return;
        }

        setState("failed");
        setMessage(
          responseMessages[responseCode ?? ""] ??
            "Giao dich chua hoan tat. Vui long thu lai hoac chon chien dich khac.",
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Khong the xac nhan giao dich.";
        setState("error");
        setMessage(errorMessage);
        onNotice(errorMessage);
      }
    };

    void verifyPayment();
  }, [hasValidCallback, onNotice, responseCode, vnpayParams]);

  const isSuccess = state === "success";
  const isLoading = state === "loading";
  const Icon = isLoading ? Clock3 : isSuccess ? CheckCircle2 : AlertCircle;
  const amount = payment?.amount ?? fallbackAmount;

  return (
    <section className="payment-confirmation">
      <div className={`payment-result ${state}`}>
        <div className="payment-icon" aria-hidden="true">
          <Icon size={34} />
        </div>
        <p className="eyebrow">Xac nhan thanh toan</p>
        <h1>
          {isLoading
            ? "Dang kiem tra giao dich"
            : isSuccess
              ? "Thanh toan thanh cong"
              : "Thanh toan chua thanh cong"}
        </h1>
        <p className="payment-message">{message}</p>

        <div className="payment-summary">
          <div>
            <span>So tien</span>
            <b>{money(amount || 0)}</b>
          </div>
          <div>
            <span>Ma giao dich</span>
            <b className="mono">{reference ?? "-"}</b>
          </div>
          <div>
            <span>Ma VNPay</span>
            <b className="mono">{transactionNo ?? "-"}</b>
          </div>
          <div>
            <span>Ngan hang</span>
            <b>{bankCode ?? "-"}</b>
          </div>
          <div>
            <span>Thoi gian</span>
            <b>{formatVnpayDate(payDate)}</b>
          </div>
          <div>
            <span>Trang thai</span>
            <b>{payment?.status ?? responseMessages[responseCode ?? ""] ?? "-"}</b>
          </div>
        </div>

        <div className="payment-actions">
          <button type="button" className="primary" onClick={onBackHome}>
            <ArrowLeft size={17} />
            Ve trang chien dich
          </button>
          {isLoggedIn && (
            <button type="button" className="secondary-action" onClick={onHistory}>
              <ReceiptText size={17} />
              Xem lich su donate
            </button>
          )}
          {!isSuccess && (
            <button type="button" className="secondary-action" onClick={onBackHome}>
              <RotateCcw size={17} />
              Thu lai
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
