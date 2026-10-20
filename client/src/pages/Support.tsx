import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatUsPhone, normalizeEmail, capitalizeWords } from "@/lib/inputFormat";

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
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t("supportPage.fresno")}</p>
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
              <ContactForm formRef={contactFormRef} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <ContactInfoCards />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
