import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CyberLogo from "@/components/CyberLogo";
import { Shield, Search, Mail, Lock, FileSearch, Code } from "lucide-react";

const features = [
  { icon: Search, title: "URL Scanning", description: "Deep and shallow URL analysis for threats" },
  { icon: Mail, title: "Email Check", description: "Verify if emails have been compromised" },
  { icon: Lock, title: "Password Check", description: "Check if passwords appear in breaches" },
  { icon: FileSearch, title: "File Analysis", description: "Upload and analyze suspicious files" },
  { icon: Code, title: "API Access", description: "Developer-friendly REST API endpoints" },
  { icon: Shield, title: "Real-time Protection", description: "Continuous monitoring and alerts" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">CYBER BRIEF</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button variant="cyber">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto animate-slide-in">
            <CyberLogo size="lg" />
            <p className="text-xl text-muted-foreground mt-6 mb-8">
              Your all-in-one cybersecurity toolkit. Scan URLs, check compromised credentials, 
              analyze files, and protect your digital presence.
            </p>
            <div className="flex items-center justify-center">
              <Link to="/dashboard">
                <Button variant="outline" size="xl">
                  View Dash Board
                </Button>
              </Link>
            </div>
          </div> 
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful Security Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="cyber-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-20">
          <div className="cyber-card text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Secure Your Digital Life?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of users who trust Cyber Brief for their cybersecurity needs.
            </p>
            <Link to="/signup">
              <Button variant="cyber" size="xl">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2024 Cyber Brief. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
