import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import GuidedSelector from "@/components/sections/GuidedSelector";
import { brand } from "@shared/config/brand";

export default function GetCertified() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHead
        title={t("guidedSelector.pageTitle", { brand: brand.name })}
        description={t("guidedSelector.pageDescription")}
        canonical="/get-certified"
      />
      <GuidedSelector />
    </>
  );
}
