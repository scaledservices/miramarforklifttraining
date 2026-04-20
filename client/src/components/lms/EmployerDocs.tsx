import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ClipboardList, UserCheck, Download } from "lucide-react";
import { industry } from "@shared/config/industry";
import { useTranslation } from "react-i18next";

export default function EmployerDocs() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es" : "en";

  const docs = [
    {
      titleKey: "certification.docPerformanceTest",
      descKey: "certification.docPerformanceTestDesc",
      icon: ClipboardList,
      docId: "performance-evaluation",
      filename: "PERFORMANCE-TEST.pdf",
    },
    {
      titleKey: "certification.docAttendanceForm",
      descKey: "certification.docAttendanceFormDesc",
      icon: FileText,
      docId: "attendance-sheet",
      filename: "ATTENDANCE-FORM-AND-SCHEDULING.pdf",
    },
    {
      titleKey: "certification.docPermit",
      descKey: "certification.docPermitDesc",
      icon: UserCheck,
      docId: "operator-permit",
      filename: "Powered-Industrial-Truck-PIT-PERMIT-TO-OPERATE.pdf",
    },
  ];

  return (
    <Card data-testid="card-employer-docs">
      <CardHeader>
        <CardTitle className="text-lg">{t("certification.employerDocsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("certification.employerDocsDesc", { body: industry.regulatory.body })}
        </p>
        <div className="space-y-3">
          {docs.map((doc) => {
            const title = t(doc.titleKey);
            return (
              <div
                key={doc.docId}
                className="flex items-start gap-3"
                data-testid={`employer-doc-${doc.docId}`}
              >
                <div className="h-9 w-9 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
                  <doc.icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 space-y-1">
                  <a
                    href={`/api/documents/${doc.docId}/download?locale=${locale}`}
                    download={doc.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" className="h-auto p-0 text-sm font-medium underline-offset-4 hover:underline" data-testid={`link-${doc.docId}`}>
                      <Download className="h-3 w-3 mr-1" />
                      {title}
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground">{t(doc.descKey, { body: industry.regulatory.body })}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
