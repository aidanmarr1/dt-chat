export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const IMAGE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
];
const VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES, ...AUDIO_TYPES, ...VIDEO_TYPES];

export function isAllowedType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
}
