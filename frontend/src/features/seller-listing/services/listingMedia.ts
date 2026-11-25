import type { ListingMediaSlot } from '../types/createListing';

export const LISTING_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const LISTING_IMAGE_ACCEPT = LISTING_IMAGE_TYPES.join(',');
export const MAX_LISTING_IMAGES = 9;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateListingImage(file: Pick<File, 'size' | 'type'>): string | null {
  if (!file.size) return 'Ảnh không được để trống.';
  if (file.size > MAX_LISTING_IMAGE_BYTES) return 'Mỗi ảnh tối đa 5 MB.';
  if (!LISTING_IMAGE_TYPES.includes(file.type.toLowerCase())) return 'Chỉ hỗ trợ ảnh JPEG, PNG, WebP, GIF.';
  return null;
}

/** Upload does not attach media to the product. Cache each success before the next request. */
export async function persistListingImages(
  productId: string,
  media: ListingMediaSlot[],
  uploaded: Map<string, string>,
  upload: (productId: string, file: File) => Promise<string>,
  attach: (images: { imageUrl: string; primary: boolean }[]) => Promise<unknown>,
): Promise<void> {
  for (const slot of media) {
    if (!uploaded.has(slot.id)) {
      if (!slot.file) throw new Error('Không tìm thấy file ảnh đã chọn. Vui lòng chọn lại ảnh.');
      const error = validateListingImage(slot.file);
      if (error) throw new Error(error);
      uploaded.set(slot.id, await upload(productId, slot.file));
    }
  }
  // PUT replaces the entire image list and is safe to repeat after a lost response.
  await attach(media.map((slot, index) => ({ imageUrl: uploaded.get(slot.id)!, primary: index === 0 })));
}
