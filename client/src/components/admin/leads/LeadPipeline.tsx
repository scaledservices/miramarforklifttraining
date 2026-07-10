import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, ArrowRight, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { STATUS_LABELS, type OnsiteStatus } from "@shared/config/onsite-states";
import { type UnifiedLead, SOURCE_LABELS } from "./lead-types";

/**
 * Pipeline view: leads move New → Contacted → Quoted → Won, with Lost off to
 * the side. One big "advance" button per card (phone-friendly — no drag
 * required), call/email inline, and stage-to-stage conversion rates in the
 * header so the numbers tell a story instead of sitting in a table.
 */

type StageKey = "new" | "contacted" | "quoted" | "won" | "lost";

const STAGE_STATUSES: Record<StageKey, OnsiteStatus[]> = {
  new: ["new_lead"],
  contacted: ["contacted"],
  quoted: ["quoted"],
  won: ["quote_accepted", "scheduled", "confirmed", "completed", "invoiced"],
  lost: ["quote_declined", "unresponsive", "cancelled"],
};

// Primary "advance" action per status — the happy path through the funnel.
const NEXT_STATUS: Partial<Record<OnsiteStatus, OnsiteStatus>> = {
  new_lead: "contacted",
  contacted: "quoted",
  quoted: "quote_accepted",
  quote_accepted: "scheduled",
  scheduled: "confirmed",
  confirmed: "completed",
  completed: "invoiced",
};

const STAGE_ORDER: StageKey[] = ["new", "contacted", "quoted", "won"];

interface Props {
  leads: UnifiedLead[];
  onStatusChange: (id: number, status: string) => void;
  statusUpdating: boolean;
}

