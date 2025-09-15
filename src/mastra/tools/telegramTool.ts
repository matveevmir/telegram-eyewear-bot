import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

const sendTelegramMessage = async ({
  message,
  chatId,
  logger,
}: {
  message: string;
  chatId: string;
  logger?: IMastraLogger;
}) => {
  logger?.info("🔧 [TelegramTool] Starting message send", { message, chatId });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    logger?.error("❌ [TelegramTool] TELEGRAM_BOT_TOKEN not found");
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
  }

  try {
    logger?.info("📝 [TelegramTool] Sending message to Telegram API...");
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      logger?.error("❌ [TelegramTool] Failed to send message", {
        status: response.status,
        statusText: response.statusText,
        responseData,
      });
      throw new Error(`Failed to send Telegram message: ${response.statusText}`);
    }

    logger?.info("✅ [TelegramTool] Message sent successfully", { responseData });
    return {
      success: true,
      messageId: responseData.result?.message_id,
      chatId,
    };
  } catch (error) {
    logger?.error("❌ [TelegramTool] Error sending message", { error });
    throw error;
  }
};

export const telegramTool = createTool({
  id: "send-telegram-message",
  description: "Sends a message to a Telegram chat using the Telegram Bot API",
  inputSchema: z.object({
    message: z.string().describe("The message text to send"),
    chatId: z.string().describe("The Telegram chat ID to send the message to"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.number().optional(),
    chatId: z.string(),
  }),
  execute: async ({ context: { message, chatId }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [TelegramTool] Executing send message tool", {
      message,
      chatId,
    });
    
    return await sendTelegramMessage({ message, chatId, logger });
  },
});