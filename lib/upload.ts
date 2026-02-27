export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

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
const ARCHIVE_TYPES = [
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/x-tar",
  "application/gzip",
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

const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES, ...ARCHIVE_TYPES, ...AUDIO_TYPES, ...VIDEO_TYPES];

export function isAllowedType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
}
