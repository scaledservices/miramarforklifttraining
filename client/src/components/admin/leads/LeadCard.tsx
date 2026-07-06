import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, ChevronRight, ChevronDown, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { SOURCE_LABELS, SOURCE_BADGE_STYLES, type UnifiedLead } from "./lead-types";
import LeadStatusControl from "./LeadStatusControl";

interface Props {
  lead: UnifiedLead;
  onStatusChange: (id: number, status: string) => void;
  statusUpdating?: boolean;
}

/** Mobile-first card for one lead: tap card to open detail (or expand message), one-tap call. */
export default function LeadCard({ lead, onStatusChange, statusUpdating }: Props) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);

  const hasDetail = !!lead.detailPath;

  function handleOpen() {
    if (hasDetail) {
      navigate(lead.detailPath!);
    } else if (lead.message) {
      setExpanded((v) => !v);
    }
  }

  return (
    <Card
      className={`cursor-pointer hover:bg-muted/50 ${lead.isOverdue ? "border-red-300 dark:border-red-800" : ""}`}
      onClick={handleOpen}
      data-testid={`card-lead-${lead.key}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium truncate flex items-center gap-1.5" data-testid={`text-lead-name-${lead.key}`}>
              {lead.isOverdue && <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
              {lead.name}
            </p>
            {lead.company && <p className="text-xs text-muted-foreground truncate">{lead.company}</p>}
            <p className="text-xs text-muted-foreground truncate">
              {[
                lead.trainingType,
                lead.traineeCount ? `${lead.traineeCount} trainees` : null,
                lead.city && lead.state ? `${lead.city}, ${lead.state}` : null,
              ]
                .filter(Boolean)
                .join(" · ") || lead.email}
            </p>
          </div>
          {hasDetail ? (
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
          ) : lead.message ? (
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`text-xs font-normal ${SOURCE_BADGE_STYLES[lead.sourceKind]}`}>
            {SOURCE_LABELS[lead.sourceKind]}
          </Badge>
          <div onClick={(e) => e.stopPropagation()}>
            <LeadStatusControl lead={lead} onStatusChange={onStatusChange} disabled={statusUpdating} />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(lead.createdAt).toLocaleDateString()}
          </span>
        </div>

        {expanded && lead.message && (
          <p className="text-sm whitespace-pre-wrap border-l-2 border-muted pl-3" data-testid={`text-lead-message-${lead.key}`}>
            {lead.message}
          </p>
        )}

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {lead.phone && (
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a href={`tel:${lead.phone}`} data-testid={`link-call-${lead.key}`}>
                <Phone className="h-4 w-4 mr-1.5" /> Call
              </a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="flex-1">
            <a href={`mailto:${lead.email}`} data-testid={`link-email-${lead.key}`}>
              <Mail className="h-4 w-4 mr-1.5" /> Email
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
