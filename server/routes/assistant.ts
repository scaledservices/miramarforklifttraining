import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { getAssistantConfig, handleDemoMessage, proxyToOpenClaw, isOpenClawConnected, isTranscriptsEnabled, stripUserInputForProxy, redactForTranscript, createSupportTicket, type UserContext, type ChatMessage } from "../assistant";
import { assistantLimiter } from "./middleware";

export function registerAssistantRoutes(app: Express) {
app.get("/api/assistant/config", (_req: Request, res: Response) => {
  return res.json(getAssistantConfig());
});

app.post("/api/assistant/ticket", assistantLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, message, conversationSummary } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid field types" });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: "Message too long" });
    }

    const result = await createSupportTicket(
      name.slice(0, 200),
      email.slice(0, 200),
      message.slice(0, 5000),
      typeof conversationSummary === "string" ? conversationSummary.slice(0, 2000) : undefined
    );

    return res.json({ success: true, message: result.content });
  } catch (error) {
    console.error("[Assistant] Ticket creation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/assistant/message", assistantLimiter, async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, pageContext } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message too long (max 2000 characters)" });
    }
    if (message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const sanitizedMessage = stripUserInputForProxy(message);
    const history: ChatMessage[] = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-10).map((m: any) => ({
          role: m.role === "assistant" ? "assistant" as const : "user" as const,
          content: typeof m.content === "string" ? m.content.slice(0, 2000) : "",
        }))
      : [];

    let user: User | undefined;
    if (req.session?.userId) {
      user = await storage.getUser(req.session.userId);
    }

    const userContext: UserContext = {
      userId: user?.id,
      role: user?.role || "anonymous",
      firstName: user?.name?.split(" ")[0],
      isAuthenticated: !!user,
      page: typeof pageContext === "string" ? pageContext : "/support",
      locale: "en",
    };

    const sessionId = req.sessionID || req.ip || "anonymous";
    let conversation = await storage.getSupportConversationBySessionId(sessionId);
    if (!conversation) {
      conversation = await storage.createSupportConversation({
        userId: user?.id ?? null,
        sessionId,
        messageCount: 0,
        escalated: false,
      });
    }

    await storage.incrementSupportMessageCount(conversation.id);

    if (isTranscriptsEnabled() && user) {
      const { redacted: redactedContent, wasRedacted } = redactForTranscript(sanitizedMessage);
      await storage.createSupportMessage({
        conversationId: conversation.id,
        role: "user",
        content: redactedContent,
        redacted: wasRedacted,
      });
    }

    await storage.createAuditLog({
      actorUserId: user?.id,
      action: "assistant_message",
      entity: "support_conversation",
      entityId: String(conversation.id),
      metadata: { page: userContext.page, messageLength: sanitizedMessage.length },
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const updatedConversation = await storage.getSupportConversation(conversation.id);
    if (updatedConversation && updatedConversation.messageCount > 50) {
      res.write(`event: token\ndata: ${JSON.stringify("You've sent quite a few messages in this session. For the best assistance, I'd recommend reaching out to our team directly through the contact form on this page. They'll be able to give you personalized help!")}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({})}\n\n`);
      res.end();
      return;
    }

    if (isOpenClawConnected()) {
      const messages: ChatMessage[] = [
        ...history.map(m => ({
          ...m,
          content: m.role === "user" ? `<user_message>${m.content}</user_message>` : m.content,
        })),
        { role: "user" as const, content: `<user_message>${sanitizedMessage}</user_message>` },
      ];
      await proxyToOpenClaw(messages, userContext, sessionId, res);
    } else {
      await handleDemoMessage(sanitizedMessage, history, userContext, res);
    }
  } catch (error) {
    console.error("[Assistant] Message error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
    try {
      res.write(`event: token\ndata: ${JSON.stringify("Sorry, something went wrong. Please try again or use the contact form.")}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({})}\n\n`);
      res.end();
    } catch (_) {}
  }
});
}
