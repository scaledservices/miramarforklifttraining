import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import SEOHead from "@/components/seo/SEOHead";
import {
  GraduationCap,
  DollarSign,
  MapPin,
  Clock,
  Users,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  Target,
  Briefcase,
} from "lucide-react";

interface CertificationRecord {
  id: number;
  certificateNumber: string;
  status: string;
  issuedAt: string;
}

interface ExistingApplication {
  id: number;
  status: string;
  email: string;
  createdAt: string;
}

function useFormSchema(t: (key: string) => string) {
  return z.object({
    fullName: z.string().min(2, t("instructorForm.validFullName")),
    email: z.string().email(t("instructorForm.validEmail")),
    phone: z.string().min(7, t("instructorForm.validPhone")),
    city: z.string().min(2, t("instructorForm.validCity")),
    state: z.string().min(2, t("instructorForm.validState")),
    zip: z.string().min(5, t("instructorForm.validZip")),
    yearsExperience: z.number().int().min(0, t("instructorForm.validYearsExp")),
    equipmentTypes: z.array(z.string()).min(1, t("instructorForm.validEquipment")),
    industries: z.array(z.string()),
    hasTeachingExperience: z.boolean(),
    trainingExperience: z.string().optional(),
    currentCertifications: z.string().optional(),
    availability: z.string().min(2, t("instructorForm.validAvailability")),
    availabilityNotes: z.string().optional(),
    willingToTravel: z.boolean(),
    travelRadius: z.number().int().min(0).optional(),
    whyInstructor: z.string().min(20, t("instructorForm.validWhy")),
    additionalNotes: z.string().optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    websiteUrl: z.string().url().optional().or(z.literal("")),
    resumeUrl: z.string().url().optional().or(z.literal("")),
    certificationId: z.number().int().positive().nullable(),
  });
}

type FormValues = z.infer<ReturnType<typeof useFormSchema>>;

const EQUIPMENT_KEYS = [
  "instructorForm.equipSitDown",
  "instructorForm.equipReachTruck",
  "instructorForm.equipOrderPicker",
  "instructorForm.equipPalletElectric",
  "instructorForm.equipPalletManual",
  "instructorForm.equipRoughTerrain",
  "instructorForm.equipTelehandler",
  "instructorForm.equipDockStocker",
];

