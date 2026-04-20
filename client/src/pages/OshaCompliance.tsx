import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import {
  ShieldCheck,
  BookOpen,
  ClipboardList,
  Users,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

const compliancePoints = [
  {
    icon: BookOpen,
    title: "Knowledge-Based Training",
    description:
      `Our online courses cover all ${industry.regulatory.body}-required topics including truck-related topics (operating instructions, warnings, precautions), workplace-related topics (surface conditions, load manipulation, pedestrian traffic), and the requirements of the ${industry.regulatory.body} standard itself.`,
  },
  {
    icon: ClipboardList,
    title: "Evaluation and Testing",
    description:
      `Operators must pass a comprehensive knowledge assessment demonstrating understanding of safe forklift operation principles. Our exams are designed to verify competency across all ${industry.regulatory.body}-mandated training topics.`,
  },
  {
    icon: Users,
    title: "Employer Hands-On Evaluation",
    description:
      `${industry.regulatory.body} requires employers to provide hands-on practical training and evaluation specific to the workplace. We provide employer documentation templates including evaluation checklists, training record templates, and operator authorization forms to help employers complete this requirement.`,
  },
  {
    icon: RefreshCw,
    title: "Refresher Training",
    description:
      `Per ${industry.regulatory.body} requirements, operators must receive refresher training when involved in an accident or near-miss, observed operating unsafely, assigned to a different type of truck, or when workplace conditions change. Certifications are valid for ${industry.regulatory.certificationValidity}.`,
  },
];

const oshaTopics = [
  "Operating instructions, warnings, and precautions for the types of truck the operator will be authorized to operate",
  "Differences between the truck and the automobile",
  "Truck controls and instrumentation: where they are located, what they do, and how they work",
  "Engine or motor operation",
  "Steering and maneuvering",
  "Visibility (including restrictions due to loading)",
  "Fork and attachment adaptation, operation, and use limitations",
  "Vehicle capacity",
  "Vehicle stability",
  "Vehicle inspection and maintenance",
  "Refueling and/or charging and recharging of batteries",
  "Operating limitations",
  "Any other operating instructions, warnings, or precautions listed in the operator's manual",
  "Surface conditions where the vehicle will be operated",
  "Composition of loads to be carried and load stability",
  "Load manipulation, stacking, and unstacking",
  "Pedestrian traffic in areas where the vehicle will be operated",
  "Narrow aisles and other restricted places where the vehicle will be operated",
  "Hazardous (classified) locations where the vehicle will be operated",
  "Ramps and other sloped surfaces that could affect the vehicle's stability",
  "Closed environments and other areas where insufficient ventilation could cause a buildup of carbon monoxide or diesel exhaust",
  "Other unique or potentially hazardous environmental conditions in the workplace",
];

export default function OshaCompliance() {
  const { t } = useTranslation();
  return (
    <>
    <SEOHead
      title={t("seo.oshaCompliance.title", { body: industry.regulatory.body })}
      description={t("seo.oshaCompliance.description", { body: industry.regulatory.body, standard: industry.regulatory.standard })}
      canonical="/osha-compliance"
    />
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8" data-testid="page-osha-compliance">
      <div className="flex items-center gap-3 flex-wrap">
        <ShieldCheck className="h-7 w-7 text-accent" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-osha-title">{industry.regulatory.body} Compliance</h1>
          <p className="text-muted-foreground mt-1">How our certification meets federal requirements</p>
        </div>
      </div>

      <Card data-testid="card-osha-overview">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="bg-green-600 border-green-600" data-testid="badge-osha-aligned">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {industry.regulatory.alignmentLabel.charAt(0).toUpperCase() + industry.regulatory.alignmentLabel.slice(1)}
            </Badge>
            <Badge variant="secondary" data-testid="badge-cfr-reference">{industry.regulatory.standard}</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our forklift certification training program is designed to comply with {industry.regulatory.body} Standard {industry.regulatory.standard} - Powered Industrial Trucks. This federal regulation establishes the requirements for the training and certification of forklift (powered industrial truck) operators in general industry workplaces. Our program addresses the knowledge-based training component as outlined in the standard.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" data-testid="text-compliance-heading">How We Meet {industry.regulatory.body} Requirements</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {compliancePoints.map((point) => (
            <Card key={point.title} data-testid={`card-compliance-${point.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="py-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
                    <point.icon className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-sm">{point.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card data-testid="card-training-topics">
        <CardHeader>
          <CardTitle className="text-lg">{industry.regulatory.body}-Required Training Topics Covered</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Per {industry.regulatory.standard}(l)(3), our training program covers all of the following topics as applicable:
          </p>
          <div className="grid gap-2">
            {oshaTopics.map((topic, i) => (
              <div key={i} className="flex items-start gap-2" data-testid={`topic-item-${i}`}>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{topic}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-three-part">
        <CardHeader>
          <CardTitle className="text-lg">The Three-Part {industry.regulatory.body} Training Requirement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {industry.regulatory.body} requires forklift operator training to consist of three parts. Our online certification addresses the first component, while employers must ensure completion of all three:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="bg-green-600 border-green-600 shrink-0 mt-0.5">1</Badge>
              <div>
                <p className="font-semibold text-sm">Formal Instruction (Covered by Our Program)</p>
                <p className="text-sm text-muted-foreground">
                  Lecture, discussion, interactive computer learning, video, and written material covering the required topics. Our online course fulfills this requirement.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">2</Badge>
              <div>
                <p className="font-semibold text-sm">Practical Training (Employer Responsibility)</p>
                <p className="text-sm text-muted-foreground">
                  Hands-on demonstrations and exercises performed by the trainee under the supervision of the employer's designated trainer, using the specific equipment in the actual workplace.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">3</Badge>
              <div>
                <p className="font-semibold text-sm">Evaluation (Employer Responsibility)</p>
                <p className="text-sm text-muted-foreground">
                  Evaluation of the operator's performance in the workplace by the employer. We provide evaluation checklists and documentation templates to assist employers with this requirement.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-disclaimer">
        <CardContent className="py-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold">Disclaimer:</span> While our training program is designed to meet {industry.regulatory.body} {industry.regulatory.standard} requirements for the formal instruction component, it is the employer's responsibility to ensure all three training components (formal instruction, practical training, and evaluation) are completed before authorizing an operator to use a powered industrial truck. {brand.domain} provides the knowledge-based training component and employer documentation tools. Employers should consult with their safety professionals to ensure full compliance with all applicable federal, state, and local regulations.
          </p>
        </CardContent>
      </Card>
    </div>
    </>
  );

}
