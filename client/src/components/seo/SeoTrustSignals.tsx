import { ShieldCheck, Award, Clock, DollarSign, Users, CheckCircle } from "lucide-react";
import { industry } from "@shared/config/industry";

const defaultSignals = [
  { icon: ShieldCheck, label: `${industry.regulatory.body}-Compliant`, sublabel: industry.regulatory.standard },
  { icon: Award, label: "Certificate Included", sublabel: "QR-verified PDF" },
  { icon: Clock, label: "Same-Day Certification", sublabel: "Complete at your pace" },
  { icon: DollarSign, label: "$59.99", sublabel: "One-time payment" },
];

interface TrustSignal {
  icon?: typeof ShieldCheck;
  label: string;
  sublabel?: string;
}

interface SeoTrustSignalsProps {
  signals?: TrustSignal[];
}

export default function SeoTrustSignals({ signals = defaultSignals }: SeoTrustSignalsProps) {
  return (
    <section className="border-y bg-muted/30 py-6" data-testid="seo-trust-signals">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {signals.map((s, i) => {
            const Icon = s.icon || CheckCircle;
            return (
              <div key={i} className="flex flex-col items-center gap-1" data-testid={`trust-signal-${i}`}>
                <Icon className="h-5 w-5 text-accent mb-1" />
                <span className="font-semibold text-sm">{s.label}</span>
                {s.sublabel && <span className="text-xs text-muted-foreground">{s.sublabel}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
