import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ message, size = "md" }: LoadingProps) {
  const sizeClass = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[size];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className={`${sizeClass} animate-spin text-brand-500 mb-3`} />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" />
        <p className="text-gray-500">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-200 skeleton" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 skeleton mb-2" />
          <div className="h-3 bg-gray-200 rounded w-16 skeleton" />
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-full skeleton mb-2" />
      <div className="h-3 bg-gray-200 rounded w-3/4 skeleton" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-40 skeleton" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 skeleton" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 skeleton mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24 skeleton" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-16 skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}