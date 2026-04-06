import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CyberLogo from "@/components/CyberLogo";
import { toast } from "@/hooks/use-toast";
import { register, googleLogin } from "@/lib/api";

const Signup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const extractApiMessage = (data: unknown): string | undefined => {
    if (!data || typeof data !== "object") return undefined;
    const payload = data as Record<string, unknown>;
    const raw = payload.message ?? payload.Message;
    return typeof raw === "string" ? raw : undefined;
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
    console.log("Signup.handleSubmit", { firstName, lastName, email });
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    if (!agreeTerms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await register(firstName, lastName, email, password);

      const message: string | undefined = res?.data?.message;

      // If backend indicates email already exists, show destructive toast and stop
      if (message && message.toLowerCase().includes("already")) {
        toast({ title: "Registration failed", description: message, variant: "destructive" });
        return;
      }

      // Otherwise assume registration succeeded and user must confirm email
      toast({ title: "Success", description: message || "Registration successful. Check your email." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh flex">
      {/* Left side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-in">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Create an Account 👋
          </h2>
          <p className="text-muted-foreground mb-8">
            Kindly fill in your details to create an account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">First name*</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="cyber-input"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Last name*</label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="cyber-input"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Email address*
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cyber-input"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Create password*
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAgreeTerms(!agreeTerms)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  agreeTerms
                    ? "bg-primary border-primary"
                    : "border-muted-foreground hover:border-primary"
                }`}
              >
                {agreeTerms && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              <span className="text-sm text-muted-foreground">
                I agree to terms & conditions
              </span>
            </div>

            {/* Register Button */}
            <Button type="submit" variant="cyber" size="lg" className="w-full bg-indigo-500 hover:bg-indigo-600">
              Register Account
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-sm">Or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                type="icon"
                shape="circle"
                theme="filled_black"
              />
            </div>

            {/* Login Link */}
            <p className="text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right side - Logo */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8">
        <div className="text-foreground">
          <CyberLogo size="lg" />
        </div>
      </div>
    </div>
  );
};

export default Signup;