export default function LeadPipeline({ leads, onStatusChange, statusUpdating }: Props) {
  const { t } = useTranslation();

  const byStage = useMemo(() => {
    const map: Record<StageKey, UnifiedLead[]> = { new: [], contacted: [], quoted: [], won: [], lost: [] };
    for (const lead of leads) {
      if (!lead.status) {
        // Contact-form inquiries have no pipeline status — they start in New.
        map.new.push(lead);
        continue;
      }
      for (const [stage, statuses] of Object.entries(STAGE_STATUSES) as [StageKey, OnsiteStatus[]][]) {
        if (statuses.includes(lead.status)) {
          map[stage].push(lead);
          break;
        }
      }
    }
    return map;
  }, [leads]);

  // "Reached" counts: a lead in Quoted has also been through New and
  // Contacted, so funnel rates read cumulatively.
  const reached = useMemo(() => {
    const counts: Record<StageKey, number> = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
    for (let i = 0; i < STAGE_ORDER.length; i++) {
      counts[STAGE_ORDER[i]] = STAGE_ORDER.slice(i)
        .reduce((n, s) => n + byStage[s].length, 0);
    }
    return counts;
  }, [byStage]);

  const stageMeta: { key: StageKey; label: string }[] = [
    { key: "new", label: t("adminUx.stageNew", { defaultValue: "New" }) },
    { key: "contacted", label: t("adminUx.stageContacted", { defaultValue: "Contacted" }) },
    { key: "quoted", label: t("adminUx.stageQuoted", { defaultValue: "Quoted" }) },
    { key: "won", label: t("adminUx.stageWon", { defaultValue: "Won" }) },
    { key: "lost", label: t("adminUx.stageLost", { defaultValue: "Lost" }) },
  ];

  return (
    <div className="space-y-4" data-testid="lead-pipeline">
      {/* Funnel story */}
      <p className="text-sm text-muted-foreground" data-testid="text-funnel-story">
        {STAGE_ORDER.map((key, i) => {
          const label = stageMeta.find((s) => s.key === key)!.label;
          const prev = i > 0 ? reached[STAGE_ORDER[i - 1]] : null;
          const pct = prev ? Math.round((reached[key] / prev) * 100) : null;
          return (
            <span key={key}>
              {i > 0 && <span className="mx-1.5 text-muted-foreground/60">→</span>}
              <span className="font-medium text-foreground">{label} {reached[key]}</span>
              {pct !== null && <span className="text-xs"> ({pct}%)</span>}
            </span>
          );
        })}
      </p>

      {/* Columns: horizontal snap-scroll on phones, grid on wide screens */}
      <div className="flex gap-4 overflow-x-auto snap-x pb-2 xl:grid xl:grid-cols-5 xl:overflow-visible">
        {stageMeta.map(({ key, label }) => (
          <div
            key={key}
            className="min-w-[280px] w-[85vw] max-w-[320px] xl:w-auto xl:max-w-none shrink-0 snap-start"
            data-testid={`pipeline-column-${key}`}
          >
            <div className="flex items-center gap-2 mb-2 px-1">
              <h3 className={`text-sm font-bold ${key === "lost" ? "text-muted-foreground" : ""}`}>{label}</h3>
              <Badge variant="secondary" className="text-xs">{byStage[key].length}</Badge>
            </div>
            <div className={`space-y-2 rounded-xl p-2 min-h-[120px] ${key === "lost" ? "bg-muted/40" : "bg-muted/60"}`}>
              {byStage[key].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {t("adminUx.stageEmpty", { defaultValue: "Nothing here" })}
                </p>
              ) : (
                byStage[key].map((lead) => (
                  <PipelineCard
                    key={lead.key}
                    lead={lead}
                    onStatusChange={onStatusChange}
                    statusUpdating={statusUpdating}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function daysAgo(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000));
}

function PipelineCard({
  lead,
  onStatusChange,
  statusUpdating,
}: {
  lead: UnifiedLead;
  onStatusChange: (id: number, status: string) => void;
  statusUpdating: boolean;
}) {
  const { t } = useTranslation();
  const next = lead.status ? NEXT_STATUS[lead.status] : undefined;
  const age = daysAgo(lead.createdAt);

  const detail = [
    lead.trainingType,
    lead.traineeCount ? `${lead.traineeCount} ${t("adminUx.trainees", { defaultValue: "trainees" })}` : null,
    lead.city && lead.state ? `${lead.city}, ${lead.state}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className={lead.isOverdue ? "border-red-300 dark:border-red-800" : ""} data-testid={`pipeline-card-${lead.key}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate flex items-center gap-1">
              {lead.isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
              {lead.name}
            </p>
            {lead.company && <p className="text-xs text-muted-foreground truncate">{lead.company}</p>}
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
            {age === 0
              ? t("adminUx.today", { defaultValue: "today" })
              : t("adminUx.daysAgo", { count: age, defaultValue: "{{count}}d ago" })}
          </span>
        </div>

        {detail && <p className="text-xs text-muted-foreground line-clamp-2">{detail}</p>}
        {!detail && lead.message && <p className="text-xs text-muted-foreground line-clamp-2">{lead.message}</p>}

        <p className="text-[10px] text-muted-foreground">
          {t("adminUx.leadFrom", { defaultValue: "From" })}: {lead.leadSource || SOURCE_LABELS[lead.sourceKind]}
        </p>

        <div className="flex items-center gap-1.5 pt-1">
          {lead.phone && (
            <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <a href={`tel:${lead.phone}`} data-testid={`pipeline-call-${lead.key}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <a href={`mailto:${lead.email}`} data-testid={`pipeline-email-${lead.key}`}>
              <Mail className="h-4 w-4" />
            </a>
          </Button>
          {next && (
            <Button
              size="sm"
              className="flex-1 h-9 text-xs"
              disabled={statusUpdating}
              onClick={() => onStatusChange(lead.id, next)}
              data-testid={`pipeline-advance-${lead.key}`}
            >
              {statusUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5 mr-1" />
                  {STATUS_LABELS[next]}
                </>
              )}
            </Button>
          )}
          {lead.detailPath && (
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Link href={lead.detailPath} data-testid={`pipeline-open-${lead.key}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
