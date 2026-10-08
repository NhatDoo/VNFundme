import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { api, apiUpload } from "../api";

export function CreateCampaignModal({
  token,
  onClose,
  onCreated,
  onNotice,
}: {
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
  onNotice: (message: string) => void;
}) {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const remaining = 5 - images.length;
    const filesToAdd = files.slice(0, remaining);

    setImages((prev) => [...prev, ...filesToAdd]);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (files.length > remaining) {
      onNotice("Chỉ thêm được tối đa 5 ảnh.");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setUploading(true);

    try {
      // Create campaign first
      const campaign = await api<{
        id: string;
      } & { [key: string]: any } >("/campaign", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          target: Number(form.get("target")),
        }),
      });

      // Upload images if any
      if (images.length > 0 && campaign.id) {
        const formData = new FormData();
        images.forEach((image) => {
          formData.append("images", image);
        });

        await apiUpload(`/campaign/${campaign.id}/images`, formData, token);
      }

      onNotice("Đã gửi chiến dịch để duyệt.");
      onCreated();
    } catch (error) {
      onNotice(
        error instanceof Error ? error.message : "Không thể tạo chiến dịch.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal">
      <form onSubmit={(event) => void submit(event)}>
        <button className="close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">ORGANIZER</p>
        <h2>Tạo chiến dịch</h2>

        <label>
          Tiêu đề
          <input name="title" minLength={5} required />
        </label>

        <label>
          Nội dung
          <textarea name="description" minLength={20} rows={5} required />
        </label>

        <label>
          Mục tiêu (VND)
          <input name="target" type="number" min="1" required />
        </label>

        <label className="image-upload-label">
          Ảnh minh họa chiến dịch (tối đa 5 ảnh)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={images.length >= 5}
          />
          <div className="image-upload-hint">
            <ImageIcon size={24} />
            <span>Chọn ảnh (jpg, png, gif) - {images.length}/5</span>
          </div>
        </label>

        {imagePreviews.length > 0 && (
          <div className="image-previews">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="image-preview-item">
                <img src={preview} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                  disabled={uploading}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="primary donate" type="submit" disabled={uploading}>
          <Upload size={16} />
          {uploading ? "Đang gửi..." : "Gửi duyệt"}
        </button>
      </form>
    </div>
  );
}