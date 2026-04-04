const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF images are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Image must be smaller than 5MB.";
  }
  return null;
};
