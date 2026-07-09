import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, Mail, MapPin, Clock, Send, Bot, User,
  MessageCircle, DollarSign, ShieldCheck, HelpCircle, UserCheck,
  AlertTriangle, CheckCircle2, XCircle,
  ArrowRight, RefreshCw, Info,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatUsPhone, normalizeEmail, capitalizeWords } from "@/lib/inputFormat";

interface AssistantAction {
  type: "navigate" | "create_ticket" | "verify_cert" | "course_info";
  url?: string;
  label?: string;
  certificateNumber?: string;
  data?: any;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: AssistantAction[];
}

interface AssistantConfig {
  name: string;
  disclaimer: string;
  connected: boolean;
  quickActions: Array<{ id: string; label: string; icon: string; message: string | null }>;
}

const DEFAULT_QUICK_ACTIONS = [
  { id: "pricing", label: "Pricing Info", icon: "dollar", message: "What are your pricing options for forklift certification?" },
  { id: "certificate", label: "Check Certificate", icon: "shield", message: "I need to verify a forklift certification" },
  { id: "checkout", label: "Help with Checkout", icon: "help", message: "I need help completing my purchase" },
  { id: "contact", label: "Contact Human", icon: "user", message: null },
];

const MAX_MESSAGES = 50;

function QuickActionIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "dollar": return <DollarSign className="w-3.5 h-3.5" />;
    case "shield": return <ShieldCheck className="w-3.5 h-3.5" />;
    case "help": return <HelpCircle className="w-3.5 h-3.5" />;
    case "user": return <UserCheck className="w-3.5 h-3.5" />;
    default: return <MessageCircle className="w-3.5 h-3.5" />;
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4" data-testid="typing-indicator">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-muted rounded-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function NavigateActionCard({ action }: { action: AssistantAction }) {
  return (
    <Link href={action.url || "#"}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        data-testid={`button-action-navigate-${action.url?.replace(/\//g, "-")}`}
      >
        <ArrowRight className="w-3.5 h-3.5" />
        {action.label || "View Page"}
      </Button>
    </Link>
  );
}

