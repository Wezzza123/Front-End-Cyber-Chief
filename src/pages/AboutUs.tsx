import DashboardLayout from "@/components/DashboardLayout";

const AboutUs = () => {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 gradient-mesh min-h-full relative">
        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <div className="cyber-card">
            <h1 className="text-2xl font-bold mb-3">About Us</h1>
            <p className="text-sm text-muted-foreground mb-6">
              CyberShield is an all-in-one cybersecurity toolkit. Scan URLs, check compromised
              credentials, analyze files, and protect your digital presence.
            </p>

            <div className="space-y-5">
              <section>
                <h2 className="text-lg font-semibold mb-2">What we provide</h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                  <li>URL scanning (shallow and deep analysis)</li>
                  <li>Email check for exposure & breach detection</li>
                  <li>Password check for strength and breach signals</li>
                  <li>File analysis for suspicious content</li>
                  <li>Developer-friendly API access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-2">Designed for clarity</h2>
                <p className="text-sm text-muted-foreground">
                  Results are presented in a simple, actionable way so you can understand risk and
                  take next steps quickly—whether you are using the web UI or calling the API
                  endpoints directly.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-2">Built around your workflow</h2>
                <p className="text-sm text-muted-foreground">
                  The dashboard helps you manage scans and review recent checks in one place. You
                  can start new scans, track history, and download reports when available.
                </p>
              </section>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">
              Need help? Use the “Contact Us” option in the sidebar.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AboutUs;

