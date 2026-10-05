import db from "@/lib/db";
import { decryptChatMessage } from "@/lib/crypto";
import { getChatRetentionInfo } from "@/lib/chatRetention";

export interface CreateMessageInput {
  conversationId: string;
  userId: string;
  userRole?: string;
  userDisplayName?: string;
  content: string | object;
}

export interface GetMessagesOptions {
  conversationId: string;
  userId: string;
  userRole?: string;
  since?: string | null;
  limit?: number;
  cursor?: string | null;
}

export interface DeleteMessageInput {
  conversationId: string;
  messageId: string;
  userId: string;
  deleteType: "everyone" | "me";
}

/**
 * Backend ChatService:
 * Core server-side business logic for messaging, real-time delta sync,
 * participant validation, and non-blocking background notification dispatch.
 */
export const ChatService = {
  /**
   * Retrieves messages for a conversation.
   * If `since` is provided, performs an ultra-fast delta fetch (only messages newer than `since`).
   */
  async getMessages({ conversationId, userId, userRole, since, limit, cursor }: GetMessagesOptions) {
    // 1. Fast incremental delta check
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        const deltaMessages = await db.message.findMany({
          where: {
            conversationId,
            createdAt: { gt: sinceDate },
          },
          include: {
            sender: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    isVerified: true,
                    verificationStatus: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        // Background read-status update for incoming messages
        const unreadToUpdate: { id: string; readBy: string }[] = [];
        for (const msg of deltaMessages) {
          try {
            const readArray: string[] = JSON.parse(msg.readBy || "[]");
            if (!readArray.includes(userId)) {
              readArray.push(userId);
              const updatedJson = JSON.stringify(readArray);
              msg.readBy = updatedJson;
              unreadToUpdate.push({ id: msg.id, readBy: updatedJson });
            }
          } catch {
            // ignore JSON error
          }
        }

        if (unreadToUpdate.length > 0) {
          Promise.all(
            unreadToUpdate.map((item) =>
              db.message.update({
                where: { id: item.id },
                data: { readBy: item.readBy },
              }).catch(() => {})
            )
          ).catch(() => {});
        }

        return {
          isDelta: true,
          messages: deltaMessages,
        };
      }
    }

    // 2. Full initial conversation & messages load
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        activity: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        displayName: true,
                        avatarUrl: true,
                        bio: true,
                        isVerified: true,
                        verificationStatus: true,
                      },
                    },
                  },
                },
              },
            },
            organizer: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    bio: true,
                    isVerified: true,
                    verificationStatus: true,
                  },
                },
              },
            },
          },
        },
        travelPlan: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        displayName: true,
                        avatarUrl: true,
                        bio: true,
                        isVerified: true,
                        verificationStatus: true,
                      },
                    },
                  },
                },
              },
            },
            organizer: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    bio: true,
                    isVerified: true,
                    verificationStatus: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return { error: "Conversation not found", status: 404 };
    }

    // Retention check
    const retentionInfo = getChatRetentionInfo(conversation);
    if (retentionInfo.isExpired) {
      await db.conversation.delete({ where: { id: conversationId } }).catch(() => {});
      return { error: "Conversation expired and deleted", status: 410 };
    }

    // Participant membership check
    const participants = conversation.activity
      ? conversation.activity.participants
      : conversation.travelPlan?.participants || [];

    const isMember = participants.some((p) => p.userId === userId);
    if (!isMember && userRole !== "ADMIN") {
      return { error: "Access denied", status: 403 };
    }

    // Load conversation messages with pagination (default latest 50)
    const fetchLimit = limit ? Math.min(Math.max(limit, 1), 100) : 50;
    const messagesQuery: any = {
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                isVerified: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
      take: fetchLimit,
      orderBy: { createdAt: "desc" },
    };

    if (cursor) {
      messagesQuery.cursor = { id: cursor };
      messagesQuery.skip = 1;
    }

    const rawMessages = await db.message.findMany(messagesQuery);
    // Reverse to chronological order (asc) so client renders in natural sequence
    const messages = rawMessages.reverse();

    // Mark unread in background
    const unreadMessagesToUpdate: { id: string; readBy: string }[] = [];
    for (const msg of messages) {
      try {
        const readArray: string[] = JSON.parse(msg.readBy || "[]");
        if (!readArray.includes(userId)) {
          readArray.push(userId);
          const updatedJson = JSON.stringify(readArray);
          msg.readBy = updatedJson;
          unreadMessagesToUpdate.push({ id: msg.id, readBy: updatedJson });
        }
      } catch {
        // ignore
      }
    }

    if (unreadMessagesToUpdate.length > 0) {
      Promise.all(
        unreadMessagesToUpdate.map((item) =>
          db.message.update({
            where: { id: item.id },
            data: { readBy: item.readBy },
          }).catch(() => {})
        )
      ).catch(() => {});
    }

    return {
      isDelta: false,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        type: conversation.type,
        activity: conversation.activity,
        travelPlan: conversation.travelPlan,
        retentionInfo,
      },
      messages,
    };
  },

  /**
   * Fast message creation:
   * Saves message to MongoDB Atlas and returns immediately in split seconds.
   * Background notification dispatch and conversation touch occur asynchronously.
   */
  async createMessage({
    conversationId,
    userId,
    userRole,
    userDisplayName,
    content,
  }: CreateMessageInput) {
    if (!content) {
      return { error: "Message content cannot be empty", status: 400 };
    }

    const serializedContent =
      typeof content === "object" ? JSON.stringify(content) : (content as string).trim();

    // Fast conversation lookup with only participant user IDs
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        title: true,
        activity: {
          select: {
            id: true,
            status: true,
            date: true,
            participants: { select: { userId: true } },
          },
        },
        travelPlan: {
          select: {
            id: true,
            status: true,
            endDate: true,
            participants: { select: { userId: true } },
          },
        },
      },
    });

    if (!conversation) {
      return { error: "Conversation not found", status: 404 };
    }

    // Verify retention validity
    const retentionInfo = getChatRetentionInfo(conversation as any);
    if (retentionInfo.isExpired) {
      await db.conversation.delete({ where: { id: conversationId } }).catch(() => {});
      return { error: "Conversation expired and deleted", status: 410 };
    }

    // Membership verification
    const participants = conversation.activity
      ? conversation.activity.participants
      : conversation.travelPlan?.participants || [];

    const isMember = participants.some((p) => p.userId === userId);
    if (!isMember && userRole !== "ADMIN") {
      return { error: "Access denied. Only accepted participants can send messages.", status: 403 };
    }

    // ⚡ Fast DB insert
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: serializedContent,
        readBy: JSON.stringify([userId]),
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                isVerified: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
    });

    // ⚡ Non-blocking background operations (Conversation touch & Participant notifications)
    // Run asynchronously without delaying client HTTP response!
    (async () => {
      try {
        await db.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }).catch(() => {});

        const otherParticipants = participants.filter((p) => p.userId !== userId);
        if (otherParticipants.length > 0) {
          const senderName = userDisplayName || "Companion";
          let previewSnippet = "Shared a message";

          if (typeof content === "object") {
            previewSnippet = (content as any)?.text || "Shared an attachment";
          } else if (typeof content === "string") {
            try {
              const decrypted = await decryptChatMessage(content, conversationId);
              try {
                const parsed = JSON.parse(decrypted);
                previewSnippet = parsed?.text || decrypted;
              } catch {
                previewSnippet = decrypted;
              }
            } catch {
              previewSnippet = (content as string).slice(0, 80);
            }
          }

          await Promise.all(
            otherParticipants.map((p) =>
              db.notification.create({
                data: {
                  userId: p.userId,
                  type: "NEW_MESSAGE",
                  title: `New message in ${conversation.title}`,
                  body: `${senderName}: ${previewSnippet.slice(0, 100)}`,
                  actionUrl: `/chats/${conversation.id}`,
                },
              }).catch(() => {})
            )
          );
        }
      } catch (bgErr) {
        console.warn("Background notification dispatch warning:", bgErr);
      }
    })();

    return { message, status: 201 };
  },

  /**
   * Toggles message emoji reactions.
   */
  async toggleReaction(conversationId: string, messageId: string, userId: string, emoji: string) {
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                isVerified: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
    });

    if (!message || message.conversationId !== conversationId) {
      return { error: "Message not found in this conversation", status: 404 };
    }

    let parsedContent: any = {};
    let isEncrypted = false;
    let plainText = message.content;

    try {
      if (plainText.startsWith("e2ee:")) {
        isEncrypted = true;
        plainText = await decryptChatMessage(message.content, conversationId);
      }
      parsedContent = JSON.parse(plainText);
    } catch {
      parsedContent = { text: plainText };
    }

    const reactions = parsedContent.reactions || {};
    const userList = reactions[emoji] || [];

    if (userList.includes(userId)) {
      reactions[emoji] = userList.filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...userList, userId];
    }

    parsedContent.reactions = reactions;
    let updatedContent = JSON.stringify(parsedContent);

    if (isEncrypted) {
      const { encryptChatMessage } = await import("@/lib/crypto");
      updatedContent = await encryptChatMessage(updatedContent, conversationId);
    }

    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { content: updatedContent },
    });

    return { success: true, reactions, updatedMessage };
  },

  /**
   * Deletes a message:
   * - "everyone": Available only to sender within 15 minutes of sending.
   * - "me": Hides message for the requesting user.
   */
  async deleteMessage({
    conversationId,
    messageId,
    userId,
    deleteType,
  }: DeleteMessageInput) {
    const message = await db.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.conversationId !== conversationId) {
      return { error: "Message not found in this conversation", status: 404 };
    }

    if (deleteType === "everyone") {
      // 1. Verify sender
      if (message.senderId !== userId) {
        return { error: "You can only delete your own messages for everyone", status: 403 };
      }

      // 2. Verify 15-minute time window
      const messageAgeMs = Date.now() - new Date(message.createdAt).getTime();
      const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
      if (messageAgeMs > FIFTEEN_MINUTES_MS) {
        return {
          error: "Delete for everyone is only available within 15 minutes of sending",
          status: 400,
        };
      }

      // 3. Mark message as deleted for everyone
      const deletedPayload = {
        isDeleted: true,
        deletedForEveryone: true,
        deletedAt: new Date().toISOString(),
        text: "This message was deleted",
      };

      let newContent = JSON.stringify(deletedPayload);
      if (message.content.startsWith("e2ee:")) {
        const { encryptChatMessage } = await import("@/lib/crypto");
        newContent = await encryptChatMessage(newContent, conversationId);
      }

      const updatedMessage = await db.message.update({
        where: { id: messageId },
        data: { content: newContent },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  isVerified: true,
                  verificationStatus: true,
                },
              },
            },
          },
        },
      });

      return { success: true, message: updatedMessage };
    } else {
      // Delete for me: record user in deletedFor list
      let parsedContent: any = {};
      let isEncrypted = false;
      let plainText = message.content;

      try {
        if (plainText.startsWith("e2ee:")) {
          isEncrypted = true;
          plainText = await decryptChatMessage(message.content, conversationId);
        }
        parsedContent = JSON.parse(plainText);
      } catch {
        parsedContent = { text: plainText };
      }

      const deletedForList: string[] = Array.isArray(parsedContent.deletedFor)
        ? parsedContent.deletedFor
        : [];

      if (!deletedForList.includes(userId)) {
        deletedForList.push(userId);
      }

      parsedContent.deletedFor = deletedForList;
      let newContent = JSON.stringify(parsedContent);

      if (isEncrypted) {
        const { encryptChatMessage } = await import("@/lib/crypto");
        newContent = await encryptChatMessage(newContent, conversationId);
      }

      const updatedMessage = await db.message.update({
        where: { id: messageId },
        data: { content: newContent },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  isVerified: true,
                  verificationStatus: true,
                },
              },
            },
          },
        },
      });

      return { success: true, message: updatedMessage, deletedForMe: true };
    }
  },
};

