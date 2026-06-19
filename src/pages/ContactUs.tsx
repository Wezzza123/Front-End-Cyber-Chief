import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Phone, MessageSquare, Clock } from "lucide-react";

const channels: Array<{
  icon: typeof Mail;
  channel: string;
  detail: string;
  availability: string;
}> = [
  {
    icon: Mail,
    channel: "Email support",
    detail: "support@cybershield.tecisfun.cloud",
    availability: "24/7 — replies within 24h",
  },
  {
    icon: Phone,
    channel: "Phone",
    detail: "+20 100 000 0000",
    availability: "Sun–Thu, 9:00–17:00 (GMT+2)",
  },
  {
    icon: MessageSquare,
    channel: "Live chat",
    detail: "Available from the dashboard",
    availability: "Sun–Thu, 9:00–17:00 (GMT+2)",
  },
  {
    icon: Clock,
    channel: "Status & uptime",
    detail: "status.cybershield.tecisfun.cloud",
    availability: "Realtime",
  },
];

const topics: Array<{ topic: string; goTo: string }> = [
  { topic: "Account or sign-in issues", goTo: "Email support with your account email" },
  { topic: "Scan not completing / report missing", goTo: "Email support with the target URL" },
  { topic: "API access & integration", goTo: "See the API Access page, then email us" },
  { topic: "Billing & plans", goTo: "Email support with 'Billing' in the subject" },
  { topic: "Report a security issue", goTo: "Email support with 'Security' in the subject" },
];

const ContactUs = () => {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 gradient-mesh min-h-full relative">
        <div className="relative z-10 max-w-3xl mx-auto w-full space-y-6">
          {/* Contact channels */}
          <div className="cyber-card">
            <h1 className="text-2xl font-bold mb-1">Contact Us</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Reach the CyberShield team through any of the channels below.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((c) => (
                  <TableRow key={c.channel}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <c.icon className="w-4 h-4 text-primary" />
                        {c.channel}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground break-all">
                      {c.detail}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.availability}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Where to go for common topics */}
          <div className="cyber-card">
            <h2 className="text-lg font-semibold mb-1">Common topics</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Not sure who to ask? Find your topic below.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Topic</TableHead>
                  <TableHead>What to do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((t) => (
                  <TableRow key={t.topic}>
                    <TableCell className="font-medium">{t.topic}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.goTo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContactUs;
