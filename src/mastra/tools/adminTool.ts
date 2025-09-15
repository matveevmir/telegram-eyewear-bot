import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

// ID администратора (ваш Telegram ID)
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

export const adminTool = createTool({
  id: "admin-tool",
  description: "Инструмент для управления ботом администратором",
  inputSchema: z.object({
    userId: z.string().describe("ID пользователя в Telegram"),
    message: z.string().describe("Сообщение от пользователя"),
    isAdminCommand: z.boolean().optional().describe("Это команда от администратора"),
  }),
  outputSchema: z.object({
    shouldUseAI: z.boolean(),
    adminNotification: z.string().optional(),
    response: z.string().optional(),
  }),
  execute: async ({ context: { userId, message, isAdminCommand }, mastra }) => {
    const logger = mastra?.getLogger();
    
    // Если это сообщение от админа
    if (userId === ADMIN_ID) {
      logger?.info("📱 [AdminTool] Message from admin", { message });
      
      // Команды управления ботом
      if (message.startsWith('/bot_auto_on')) {
        // Включить автоответы
        return {
          shouldUseAI: true,
          response: "✅ Автоответы ИИ включены"
        };
      }
      
      if (message.startsWith('/bot_auto_off')) {
        // Выключить автоответы
        return {
          shouldUseAI: false,
          response: "❌ Автоответы ИИ выключены. Отвечайте вручную."
        };
      }
    }
    
    // Обычное сообщение от клиента
    logger?.info("💬 [AdminTool] Customer message", { userId, message });
    
    return {
      shouldUseAI: true, // По умолчанию ИИ отвечает
      adminNotification: `💬 Новое сообщение от клиента ${userId}: "${message.substring(0, 100)}..."\n\nОтправьте /bot_manual для ручного ответа`
    };
  },
});