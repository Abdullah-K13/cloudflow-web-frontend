import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FileText, Scale, AlertTriangle, CheckCircle, Mail } from "lucide-react";

export const metadata = {
  title: "Terms of Service | CloudFlow",
  description: "CloudFlow Terms of Service - Read our terms and conditions for using our platform.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none space-y-8">
          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              1. Acceptance of Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                By accessing and using CloudFlow ("the Service"), you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              2. Use License
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Permission is granted to temporarily use CloudFlow for personal and commercial purposes. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose without explicit written permission</li>
                <li>Attempt to reverse engineer or decompile any software contained in the Service</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
              3. Account Registration and Security
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and identification</li>
                <li>Accept all responsibility for activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Acceptable Use
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any malicious code, viruses, or harmful data</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Deploy infrastructure that violates cloud provider terms of service</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Cloud Provider Credentials and Responsibility
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the security of your cloud provider credentials</li>
                <li>All costs incurred through your cloud provider accounts</li>
                <li>Compliance with your cloud provider's terms of service</li>
                <li>Any infrastructure deployed through the Service</li>
                <li>Backing up your data and configurations</li>
              </ul>
              <p className="mt-4">
                CloudFlow acts as a deployment tool and is not responsible for costs, security breaches, 
                or issues arising from your cloud infrastructure.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Subscription and Billing
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you purchase a subscription to the Service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>You may cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>We reserve the right to change our pricing with 30 days' notice</li>
                <li>Failure to pay may result in suspension or termination of your account</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Intellectual Property
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The Service and its original content, features, and functionality are owned by CloudFlow 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws.
              </p>
              <p>
                You retain ownership of any content, data, or configurations you create using the Service. 
                By using the Service, you grant CloudFlow a license to use, store, and process your 
                content solely for the purpose of providing the Service.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Disclaimer of Warranties
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF 
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that the Service will be uninterrupted, secure, or error-free, or that 
                defects will be corrected.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Limitation of Liability
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                IN NO EVENT SHALL CLOUDFLOW, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT 
                LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING 
                FROM YOUR USE OF THE SERVICE.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Termination
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We may terminate or suspend your account and access to the Service immediately, without 
                prior notice or liability, for any reason, including if you breach the Terms. Upon 
                termination, your right to use the Service will immediately cease.
              </p>
              <p>
                You may terminate your account at any time by canceling your subscription and contacting 
                us to delete your account.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Changes to Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any 
                time. If a revision is material, we will provide at least 30 days' notice prior to any 
                new terms taking effect.
              </p>
              <p>
                By continuing to access or use our Service after those revisions become effective, you 
                agree to be bound by the revised terms.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              12. Governing Law
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                These Terms shall be governed and construed in accordance with the laws, without regard 
                to its conflict of law provisions. Our failure to enforce any right or provision of 
                these Terms will not be considered a waiver of those rights.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              13. Contact Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-foreground">CloudFlow Legal Team</p>
                <p>
                  Email:{" "}
                  <a href="mailto:legal@cloudflow.dev" className="text-primary hover:underline">
                    legal@cloudflow.dev
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