const INDUSTRY_KEYS = [
  "instructorForm.indWarehouse",
  "instructorForm.indManufacturing",
  "instructorForm.indConstruction",
  "instructorForm.indRetail",
  "instructorForm.indFood",
  "instructorForm.indLumber",
  "instructorForm.indAutomotive",
  "instructorForm.indAgriculture",
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
        data-testid={`faq-toggle-${q.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="font-medium text-foreground">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-4 text-muted-foreground text-sm">{a}</p>}
    </div>
  );
}

export default function BecomeAnInstructor() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const formSchema = useFormSchema(t);

  const { data: certsData, isLoading: certsLoading } = useQuery<{ certifications: CertificationRecord[] }>({
    queryKey: ["/api/certifications"],
  });

  const { data: existingAppData, isLoading: appLoading } = useQuery<{ application: ExistingApplication | null }>({
    queryKey: ["/api/instructor-applications/mine"],
  });

  const issuedCerts = (certsData?.certifications || []).filter((c) => c.status === "issued");
  const hasCert = issuedCerts.length > 0;
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isEligible = hasCert || isSuperAdmin;
  const existingApp = existingAppData?.application;
  const hasActiveApp = existingApp && (existingApp.status === "applied" || existingApp.status === "reviewing");

  useEffect(() => {
    if (!certsLoading && !appLoading && !isEligible) {
      toast({
        title: t("instructor.certRequired"),
        description: t("instructor.certRequiredDesc", { brand: brand.name }),
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [certsLoading, appLoading, isEligible, toast, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      city: "",
      state: "",
      zip: "",
      yearsExperience: 0,
      equipmentTypes: [],
      industries: [],
      hasTeachingExperience: false,
      trainingExperience: "",
      currentCertifications: "",
      availability: "",
      availabilityNotes: "",
      willingToTravel: false,
      travelRadius: 0,
      whyInstructor: "",
      additionalNotes: "",
      linkedinUrl: "",
      websiteUrl: "",
      resumeUrl: "",
      certificationId: issuedCerts[0]?.id || null,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest("POST", "/api/instructor-applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor-applications/mine"] });
      toast({ title: t("instructor.appSubmittedToast"), description: t("instructor.appSubmittedToastDesc") });
    },
    onError: (err: Error) => {
      toast({ title: t("instructor.submissionFailed"), description: err.message || t("instructor.submissionFailedDesc"), variant: "destructive" });
    },
  });

  function onSubmit(data: FormValues) {
    if (!data.certificationId && issuedCerts.length > 0) {
      data.certificationId = issuedCerts[0].id;
    }
    mutation.mutate(data);
  }

  const benefits = [
    { icon: DollarSign, title: t("instructor.competitivePay"), desc: t("instructor.competitivePayDesc") },
    { icon: Clock, title: t("instructor.flexibleSchedule"), desc: t("instructor.flexibleScheduleDesc") },
    { icon: MapPin, title: t("instructor.localSessions"), desc: t("instructor.localSessionsDesc") },
    { icon: Users, title: t("instructor.makeImpact"), desc: t("instructor.makeImpactDesc") },
    { icon: GraduationCap, title: t("instructor.trainingProvided"), desc: t("instructor.trainingProvidedDesc") },
    { icon: Award, title: t("instructor.professionalGrowth"), desc: t("instructor.professionalGrowthDesc") },
  ];

  const faqItems = [
    { q: t("instructor.faq1q"), a: t("instructor.faq1a", { brand: brand.name }) },
    { q: t("instructor.faq2q"), a: t("instructor.faq2a") },
    { q: t("instructor.faq3q"), a: t("instructor.faq3a") },
    { q: t("instructor.faq4q"), a: t("instructor.faq4a") },
    { q: t("instructor.faq5q"), a: t("instructor.faq5a") },
  ];

  if (certsLoading || appLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isEligible) {
    return null;
  }

  return (
    <div data-testid="page-become-instructor">
      <SEOHead
        title={t("instructor.seoTitle", { brand: brand.name })}
        description={t("instructor.seoDesc", { brand: brand.name })}
        noindex={true}
      />

      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <Badge variant="secondary" className="text-sm" data-testid="badge-certified-only">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            {t("instructor.certifiedOnly")}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold" data-testid="text-hero-title">
            {t("instructor.heroTitle", { brand: brand.name })}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            {t("instructor.heroDesc")}
          </p>
          <a href="#apply" className="inline-block">
            <Button size="lg" variant="secondary" className="text-base px-8" data-testid="button-hero-apply">
              {t("instructor.applyNow")}
            </Button>
          </a>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" data-testid="text-benefits-title">
            {t("instructor.whyTeach")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} data-testid={`card-benefit-${b.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" data-testid="text-what-we-look-for-title">
            {t("instructor.whatWeLookFor")}
          </h2>
          <p className="text-center text-muted-foreground mb-10">{t("instructor.idealCandidates")}</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Award, title: t("instructor.certifiedOperator"), desc: t("instructor.certifiedOperatorDesc", { brand: brand.name }) },
              { icon: Briefcase, title: t("instructor.realWorldExp"), desc: t("instructor.realWorldExpDesc") },
              { icon: Target, title: t("instructor.safetyMindset"), desc: t("instructor.safetyMindsetDesc", { body: industry.regulatory.body }) },
              { icon: Users, title: t("instructor.commSkills"), desc: t("instructor.commSkillsDesc") },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 items-start" data-testid={`qualification-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" data-testid="text-how-it-works-title">
            {t("instructor.howItWorks")}
          </h2>
          <p className="text-center text-muted-foreground mb-10">{t("instructor.howItWorksSubtitle")}</p>
          <div className="space-y-6">
            {[
              { step: 1, title: t("instructor.step1Title"), desc: t("instructor.step1Desc") },
              { step: 2, title: t("instructor.step2Title"), desc: t("instructor.step2Desc") },
              { step: 3, title: t("instructor.step3Title"), desc: t("instructor.step3Desc") },
              { step: 4, title: t("instructor.step4Title"), desc: t("instructor.step4Desc") },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start" data-testid={`step-${s.step}`}>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="py-16 bg-muted/30 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" data-testid="text-apply-title">
            {t("instructor.applicationTitle")}
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            {t("instructor.applicationSubtitle")}
          </p>

          {hasActiveApp ? (
            <Card data-testid="card-existing-application">
              <CardContent className="py-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                <h3 className="text-xl font-bold">{t("instructor.alreadySubmitted")}</h3>
                <p className="text-muted-foreground">
                  {t("instructor.alreadySubmittedDesc")} <Badge variant="secondary">{existingApp.status}</Badge>.
                  {" "}{t("instructor.alreadySubmittedContact")} <strong>{existingApp.email}</strong> {t("instructor.alreadySubmittedDecision")}
                </p>
              </CardContent>
            </Card>
          ) : mutation.isSuccess ? (
            <Card data-testid="card-submission-success">
              <CardContent className="py-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                <h3 className="text-xl font-bold">{t("instructor.submittedTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("instructor.submittedDesc", { brand: brand.name })}
                </p>
                <Button variant="outline" asChild data-testid="button-back-dashboard">
                  <a href="/dashboard">{t("instructor.backToDashboard")}</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("instructor.applicationForm")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.fullName")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-full-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.email")}</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.phone")}</FormLabel>
                            <FormControl>
                              <Input type="tel" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="yearsExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.yearsExperience")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-years-experience"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.city")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.state")}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("instructorForm.placeholderState")} data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.zipCode")}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("instructorForm.placeholderZip")} data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="equipmentTypes"
                      render={() => (
                        <FormItem>
                          <FormLabel>{t("instructor.equipmentTypes")}</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {EQUIPMENT_KEYS.map((eqKey) => {
                              const label = t(eqKey);
                              return (
                                <FormField
                                  key={eqKey}
                                  control={form.control}
                                  name="equipmentTypes"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(label)}
                                          onCheckedChange={(checked) => {
                                            const val = field.value || [];
                                            field.onChange(
                                              checked ? [...val, label] : val.filter((v) => v !== label)
                                            );
                                          }}
                                          data-testid={`checkbox-equipment-${eqKey.split(".").pop()}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">{label}</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industries"
                      render={() => (
                        <FormItem>
                          <FormLabel>{t("instructor.industryExperience")}</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {INDUSTRY_KEYS.map((indKey) => {
                              const label = t(indKey);
                              return (
                                <FormField
                                  key={indKey}
                                  control={form.control}
                                  name="industries"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(label)}
                                          onCheckedChange={(checked) => {
                                            const val = field.value || [];
                                            field.onChange(
                                              checked ? [...val, label] : val.filter((v) => v !== label)
                                            );
                                          }}
                                          data-testid={`checkbox-industry-${indKey.split(".").pop()}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">{label}</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentCertifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("instructor.otherCertifications")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("instructorForm.placeholderCertifications", { body: industry.regulatory.body })}
                              data-testid="input-current-certifications"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasTeachingExperience"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-teaching-experience"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {t("instructor.teachingExpLabel")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasTeachingExperience") && (
                      <FormField
                        control={form.control}
                        name="trainingExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.describeTrainingExp")}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                data-testid="textarea-training-experience"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("instructor.availability")}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-availability">
                                <SelectValue placeholder={t("instructor.selectAvailability")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full-time">{t("instructor.fullTime")}</SelectItem>
                              <SelectItem value="part-time">{t("instructor.partTime")}</SelectItem>
                              <SelectItem value="weekends">{t("instructor.weekendsOnly")}</SelectItem>
                              <SelectItem value="flexible">{t("instructor.flexible")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availabilityNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("instructor.availabilityNotes")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-availability-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="willingToTravel"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-willing-to-travel"
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t("instructor.willingToTravel")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {form.watch("willingToTravel") && (
                        <FormField
                          control={form.control}
                          name="travelRadius"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("instructor.maxTravelRadius")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  placeholder={t("instructorForm.placeholderRadius")}
                                  data-testid="input-travel-radius"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="whyInstructor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("instructor.whyInstructor", { brand: brand.name })}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              data-testid="textarea-why-instructor"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.linkedinUrl")}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("instructorForm.placeholderLinkedin")} data-testid="input-linkedin" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.websiteUrl")}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("instructorForm.placeholderWebsite")} data-testid="input-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="resumeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("instructor.resumeUrl")}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t("instructorForm.placeholderResume")} data-testid="input-resume-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("instructor.additionalNotes")}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              data-testid="textarea-additional-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {issuedCerts.length > 1 && (
                      <FormField
                        control={form.control}
                        name="certificationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("instructor.selectCertification")}</FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(parseInt(v))}
                              value={field.value ? String(field.value) : ""}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-certification">
                                  <SelectValue placeholder={t("instructor.selectYourCert")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {issuedCerts.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    #{c.certificateNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {issuedCerts.length === 1 && (
                      <input type="hidden" {...form.register("certificationId", { value: issuedCerts[0].id })} />
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={mutation.isPending}
                      data-testid="button-submit-application"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("instructor.submitting")}
                        </>
                      ) : (
                        t("instructor.submitApplication")
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8" data-testid="text-faq-title">
            {t("instructor.faqTitle")}
          </h2>
          <Card>
            <CardContent className="py-2">
              {faqItems.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
