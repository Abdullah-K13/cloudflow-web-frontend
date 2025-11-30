import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, Eye, FileText, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | CloudFlow",
  description: "CloudFlow Privacy Policy - Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none space-y-8">
          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                At CloudFlow, we collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email address, password)</li>
                <li>Payment and billing information (processed securely through third-party providers)</li>
                <li>Cloud provider credentials (encrypted and stored securely)</li>
                <li>Pipeline configurations and infrastructure designs</li>
                <li>Usage data and analytics to improve our services</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              2. How We Use Your Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical issues</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              3. Data Security
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure storage of cloud provider credentials</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Compliance with industry security standards</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. 
                While we strive to use commercially acceptable means to protect your information, we cannot 
                guarantee absolute security.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              4. Data Sharing and Disclosure
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We do not sell your personal information. We may share your information only:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or respond to lawful requests</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>With service providers who assist us in operating our platform (under strict confidentiality agreements)</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Your Rights and Choices
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete information</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@cloudflow.dev" className="text-primary hover:underline">
                  privacy@cloudflow.dev
                </a>
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Cookies and Tracking Technologies
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and 
                hold certain information. You can instruct your browser to refuse all cookies or to indicate 
                when a cookie is being sent.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Third-Party Services
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Our platform integrates with third-party cloud providers (AWS, Azure, GCP) and services. 
                When you use these integrations, your data may be processed by these third parties according 
                to their privacy policies. We are not responsible for the privacy practices of these third parties.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Children's Privacy
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Our services are not intended for individuals under the age of 18. We do not knowingly 
                collect personal information from children. If you become aware that a child has provided 
                us with personal information, please contact us immediately.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              10. Contact Us
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-foreground">CloudFlow Privacy Team</p>
                <p>
                  Email:{" "}
                  <a href="mailto:privacy@cloudflow.dev" className="text-primary hover:underline">
                    privacy@cloudflow.dev
                  </a>
                </p>
                <p>
                  General inquiries:{" "}
                  <a href="mailto:hello@cloudflow.dev" className="text-primary hover:underline">
                    hello@cloudflow.dev
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

