import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CyberLogo from "@/components/CyberLogo";
import { toast } from "@/hooks/use-toast";
import { confirmEmail, login, googleLogin } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const extractApiMessage = (data: unknown): string | undefined => {
    if (!data || typeof data !== "object") return undefined;
    const payload = data as Record<string, unknown>;
    const raw = payload.message ?? payload.Message;
    return typeof raw === "string" ? raw : undefined;
  };

  useEffect(() => {
    if (!userId || !token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await confirmEmail(userId, token);
        if (cancelled) return;

        const message = res?.data?.message;
        if (!res?.ok) {
          toast({
            title: "Email confirmation failed",
            description: message || "Invalid or expired token.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: message || "Email confirmed. Please log in.",
        });
        navigate("/login", { replace: true });
      } catch (err: any) {
        if (cancelled) return;
        toast({
          title: "Email confirmation failed",
          description: err?.message || "Unable to confirm email.",
          variant: "destructive",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, token, userId]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsEmailValid(validateEmail(value));
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }
      const res = await googleLogin(credentialResponse.credential);
      const message = extractApiMessage(res?.data);

      if (!res?.ok) {
        toast({ title: "Google Login failed", description: message || "Failed to authenticate with Google", variant: "destructive" });
        return;
      }

      const token = res?.data?.token || null;
      if (!token) {
        toast({ title: "Google Login failed", description: message || "Invalid token received", variant: "destructive" });
        return;
      }

      localStorage.setItem("auth_token", token);
      toast({ title: "Success", description: message || "Logged in with Google" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Google Login failed", description: err?.message || "Invalid credentials", variant: "destructive" });
    }
  };

  const handleGoogleError = () => {
    toast({ title: "Google Login failed", description: "Could not authenticate with Google", variant: "destructive" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Login.handleSubmit", { email });
    e.preventDefault();
    if (!isEmailValid || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields correctly",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await login(email, password);

      const message = extractApiMessage(res?.data);

      if (message?.toLowerCase().includes("confirm your email")) {
        toast({
          title: "Email confirmation required",
          description: message,
          variant: "destructive",
        });
        return;
      }

      // If API responded but not ok, show message
      if (!res?.ok) {
        toast({ title: "Login failed", description: message || "Invalid email or password.", variant: "destructive" });
        return;
      }

      const token = res?.data?.token || null;
      if (!token) {
        toast({ title: "Login failed", description: message || "Invalid email or password.", variant: "destructive" });
        return;
      }

      localStorage.setItem("auth_token", token);
      toast({ title: "Success", description: message || "Logged in" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.message || "Invalid credentials", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 bg-card flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        
        <div className="w-full max-w-md relative z-10 animate-slide-in">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Login
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={handleEmailChange}
                className="cyber-input pl-12 pr-12"
              />
              {isEmailValid && (
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cyber-input pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-left">
              <Link to="/forgot-password" className="text-primary hover:text-primary/80 text-sm transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button type="submit" variant="cyber-white" size="lg" className="w-full">
              Log in
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-sm">Or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                type="icon"
                shape="circle"
                theme="filled_black"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Sign Up CTA */}
      <div className="hidden lg:flex flex-1 bg-white items-center justify-center p-8">
        <div className="text-center animate-slide-in">
          <div className="text-gray-900 mb-8">
            <CyberLogo size="lg" />
          </div>
          
          <Link to="/signup">
            <Button variant="cyber-dark" size="lg" className="w-48">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
