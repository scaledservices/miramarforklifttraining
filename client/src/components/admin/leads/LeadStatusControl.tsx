import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VALID_TRANSITIONS, STATUS_LABELS, type OnsiteStatus } from "@shared/config/onsite-states";
import { STATUS_BADGE_STYLES, type UnifiedLead } from "./lead-types";

interface Props {
  lead: UnifiedLead;
  onStatusChange: (id: number, status: string) => void;
  disabled?: boolean;
}

/**
 * Inline status control for a unified lead row.
 * - Onsite leads with valid next transitions: a select limited to those transitions.
 * - Onsite leads in a terminal state: a plain badge.
 * - Contact-form inquiries (no status model): a neutral "Inquiry" badge.
 */
export default function LeadStatusControl({ lead, onStatusChange, disabled }: Props) {
  if (lead.sourceKind !== "onsite" || !lead.status) {
    return (
      <Badge variant="outline" className="text-xs font-normal" data-testid={`badge-lead-status-${lead.key}`}>
        Inquiry
      </Badge>
    );
  }

  const status = lead.status as OnsiteStatus;
  const validNext = VALID_TRANSITIONS[status] ?? [];

  if (validNext.length === 0) {
    return (
      <Badge className={STATUS_BADGE_STYLES[status] || ""} data-testid={`badge-lead-status-${lead.key}`}>
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Select
      value={status}
      disabled={disabled}
      onValueChange={(val) => {
        if (val !== status) onStatusChange(lead.id, val);
      }}
    >
      <SelectTrigger
        className="w-[140px] h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
        data-testid={`select-lead-status-${lead.key}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={status}>{STATUS_LABELS[status]}</SelectItem>
        {validNext.map((s) => (
          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
