export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarId?: string | null;
}

export interface ReplyInfo {
  id: string;
  content: string;
  displayName: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  displayName: string;
  avatarId?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  filePath?: string | null;
  replyToId?: string | null;
  replyContent?: string | null;
  replyDisplayName?: string | null;
  reactions?: MessageReaction[];
  editedAt?: string | null;
  isDeleted?: boolean;
  isPinned?: boolean;
  pinnedByName?: string | null;
}

export interface OnlineUser {
  id: string;
  displayName: string;
  avatarId?: string | null;
}

export interface MessagesResponse {
  messages: Message[];
  onlineCount: number;
  onlineUsers: OnlineUser[];
  typingUsers: string[];
}