function TicketSuccessCard({ action }: { action: AssistantAction }) {
  return (
    <Card className="border-border mt-2" data-testid="card-ticket-success">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Support Ticket Created</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your message has been sent to our team. We'll respond within 1 business day.
            </p>
            {action.data?.email && (
              <p className="text-xs text-muted-foreground mt-1">
                Confirmation will be sent to {action.data.email}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CertVerificationCard({ action }: { action: AssistantAction }) {
  const data = action.data;
  if (!data) return null;

  const isValid = data.status === "valid";
  const isNotFound = data.status === "not_found";

  return (
    <Card className="border-border mt-2" data-testid="card-cert-verification">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {isNotFound ? (
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          ) : isValid ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {isNotFound ? "Certificate Not Found" : isValid ? "Valid Certificate" : "Certificate Revoked"}
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Number:</span> {data.certificateNumber}
              </p>
              {data.holderName && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Holder:</span> {data.holderName}
                </p>
              )}
              {data.courseName && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Course:</span> {data.courseName}
                </p>
              )}
              {data.issuedAt && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Issued:</span>{" "}
                  {new Date(data.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
              {data.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Expires:</span>{" "}
                  {new Date(data.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseInfoCard({ action }: { action: AssistantAction }) {
  const data = action.data;
  if (!data) return null;

  return (
    <Card className="border-border mt-2" data-testid="card-course-info">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{data.title}</p>
            {data.price && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Price:</span> {data.price}
              </p>
            )}
            {data.pricingTiers && (
              <div className="mt-1 space-y-0.5">
                {data.pricingTiers.map((tier: { seats: string; price: string }, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {tier.seats}: {tier.price}
                  </p>
                ))}
              </div>
            )}
            {data.duration && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Duration:</span> {data.duration}
              </p>
            )}
            {data.format && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Format:</span> {data.format}
              </p>
            )}
            {data.combo && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Combo:</span> {data.combo}
              </p>
            )}
            {data.locations && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Locations:</span> {data.locations.join(", ")}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCards({ actions }: { actions: AssistantAction[] }) {
  const navActions = actions.filter(a => a.type === "navigate");
  const ticketActions = actions.filter(a => a.type === "create_ticket");
  const certActions = actions.filter(a => a.type === "verify_cert");
  const courseActions = actions.filter(a => a.type === "course_info");

  return (
    <div className="mt-2 space-y-2">
      {certActions.map((action, i) => (
        <CertVerificationCard key={`cert-${i}`} action={action} />
      ))}
      {ticketActions.map((action, i) => (
        <TicketSuccessCard key={`ticket-${i}`} action={action} />
      ))}
      {courseActions.map((action, i) => (
        <CourseInfoCard key={`course-${i}`} action={action} />
      ))}
      {navActions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {navActions.map((action, i) => (
            <NavigateActionCard key={`nav-${i}`} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatMessageContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function ChatPanel({
  onContactHuman,
}: {
  onContactHuman: () => void;
}) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi there! I'm the ${brand.name} assistant. I can help you with pricing, certification questions, ${industry.regulatory.body} requirements, and more. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInteracted = useRef(false);

  const { data: config } = useQuery<AssistantConfig>({
    queryKey: ["/api/assistant/config"],
    retry: false,
  });

  const quickActions = config?.quickActions || DEFAULT_QUICK_ACTIONS;
  const isConnected = config?.connected ?? false;
  const isLimitReached = messageCount >= MAX_MESSAGES;

  useEffect(() => {
    if (!hasInteracted.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping || isLimitReached) return;

    hasInteracted.current = true;
    setHasError(false);
    const userMessage: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setMessageCount((c) => c + 1);

    const conversationHistory = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/assistant/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory,
          pageContext: window.location.pathname,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let currentContent = "";
      let actions: AssistantAction[] | undefined;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: new Date() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payloadText = trimmed.slice(6).trim();
          if (payloadText === "[DONE]") break;
          try {
            const parsed = JSON.parse(payloadText);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              currentContent += delta;
              const contentSnapshot = currentContent;
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: contentSnapshot };
                }
                return updated;
              });
            }
            if (parsed?.actions && Array.isArray(parsed.actions)) {
              actions = parsed.actions;
              const finalActions = actions;
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], actions: finalActions };
                }
                return updated;
              });
            }
          } catch {
          }
        }
      }

      setIsTyping(false);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("[Chat] Stream error:", error);
      setHasError(true);
      setIsTyping(false);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === "assistant" && !updated[lastIdx].content) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: "I'm having trouble connecting. Please use the contact form below for assistance.",
          };
        }
        return updated;
      });
    }
  }, [isTyping, isLimitReached, messages]);

  const handleSend = (text: string) => {
    if (text === "__CONTACT_HUMAN__" || !text) {
      if (text === "__CONTACT_HUMAN__") onContactHuman();
      return;
    }
    sendMessage(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setMessages((prev) => {
        const filtered = [...prev];
        const lastIdx = filtered.length - 1;
        if (lastIdx >= 0 && filtered[lastIdx].role === "assistant" && !filtered[lastIdx].content) {
          filtered.pop();
        }
        return filtered;
      });
      setHasError(false);
      sendMessage(lastUserMsg.content);
    }
  };

  return (
    <Card className="border-border flex flex-col">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border flex-wrap">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-accent" />
          <h2 className="font-bold text-base">{t("supportPage.aiAssistant")}</h2>
        </div>
        {!isConnected && (
          <Badge variant="outline" className="text-xs" data-testid="badge-demo-mode">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {t("supportPage.demoMode")}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[120px] max-h-[500px] lg:max-h-[600px]" data-testid="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            data-testid={`chat-message-${msg.role}-${i}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant" ? "bg-accent/20" : "bg-primary/10"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-accent" />
              ) : (
                <User className="w-4 h-4 text-brand-dark" />
              )}
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
              <div
                className={`rounded-md px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {formatMessageContent(msg.content)}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <ActionCards actions={msg.actions} />
              )}
            </div>
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 space-y-3">
        {isLimitReached && (
          <div className="text-xs text-muted-foreground flex items-start gap-1.5 bg-muted/50 rounded-md px-3 py-2" data-testid="text-message-limit">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t("supportPage.messageLimit")}</span>
          </div>
        )}

        {hasError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2" data-testid="text-error-message">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{t("supportPage.connectionError")}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} data-testid="button-retry">
              <RefreshCw className="w-3 h-3 mr-1" />
              {t("supportPage.retry")}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-start gap-1.5 bg-muted/50 rounded-md px-3 py-2" data-testid="text-disclaimer">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{t("supportPage.disclaimer", { body: industry.regulatory.body })}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap" data-testid="quick-actions">
          {quickActions.map((action) => (
            <Button
              key={action.id || action.label}
              variant="outline"
              size="sm"
              onClick={() => {
                if (action.message === null) {
                  onContactHuman();
                } else {
                  handleSend(action.message);
                }
              }}
              disabled={isTyping || isLimitReached}
              data-testid={`button-quick-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <QuickActionIcon icon={action.icon} />
              <span className="ml-1.5">{action.label}</span>
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2" data-testid="chat-input-form">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLimitReached ? t("supportPage.messageLimitPlaceholder") : t("supportPage.chatPlaceholder")}
            disabled={isTyping || isLimitReached}
            maxLength={2000}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isTyping || isLimitReached}
            className="bg-accent text-accent-foreground border-accent-border"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

function ContactForm({ formRef }: { formRef: React.RefObject<HTMLDivElement> }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    trainingType: "",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/contact", {
        ...data,
        trainingType: data.trainingType || "other",
      });
    },
    onSuccess: () => {
      toast({ title: t("supportPage.messageSentTitle"), description: t("supportPage.messageSentDesc") });
      setFormData({ name: "", email: "", phone: "", trainingType: "", message: "" });
    },
    onError: () => {
      toast({ title: t("supportPage.errorTitle"), description: t("supportPage.errorDesc"), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({ title: t("supportPage.missingFieldsTitle"), description: t("supportPage.missingFieldsDesc"), variant: "destructive" });
      return;
    }
    if (formData.message.length < 10) {
      toast({ title: t("supportPage.messageTooShortTitle"), description: t("supportPage.messageTooShortDesc"), variant: "destructive" });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div ref={formRef}>
      <Card className="border-border">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-4">{t("supportPage.sendMessage")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm mb-1.5 block">{t("supportPage.fullName")}</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={(e) => setFormData({ ...formData, name: capitalizeWords(e.target.value.trim()) })}
                  placeholder={t("supportPage.placeholderName")}
                  data-testid="input-name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm mb-1.5 block">{t("supportPage.emailAddress")}</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: normalizeEmail(e.target.value) })}
                  placeholder="you@company.com"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm mb-1.5 block">{t("supportPage.phoneNumber")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={14}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatUsPhone(e.target.value) })}
                  placeholder="(555) 555-5555"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label htmlFor="trainingType" className="text-sm mb-1.5 block">{t("supportPage.trainingType")}</Label>
                <Select value={formData.trainingType} onValueChange={(v) => setFormData({ ...formData, trainingType: v })}>
                  <SelectTrigger data-testid="select-training-type">
                    <SelectValue placeholder={t("supportPage.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">{t("supportPage.individualCert")}</SelectItem>
                    <SelectItem value="business">{t("supportPage.businessTraining")}</SelectItem>
                    <SelectItem value="trainer">{t("supportPage.trainTheTrainer")}</SelectItem>
                    <SelectItem value="other">{t("supportPage.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message" className="text-sm mb-1.5 block">{t("supportPage.messageLabel")}</Label>
              <Textarea
                id="message"
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t("supportPage.placeholderMessage")}
                data-testid="input-message"
              />
            </div>

            <Button
              type="submit"
              className="bg-accent text-accent-foreground border-accent-border"
              disabled={mutation.isPending}
              data-testid="button-submit-contact"
            >
              {mutation.isPending ? t("supportPage.sending") : t("supportPage.sendMessageBtn")}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactInfoCards() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card className="border-border" data-testid="contact-info-card">
        <CardContent className="p-6 space-y-5">
          <h3 className="font-bold">{t("supportPage.getInTouch")}</h3>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t("supportPage.phone")}</p>
              <a href={`tel:${brand.support.phoneTel}`} className="text-sm text-muted-foreground" data-testid="contact-phone">{brand.support.phone}</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t("supportPage.email")}</p>
              <a href={`mailto:${brand.support.infoEmail}`} className="text-sm text-muted-foreground" data-testid="contact-email">{brand.support.infoEmail}</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t("supportPage.hours")}</p>
              <p className="text-sm text-muted-foreground">{t("supportPage.hoursValue")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold">{t("supportPage.trainingLocations")}</h3>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t("supportPage.sanDiego")}</p>
              <p className="text-xs text-muted-foreground">{t("supportPage.handsOnFacility")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t("supportPage.lasVegas")}</p>
              <p className="text-xs text-muted-foreground">{t("supportPage.handsOnFacility")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Support() {
  const { t } = useTranslation();
  const contactFormRef = useRef<HTMLDivElement>(null);

  const scrollToContactForm = () => {
    contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      const firstInput = contactFormRef.current?.querySelector("input");
      firstInput?.focus();
    }, 500);
  };

  return (
    <>
      <SEOHead
        title={t("seo.support.title", { brand: brand.name })}
        description={t("seo.support.description", { brand: brand.name, body: industry.regulatory.body })}
        canonical="/support"
      />

      <section className="bg-brand-dark text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-support-title">
            {t("supportPage.title")}
          </h1>
          <p className="text-lg opacity-80 max-w-2xl mx-auto" data-testid="text-support-subtitle">
            {t("supportPage.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <ChatPanel onContactHuman={scrollToContactForm} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <ContactForm formRef={contactFormRef} />
              <ContactInfoCards />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
