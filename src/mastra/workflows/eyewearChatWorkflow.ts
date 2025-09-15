import { createWorkflow, createStep } from "../inngest";
import { z } from "zod";
import { eyewearAgent } from "../agents/eyewearAgent";
import { telegramTool } from "../tools/telegramTool";

// Шаг 1: Использование агента для генерации ответа
const useAgentStep = createStep({
  id: "use-agent",
  description: "Generate response using eyewear agent",
  inputSchema: z.object({
    message: z.string().describe("User message content"),
    threadId: z.string().describe("Thread ID for conversation context"),
    chatId: z.string().describe("Telegram chat ID"),
  }),
  outputSchema: z.object({
    response: z.string().describe("Agent's response"),
    chatId: z.string().describe("Telegram chat ID"),
  }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [EyewearWorkflow] Step 1: Using agent to generate response", {
      message: inputData.message,
      threadId: inputData.threadId,
    });

    try {
      // Вызываем агента для генерации ответа
      const { text } = await eyewearAgent.generateLegacy(
        [{ role: "user", content: inputData.message }],
        {
          resourceId: "telegram-bot",
          threadId: inputData.threadId,
          maxSteps: 5,
          onStepFinish: ({ text, toolCalls, toolResults }) => {
            logger?.info("🔄 [EyewearWorkflow] Agent step finished", { 
              text: text?.substring(0, 100) + "...", 
              toolCallsCount: toolCalls?.length,
              toolResultsCount: toolResults?.length 
            });
          },
        }
      );

      logger?.info("✅ [EyewearWorkflow] Agent response generated successfully", {
        response: text,
      });

      return {
        response: text,
        chatId: inputData.chatId,
      };
    } catch (error) {
      logger?.error("❌ [EyewearWorkflow] Error generating agent response", {
        error,
      });
      throw error;
    }
  },
});

// Шаг 2: Отправка ответа в Telegram
const sendReplyStep = createStep({
  id: "send-reply",
  description: "Send agent response to Telegram",
  inputSchema: z.object({
    response: z.string().describe("Response to send"),
    chatId: z.string().describe("Telegram chat ID"),
  }),
  outputSchema: z.object({
    sent: z.boolean().describe("Whether message was sent successfully"),
  }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [EyewearWorkflow] Step 2: Sending reply to Telegram", {
      response: inputData.response,
      chatId: inputData.chatId,
    });

    try {
      // Отправляем ответ в Telegram через HTTP API напрямую
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        logger?.error("❌ [EyewearWorkflow] TELEGRAM_BOT_TOKEN not found");
        throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
      }

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: inputData.chatId,
            text: inputData.response,
            parse_mode: "HTML",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        logger?.error("❌ [EyewearWorkflow] Failed to send Telegram message", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(`Failed to send Telegram message: ${response.statusText}`);
      }

      logger?.info("✅ [EyewearWorkflow] Reply sent successfully to Telegram");

      return { sent: true };
    } catch (error) {
      logger?.error("❌ [EyewearWorkflow] Error sending reply to Telegram", {
        error,
      });
      throw error;
    }
  },
});

// Создание workflow
export const eyewearChatWorkflow = createWorkflow({
  id: "eyewear-chat-workflow",
  description: "Telegram bot workflow for eyewear store customer support",
  inputSchema: z.object({
    message: z.string().describe("User message content"),
    threadId: z.string().describe("Thread ID for conversation context"),
    chatId: z.string().describe("Telegram chat ID"),
  }),
  outputSchema: z.object({
    sent: z.boolean().describe("Whether the response was sent successfully"),
  }),
})
  .then(useAgentStep)
  .then(sendReplyStep)
  .commit();