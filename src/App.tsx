import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UrlShallowScan from "./pages/UrlShallowScan";
import EmailCheck from "./pages/EmailCheck";
import PasswordCheck from "./pages/PasswordCheck";
import FileUpload from "./pages/FileUpload";
import SubmitUrl from "./pages/SubmitUrl";
import ScanContainer from "./pages/ScanContainer";
import ScanWebsite from "./pages/ScanWebsite";
import ApiAccess from "./pages/ApiAccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AboutUs from "./pages/AboutUs";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import ConfirmEmail from "./pages/ConfirmEmail";
import RecentUrls from "./pages/RecentUrls";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recent-urls" element={<RecentUrls />} />
          <Route path="/url-shallow" element={<UrlShallowScan />} />
          <Route path="/url-deep" element={<SubmitUrl />} />
          <Route path="/email-check" element={<EmailCheck />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/password-check" element={<PasswordCheck />} />
          <Route path="/file-upload" element={<FileUpload />} />
          <Route path="/scan-container" element={<ScanContainer />} />
          <Route path="/scan-website" element={<ScanWebsite />} />
          <Route path="/api-access" element={<ApiAccess />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/accounts" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/contact" element={<Dashboard />} />
          <Route path="/wallets" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
