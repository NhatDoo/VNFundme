import { useEffect, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Image as ImageIcon, Save, Trash2, Upload, X } from "lucide-react";
import {
  api,
  deleteCampaignImage,
  getCampaignImages,
  uploadCampaignImages,
} from "../api";
import type { Campaign, CampaignImage } from "../api";

interface NewCampaignImage {
  file: File;
  preview: string;
}

export function EditCampaignModal({
  campaign,
  token,
  onClose,
  onUpdated,
  onNotice,
}: {
  campaign: Campaign;
  token: string;
  onClose: () => void;
  onUpdated: () => void;
  onNotice: (message: string) => void;
}) {
  const [existingImages, setExistingImages] = useState<CampaignImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewCampaignImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getCampaignImages(campaign.id)
      .then((images) => {
        if (active) setExistingImages(images);
      })
      .catch((error: unknown) => {
        onNotice(
          error instanceof Error ? error.message : "Không thể tải hình ảnh.",
        );
      })
      .finally(() => {
        if (active) setLoadingImages(false);
      });
    return () => {
      active = false;
    };
  }, [campaign.id, onNotice]);

  const remainingImages =
    existingImages.length -
    removedImageIds.length +
    newImages.length;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const remainingSlots = 5 - remainingImages;
    const filesToAdd = files.slice(0, remainingSlots);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const preview = reader.result;
        if (typeof preview === "string") {
          setNewImages((previous) => [...previous, { file, preview }]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (files.length > remainingSlots) {
      onNotice("Chiến dịch chỉ được có tối đa 5 ảnh.");
    }
    event.target.value = "";
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);

    try {
      await api(`/campaign/${campaign.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          target: Number(form.get("target")),
        }),
      });

      for (const imageId of removedImageIds) {
        await deleteCampaignImage(campaign.id, imageId, token);
      }
      if (newImages.length > 0) {
        await uploadCampaignImages(
          campaign.id,
          newImages.map(({ file }) => file),
          token,
        );
      }

      onNotice("Đã cập nhật chiến dịch.");
      onUpdated();
    } catch (error) {
      onNotice(
        error instanceof Error
          ? `Không thể hoàn tất cập nhật: ${error.message}`
          : "Không thể cập nhật chiến dịch.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal">
      <form onSubmit={(event) => void submit(event)}>
        <button className="close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">ORGANIZER</p>
        <h2>Chỉnh sửa chiến dịch</h2>

        <label>
          Tiêu đề
          <input name="title" defaultValue={campaign.title} minLength={5} required />
        </label>

        <label>
          Nội dung
          <textarea
            name="description"
            defaultValue={campaign.description}
            minLength={20}
            rows={5}
            required
          />
        </label>

        <label>
          Mục tiêu (VND)
          <input
            name="target"
            type="number"
            defaultValue={Number(campaign.target)}
            min="1"
            required
          />
        </label>

        <label className="image-upload-label">
          Hình ảnh chiến dịch (tối đa 5 ảnh)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={loadingImages || saving || remainingImages >= 5}
          />
          <div className="image-upload-hint">
            <ImageIcon size={24} />
            <span>
              Thêm ảnh · {remainingImages}/5
            </span>
          </div>
        </label>

        {(existingImages.length > 0 || newImages.length > 0) && (
          <div className="image-previews">
            {existingImages.map((image) => {
              const removed = removedImageIds.includes(image.id);
              return (
                <div
                  key={image.id}
                  className="image-preview-item"
                  style={{ opacity: removed ? 0.45 : 1 }}
                >
                  <img src={image.url} alt="" />
                  <button
                    type="button"
                    className="remove-image"
                    aria-label={removed ? "Khôi phục ảnh" : "Xóa ảnh"}
                    onClick={() =>
                      setRemovedImageIds((ids) =>
                        removed
                          ? ids.filter((id) => id !== image.id)
                          : [...ids, image.id],
                      )
                    }
                    disabled={saving}
                  >
                    {removed ? <Upload size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>
              );
            })}
            {newImages.map((image, index) => (
              <div key={`${image.file.name}-${index}`} className="image-preview-item">
                <img src={image.preview} alt={image.file.name} />
                <button
                  type="button"
                  className="remove-image"
                  aria-label="Bỏ ảnh mới"
                  onClick={() =>
                    setNewImages((previous) =>
                      previous.filter((_, imageIndex) => imageIndex !== index),
                    )
                  }
                  disabled={saving}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className="primary donate"
          type="submit"
          disabled={saving || loadingImages}
        >
          <Save size={16} />
          {loadingImages
            ? "Đang tải ảnh..."
            : saving
              ? "Đang lưu..."
              : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
}
