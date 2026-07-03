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
import Dashboard from "@/pages/Dashboard";
import CoursePlayer from "@/pages/CoursePlayer";
import Certification from "@/pages/Certification";
import CertificateVerify from "@/pages/CertificateVerify";
import OrderCertCard from "@/pages/OrderCertCard";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import RefundPolicy from "@/pages/RefundPolicy";
import OshaCompliance from "@/pages/OshaCompliance";
import GroupDashboard from "@/pages/group/GroupDashboard";
import GroupMembers from "@/pages/group/GroupMembers";
import GroupSeats from "@/pages/group/GroupSeats";
import GroupProgress from "@/pages/group/GroupProgress";
import GroupCertifications from "@/pages/group/GroupCertifications";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminCourseEditor from "@/pages/admin/AdminCourseEditor";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminEnrollments from "@/pages/admin/AdminEnrollments";
import AdminCertificates from "@/pages/admin/AdminCertificates";
import AdminCardOrders from "@/pages/admin/AdminCardOrders";
import AdminAuditLog from "@/pages/admin/AdminAuditLog";
import AdminEmailOutbox from "@/pages/admin/AdminEmailOutbox";
import AdminSeoPages from "@/pages/admin/AdminSeoPages";
import AdminSeoHealth from "@/pages/admin/AdminSeoHealth";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminSessions from "@/pages/admin/AdminSessions";
import AdminOnsiteRequests from "@/pages/admin/AdminOnsiteRequests";
import AdminOnsiteRequestDetail from "@/pages/admin/AdminOnsiteRequestDetail";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminCompanies from "@/pages/admin/AdminCompanies";
import AdminCompanyDetail from "@/pages/admin/AdminCompanyDetail";
import AdminTrainingEvents from "@/pages/admin/AdminTrainingEvents";
import AdminTrainingEventCreate from "@/pages/admin/AdminTrainingEventCreate";
import AdminTrainingEventDetail from "@/pages/admin/AdminTrainingEventDetail";
import AdminReports from "@/pages/admin/AdminReports";
import AdminQuotes from "@/pages/admin/AdminQuotes";
import AdminQuoteCreate from "@/pages/admin/AdminQuoteCreate";
import AdminQuoteDetail from "@/pages/admin/AdminQuoteDetail";
import AdminInstructorApplications from "@/pages/admin/AdminInstructorApplications";
import AdminInstructorApplicationDetail from "@/pages/admin/AdminInstructorApplicationDetail";
import AdminInstructors from "@/pages/admin/AdminInstructors";
import AdminInstructorDetail from "@/pages/admin/AdminInstructorDetail";
import RequestOnsiteTraining from "@/pages/RequestOnsiteTraining";
import RequestQuote from "@/pages/RequestQuote";
import InPersonTraining from "@/pages/InPersonTraining";
import BecomeAnInstructor from "@/pages/BecomeAnInstructor";
import ProtectedRoute from "@/components/ProtectedRoute";
import SeoPageRenderer from "@/pages/seo/SeoPageRenderer";
import BookTraining from "@/pages/BookTraining";
import LocationsHub from "@/pages/LocationsHub";
import { CartProvider } from "@/contexts/CartContext";
import DemoBanner from "@/components/DemoBanner";
import SEOHead from "@/components/seo/SEOHead";
import { useEffect } from "react";
import { useLocation } from "wouter";
import LanguageBanner from "@/components/LanguageBanner";
import { useLocaleLocation } from "@/hooks/useLocaleLocation";
import { DEFAULT_LOCALE, getStoredLocale } from "@/lib/locale";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/course/:enrollmentId">{() => <ProtectedRoute><CoursePlayer /></ProtectedRoute>}</Route>
      <Route path="/certifications/:id">{() => <ProtectedRoute><Certification /></ProtectedRoute>}</Route>
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
      <Route path="/admin">{() => <ProtectedRoute roles={["admin", "super_admin"]}><AdminDashboard /></ProtectedRoute>}</Route>
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
    <div className="min-h-screen flex flex-col bg-background">
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
