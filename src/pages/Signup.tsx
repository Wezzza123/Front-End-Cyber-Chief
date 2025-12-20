import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CyberLogo from "@/components/CyberLogo";
import { toast } from "@/hooks/use-toast";

const Signup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
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
    toast({
      title: "Success",
      description: "Account created successfully!",
    });
    navigate("/dashboard");
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
            {/* Full Name */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Your fullname*
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="cyber-input"
              />
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
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="w-14 h-14 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">f</span>
              </button>
              <button
                type="button"
                className="w-14 h-14 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl text-red-500">G</span>
              </button>
              <button
                type="button"
                className="w-14 h-14 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl"></span>
              </button>
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
