import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AuthProvider } from "@/hooks/useAuth";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import ServiceCSR from "./pages/ServiceCSR";
import ServiceSolar from "./pages/ServiceSolar";
import ServiceProperty from "./pages/ServiceProperty";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Membership from "./pages/Membership";
import Apply from "./pages/Apply";
import MyProfile from "./pages/MyProfile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLeads from "./pages/admin/Leads";
import AdminMembers from "./pages/admin/Members";
import AdminApplications from "./pages/admin/Applications";
import AdminServices from "./pages/admin/Services";
import AdminProjects from "./pages/admin/Projects";
import AdminPages from "./pages/admin/Pages";
import AdminMedia from "./pages/admin/Media";
import AdminSeo from "./pages/admin/Seo";
import AdminHeaderFooter from "./pages/admin/HeaderFooter";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const Shell = () => {
  const { pathname } = useLocation();
  const isBare = pathname.startsWith("/admin") || pathname === "/auth";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!isBare && <Header />}
      <main className={`flex-1 ${!isBare ? "pb-[calc(env(safe-area-inset-bottom)+64px)] md:pb-0" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/csr" element={<ServiceCSR />} />
          <Route path="/services/solar" element={<ServiceSolar />} />
          <Route path="/services/property" element={<ServiceProperty />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/join-us" element={<Membership />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/pages" element={<AdminPages />} />
          <Route path="/admin/media" element={<AdminMedia />} />
          <Route path="/admin/seo" element={<AdminSeo />} />
          <Route path="/admin/header-footer" element={<AdminHeaderFooter />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isBare && <Footer />}
      {!isBare && <WhatsAppFloat />}
      {!isBare && <MobileBottomNav />}
    </div>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Shell />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
