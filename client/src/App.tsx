import { Switch, Route, Router, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import ThemeInjector from "@/components/ThemeInjector";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileCtaBar from "@/components/layout/MobileCtaBar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import OnlineCertification from "@/pages/OnlineCertification";
import TrainingPrograms from "@/pages/TrainingPrograms";
import OnlineTraining from "@/pages/OnlineTraining";
import HandsOnTraining from "@/pages/HandsOnTraining";
import TrainTheTrainer from "@/pages/TrainTheTrainer";
import Business from "@/pages/Business";
import BusinessProducts from "@/pages/BusinessProducts";
import BusinessFAQ from "@/pages/BusinessFAQ";
import Documentation from "@/pages/Documentation";
import Contact from "@/pages/Contact";
import Support from "@/pages/Support";
import LocationPage from "@/pages/LocationPage";
import RenewalPage from "@/pages/RenewalPage";
import FAQPage from "@/pages/FAQPage";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import AcceptInvite from "@/pages/AcceptInvite";
import Certification from "@/pages/Certification";
import CertificateVerify from "@/pages/CertificateVerify";
import PayBalance from "@/pages/PayBalance";
import OrderCertCard from "@/pages/OrderCertCard";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import RefundPolicy from "@/pages/RefundPolicy";
import OshaCompliance from "@/pages/OshaCompliance";
import RequestOnsiteTraining from "@/pages/RequestOnsiteTraining";
import RequestQuote from "@/pages/RequestQuote";
import InPersonTraining from "@/pages/InPersonTraining";
import BecomeAnInstructor from "@/pages/BecomeAnInstructor";
import ProtectedRoute from "@/components/ProtectedRoute";
import SeoPageRenderer from "@/pages/seo/SeoPageRenderer";
import BookTraining from "@/pages/BookTraining";
import GetCertified from "@/pages/GetCertified";
import LocationsHub from "@/pages/LocationsHub";
import ServiceAreaPage from "@/pages/ServiceAreaPage";
import ServiceAreasHub from "@/pages/ServiceAreasHub";
import { CartProvider } from "@/contexts/CartContext";
import DemoBanner from "@/components/DemoBanner";
import SEOHead from "@/components/seo/SEOHead";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import LanguageBanner from "@/components/LanguageBanner";
import { useLocaleLocation } from "@/hooks/useLocaleLocation";
import { DEFAULT_LOCALE, getStoredLocale } from "@/lib/locale";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ReferralProgram from "@/pages/ReferralProgram";

// Route-level code splitting: admin, group, and LMS pages load on demand.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CoursePlayer = lazy(() => import("@/pages/CoursePlayer"));
const GroupDashboard = lazy(() => import("@/pages/group/GroupDashboard"));
const ComplianceDashboard = lazy(() => import("@/pages/ComplianceDashboard"));
const GroupMembers = lazy(() => import("@/pages/group/GroupMembers"));
const GroupSeats = lazy(() => import("@/pages/group/GroupSeats"));
const GroupProgress = lazy(() => import("@/pages/group/GroupProgress"));
const GroupCertifications = lazy(() => import("@/pages/group/GroupCertifications"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminToday = lazy(() => import("@/pages/admin/AdminToday"));
const AdminMoney = lazy(() => import("@/pages/admin/AdminMoney"));
const AdminDiscounts = lazy(() => import("@/pages/admin/AdminDiscounts"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminCourses = lazy(() => import("@/pages/admin/AdminCourses"));
const AdminCourseEditor = lazy(() => import("@/pages/admin/AdminCourseEditor"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminEnrollments = lazy(() => import("@/pages/admin/AdminEnrollments"));
const AdminCertificates = lazy(() => import("@/pages/admin/AdminCertificates"));
const AdminCardOrders = lazy(() => import("@/pages/admin/AdminCardOrders"));
const AdminAuditLog = lazy(() => import("@/pages/admin/AdminAuditLog"));
const AdminEmailOutbox = lazy(() => import("@/pages/admin/AdminEmailOutbox"));
const AdminSeoPages = lazy(() => import("@/pages/admin/AdminSeoPages"));
const AdminSeoHealth = lazy(() => import("@/pages/admin/AdminSeoHealth"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminSessions = lazy(() => import("@/pages/admin/AdminSessions"));
const AdminOnsiteRequests = lazy(() => import("@/pages/admin/AdminOnsiteRequests"));
const AdminOnsiteRequestDetail = lazy(() => import("@/pages/admin/AdminOnsiteRequestDetail"));
const AdminLeads = lazy(() => import("@/pages/admin/AdminLeads"));
const AdminCompanies = lazy(() => import("@/pages/admin/AdminCompanies"));
const AdminCompanyDetail = lazy(() => import("@/pages/admin/AdminCompanyDetail"));
const AdminTrainingEvents = lazy(() => import("@/pages/admin/AdminTrainingEvents"));
const AdminTrainingEventCreate = lazy(() => import("@/pages/admin/AdminTrainingEventCreate"));
const AdminTrainingEventDetail = lazy(() => import("@/pages/admin/AdminTrainingEventDetail"));
const AdminReports = lazy(() => import("@/pages/admin/AdminReports"));
const AdminQuotes = lazy(() => import("@/pages/admin/AdminQuotes"));
const AdminQuoteCreate = lazy(() => import("@/pages/admin/AdminQuoteCreate"));
const AdminQuoteDetail = lazy(() => import("@/pages/admin/AdminQuoteDetail"));
const AdminInstructorApplications = lazy(() => import("@/pages/admin/AdminInstructorApplications"));
const AdminInstructorApplicationDetail = lazy(() => import("@/pages/admin/AdminInstructorApplicationDetail"));
const AdminInstructors = lazy(() => import("@/pages/admin/AdminInstructors"));
const AdminInstructorDetail = lazy(() => import("@/pages/admin/AdminInstructorDetail"));
const AuditBinder = lazy(() => import("@/pages/AuditBinder"));

function HydrationReveal() {
  useEffect(() => {
    document.documentElement.classList.add("hydrated");
  }, []);
  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function LocaleRedirect() {
  useEffect(() => {
    const path = window.location.pathname;
    const suffix = window.location.search + window.location.hash;
    if (path === "/") {
      const stored = getStoredLocale();
      const locale = stored || DEFAULT_LOCALE;
      history.replaceState(null, "", `/${locale}${suffix}`);
      window.dispatchEvent(new Event("replacestate"));
    } else if (!/^\/(en|es)(\/|$)/.test(path) && !path.startsWith("/api")) {
      const stored = getStoredLocale();
      const locale = stored || DEFAULT_LOCALE;
      history.replaceState(null, "", `/${locale}${path}${suffix}`);
      window.dispatchEvent(new Event("replacestate"));
    }
  }, []);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/get-certified" component={GetCertified} />
      <Route path="/online-forklift-certification" component={OnlineCertification} />
      <Route path="/training-programs" component={TrainingPrograms} />
      <Route path="/online-training" component={OnlineTraining} />
      <Route path="/hands-on-training" component={HandsOnTraining} />
      <Route path="/train-the-trainer" component={TrainTheTrainer} />
      <Route path="/business" component={Business} />
      <Route path="/business/products" component={BusinessProducts} />
      <Route path="/business/faq" component={BusinessFAQ} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/support" component={Support} />
      <Route path="/contact" component={Contact} />
      <Route path="/locations" component={LocationsHub} />
      <Route path="/locations/:slug">{(params: { slug: string }) => <LocationPage location={params.slug} />}</Route>
      <Route path="/service-areas" component={ServiceAreasHub} />
      <Route path="/service-areas/:city">{(params: { city: string }) => <ServiceAreaPage city={params.city} />}</Route>
      <Route path="/renewal" component={RenewalPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/in-person-training" component={InPersonTraining} />
      <Route path="/request-onsite-training">{() => <Redirect to="/request-quote" />}</Route>
      <Route path="/request-quote" component={RequestQuote} />
      <Route path="/book-training/:productSlug" component={BookTraining} />
      <Route path="/book-training" component={BookTraining} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogArticle} />
      <Route path="/p/:slug" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation/:orderId" component={OrderConfirmation} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/become-an-instructor">{() => <ProtectedRoute><BecomeAnInstructor /></ProtectedRoute>}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
      <Route path="/referral">{() => <ProtectedRoute><ReferralProgram /></ProtectedRoute>}</Route>
      <Route path="/course/:enrollmentId">{() => <ProtectedRoute><CoursePlayer /></ProtectedRoute>}</Route>
      <Route path="/certifications/:id">{() => <ProtectedRoute><Certification /></ProtectedRoute>}</Route>
      <Route path="/pay-balance/:bookingId" component={PayBalance} />
      <Route path="/verify" component={CertificateVerify} />
      <Route path="/verify/:certificateNumber" component={CertificateVerify} />
      <Route path="/order-cert-card/:certificationId">{() => <ProtectedRoute><OrderCertCard /></ProtectedRoute>}</Route>
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/osha-compliance" component={OshaCompliance} />
      <Route path="/group">{() => <ProtectedRoute roles={["group_admin", "admin", "super_admin"]}><GroupDashboard /></ProtectedRoute>}</Route>
      <Route path="/group/members">{() => <ProtectedRoute roles={["group_admin", "admin", "super_admin"]}><GroupMembers /></ProtectedRoute>}</Route>
      <Route path="/group/seats">{() => <ProtectedRoute roles={["group_admin", "admin", "super_admin"]}><GroupSeats /></ProtectedRoute>}</Route>
      <Route path="/group/progress">{() => <ProtectedRoute roles={["group_admin", "admin", "super_admin"]}><GroupProgress /></ProtectedRoute>}</Route>
      <Route path="/group/certifications">{() => <ProtectedRoute roles={["group_admin", "admin", "super_admin"]}><GroupCertifications /></ProtectedRoute>}</Route>
      <Route path="/compliance-dashboard">{() => <ProtectedRoute roles={["group_admin", "admin", "super_admin"]}><ComplianceDashboard /></ProtectedRoute>}</Route>
      <Route path="/audit-binder/:companyId">{() => <ProtectedRoute roles={["group_admin", "admin", "super_admin"]}><AuditBinder /></ProtectedRoute>}</Route>
      <Route path="/admin">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminToday /></ProtectedRoute>}</Route>
      <Route path="/admin/today">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminToday /></ProtectedRoute>}</Route>
      <Route path="/admin/overview">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminDashboard /></ProtectedRoute>}</Route>
      <Route path="/admin/money">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminMoney /></ProtectedRoute>}</Route>
      <Route path="/admin/discounts">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminDiscounts /></ProtectedRoute>}</Route>
      <Route path="/admin/users">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminUsers /></ProtectedRoute>}</Route>
      <Route path="/admin/courses">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminCourses /></ProtectedRoute>}</Route>
      <Route path="/admin/courses/new">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminCourseEditor /></ProtectedRoute>}</Route>
      <Route path="/admin/courses/:id/edit">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminCourseEditor /></ProtectedRoute>}</Route>
      <Route path="/admin/orders">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminOrders /></ProtectedRoute>}</Route>
      <Route path="/admin/enrollments">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminEnrollments /></ProtectedRoute>}</Route>
      <Route path="/admin/certificates">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminCertificates /></ProtectedRoute>}</Route>
      <Route path="/admin/card-orders">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminCardOrders /></ProtectedRoute>}</Route>
      <Route path="/admin/audit-log">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminAuditLog /></ProtectedRoute>}</Route>
      <Route path="/admin/email-outbox">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminEmailOutbox /></ProtectedRoute>}</Route>
      <Route path="/admin/seo-pages">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminSeoPages /></ProtectedRoute>}</Route>
      <Route path="/admin/seo-health">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminSeoHealth /></ProtectedRoute>}</Route>
      <Route path="/admin/bookings">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminBookings /></ProtectedRoute>}</Route>
      <Route path="/admin/sessions">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminSessions /></ProtectedRoute>}</Route>
      <Route path="/admin/leads">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminLeads /></ProtectedRoute>}</Route>
      <Route path="/admin/companies/:id">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminCompanyDetail /></ProtectedRoute>}</Route>
      <Route path="/admin/companies">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminCompanies /></ProtectedRoute>}</Route>
      <Route path="/admin/reports">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminReports /></ProtectedRoute>}</Route>
      <Route path="/admin/quotes/new">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminQuoteCreate /></ProtectedRoute>}</Route>
      <Route path="/admin/quotes/:id">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminQuoteDetail /></ProtectedRoute>}</Route>
      <Route path="/admin/quotes">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminQuotes /></ProtectedRoute>}</Route>
      <Route path="/admin/training-events/new">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminTrainingEventCreate /></ProtectedRoute>}</Route>
      <Route path="/admin/training-events/:id">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminTrainingEventDetail /></ProtectedRoute>}</Route>
      <Route path="/admin/training-events">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminTrainingEvents /></ProtectedRoute>}</Route>
      <Route path="/admin/onsite-requests/:id">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminOnsiteRequestDetail /></ProtectedRoute>}</Route>
      <Route path="/admin/onsite-requests">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminOnsiteRequests /></ProtectedRoute>}</Route>
      <Route path="/admin/instructor-applications/:id">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminInstructorApplicationDetail /></ProtectedRoute>}</Route>
      <Route path="/admin/instructor-applications">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminInstructorApplications /></ProtectedRoute>}</Route>
      <Route path="/admin/instructors/:id">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminInstructorDetail /></ProtectedRoute>}</Route>
      <Route path="/admin/instructors">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminInstructors /></ProtectedRoute>}</Route>
      <Route path="/:slug*" component={SeoPageRenderer} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <DemoBanner />
        <ScrollToTop />
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-14 lg:pb-0">
      <SEOHead
        title={`${brand.name} | ${industry.regulatory.body}-Aligned Forklift Training & Certification`}
        description={`Get your forklift certification in San Diego — in-person at our facility or on-site at your location. ${industry.regulatory.body}-aligned programs with same-day certification.`}
      />
      <DemoBanner />
      <LanguageBanner />
      <Header />
      <main className="flex-1">
        <ScrollToTop />
        <AppRoutes />
      </main>
      <Footer />
      <MobileCtaBar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Router hook={useLocaleLocation}>
            <ThemeInjector />
            <HydrationReveal />
            <LocaleRedirect />
            <AppContent />
            <Toaster />
          </Router>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
