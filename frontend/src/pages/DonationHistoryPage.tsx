import { useEffect, useState } from "react";
import { WalletCards } from "lucide-react";

import { api } from "../api";
import { PaymentTable } from "../components/Tables";
import { SectionHeader } from "../components/SectionHeader";
import type { Payment } from "../api";

interface DonationHistoryPageProps {
  token: string;
  onNotice: (message: string) => void;
}

export function DonationHistoryPage({
  token,
  onNotice,
}: DonationHistoryPageProps) {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    void api<{ items: Payment[] }>("/payment/history?limit=50", { token })
      .then((response) => setPayments(response.items))
      .catch((error: Error) => onNotice(error.message));
  }, [token, onNotice]);

  return (
    <section className="workspace">
      <SectionHeader
        eyebrow="TÀI KHOẢN CÁ NHÂN"
        title="Lịch sử donate"
        action={<WalletCards />}
      />
      <PaymentTable items={payments} />
    </section>
  );
}
