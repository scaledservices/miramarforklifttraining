import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { brand } from "@shared/config/brand";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary text-primary-foreground" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo variant="full" theme="dark" />
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-90">{t("footer.training")}</h3>
            <ul className="space-y-2">
              <li><Link href="/online-training" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-online">{t("footer.onlineTraining")}</Link></li>
              <li><Link href="/hands-on-training" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-hands-on">{t("footer.handsOnTraining")}</Link></li>
              <li><Link href="/train-the-trainer" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-trainer">{t("footer.trainTheTrainer")}</Link></li>
              <li><Link href="/training-programs" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-programs">{t("footer.allPrograms")}</Link></li>
              <li><Link href="/business" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-business">{t("footer.businessSolutions")}</Link></li>
              <li><Link href="/forklift-certification-cost" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-cost">{t("footer.certificationCost")}</Link></li>
              <li><Link href="/forklift-certification-near-me" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-near-me">{t("footer.findTrainingNearMe")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-90">{t("footer.resources")}</h3>
            <ul className="space-y-2">
              {/* Blog link hidden until blog content exists (senior review Section B.5) */}
              <li><Link href="/documentation" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-docs">{t("footer.documentation")}</Link></li>
              <li><Link href="/business/faq" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-faq">{t("footer.faq")}</Link></li>
              <li><Link href="/osha-compliance" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-osha">{t("footer.oshaCompliance")}</Link></li>
              <li><Link href="/forklift-certification-verification" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-verification">{t("footer.verifyCertification")}</Link></li>
              <li><Link href="/osha-forklift-training" className="text-sm opacity-75 transition-opacity" data-testid="footer-link-osha-training">{t("footer.oshaTrainingGuide")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-90">{t("footer.contact")}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 opacity-60 shrink-0" />
                <a href={`tel:${brand.support.phoneTel}`} className="text-sm opacity-75" data-testid="footer-phone">{brand.support.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 opacity-60 shrink-0" />
                <a href={`mailto:${brand.support.infoEmail}`} className="text-sm opacity-75" data-testid="footer-email">{brand.support.infoEmail}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 opacity-60 shrink-0 mt-0.5" />
                <div className="text-sm opacity-75 space-y-1">
                  <Link href="/locations/san-diego" data-testid="footer-link-sd">{t("footerLocations.sanDiego")}</Link>
                  <div><Link href="/locations/las-vegas" data-testid="footer-link-lv">{t("footerLocations.lasVegas", { defaultValue: "Las Vegas, NV" })}</Link></div>
                  <div><Link href="/locations/fresno" data-testid="footer-link-fresno">{t("footerLocations.fresno", { defaultValue: "Fresno, CA" })}</Link></div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs opacity-60">
            &copy; {new Date().getFullYear()} {brand.name}. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/terms" className="text-xs opacity-60" data-testid="footer-link-terms">{t("footer.terms")}</Link>
            <span className="text-xs opacity-30">|</span>
            <Link href="/privacy" className="text-xs opacity-60" data-testid="footer-link-privacy">{t("footer.privacy")}</Link>
            <span className="text-xs opacity-30">|</span>
            <Link href="/refund-policy" className="text-xs opacity-60" data-testid="footer-link-refund">{t("footer.refundPolicy")}</Link>
            <span className="text-xs opacity-30">|</span>
            <Link href="/support" className="text-xs opacity-60" data-testid="footer-contact-link">{t("footer.contactUs")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
