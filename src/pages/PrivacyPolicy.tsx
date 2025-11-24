import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">TaxWise</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">TAXWISE BY KOETA</h2>
            <p className="text-muted-foreground">TERMS OF USE AND PRIVACY POLICY</p>
            <p className="text-sm text-muted-foreground mt-2">
              Effective Date: October 10, 2025<br />
              Last Updated: October 10, 2025
            </p>
          </div>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">1. INTRODUCTION AND ACCEPTANCE OF TERMS</h3>
            <h4 className="font-semibold mb-2">1.1 About TaxWise</h4>
            <p className="mb-4">
              TaxWise is an application developed and operated by Koeta Limited, designed to help individuals and businesses in Nigeria calculate their taxes for filing purposes. By accessing or using TaxWise, you ("User," "you," or "your") agree to be bound by these Terms of Use ("Terms").
            </p>

            <h4 className="font-semibold mb-2">1.2 Acceptance</h4>
            <p className="mb-4">
              By creating an account, accessing, or using any part of the TaxWise App, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not use the App.
            </p>

            <h4 className="font-semibold mb-2">1.3 Amendments</h4>
            <p className="mb-4">
              Koeta reserves the right to modify these Terms at any time. We will notify you of material changes via email or in-app notification. Your continued use of the App after such modifications constitutes acceptance of the updated Terms.
            </p>

            <h4 className="font-semibold mb-2">1.4 Eligibility</h4>
            <p className="mb-4">
              You must be at least 18 years old and legally capable of entering into binding contracts under Nigerian law to use TaxWise. By using the App, you represent and warrant that you meet these requirements.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">2. SERVICES PROVIDED</h3>
            <h4 className="font-semibold mb-2">2.1 Core Features</h4>
            <p className="mb-4">TaxWise provides the following services:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Income and expense tracking and categorization</li>
              <li>Tax calculation assistance based on Nigerian tax laws</li>
              <li>Financial record keeping and organization</li>
              <li>Tax filing preparation support</li>
              <li>Data export functionality</li>
              <li>Multi-Factor Authentication (MFA) for enhanced security</li>
              <li>Cloud-based data synchronization</li>
            </ul>

            <h4 className="font-semibold mb-2">2.2 Not Professional Tax Advice</h4>
            <p className="mb-4">
              <strong>Important:</strong> TaxWise is a financial tracking tool and does not provide professional tax, legal, or financial advice. The App provides information and calculations based on publicly available tax regulations, but we are not tax advisors, accountants, or lawyers. You should consult qualified professionals for specific tax advice.
            </p>

            <h4 className="font-semibold mb-2">2.3 Accuracy of Information</h4>
            <p className="mb-4">
              While we strive to provide accurate information based on current Nigerian tax laws and regulations, we do not guarantee the accuracy, completeness, or timeliness of any information provided through the App. Tax laws change regularly, and users are responsible for verifying all information.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">3. USER ACCOUNTS AND SECURITY</h3>
            <h4 className="font-semibold mb-2">3.1 Account Creation</h4>
            <p className="mb-4">To use TaxWise, you must create an account by providing:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Valid email address</li>
              <li>Full name</li>
              <li>Secure password meeting our security requirements (minimum 12 characters, with uppercase, lowercase, numbers, and special characters)</li>
              <li>Phone number (optional)</li>
            </ul>

            <h4 className="font-semibold mb-2">3.2 Account Security Obligations</h4>
            <p className="mb-4">You are responsible for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Immediately notifying us of any unauthorized access or security breach</li>
              <li>Using strong, unique passwords</li>
              <li>Enabling Multi-Factor Authentication (MFA) when prompted for sensitive operations</li>
            </ul>

            <h4 className="font-semibold mb-2">3.3 Account Verification</h4>
            <p className="mb-4">
              We may require email verification before granting full access. Failure to verify within a reasonable timeframe may result in limited functionality or account suspension.
            </p>

            <h4 className="font-semibold mb-2">3.4 Multi-Factor Authentication (MFA)</h4>
            <p className="mb-4">
              Certain sensitive features (e.g., downloading tax documents, viewing sensitive financial data) require MFA. You agree to set up and maintain MFA access when required. We may enforce mandatory MFA after three (3) declined prompts for security purposes.
            </p>

            <h4 className="font-semibold mb-2">3.5 Account Suspension and Termination</h4>
            <p className="mb-4">We reserve the right to suspend or terminate your account if you:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violate these Terms</li>
              <li>Provide false or misleading information</li>
              <li>Engage in fraudulent activities</li>
              <li>Attempt to compromise the App's security</li>
              <li>Fail to respond to verification requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">4. DATA PRIVACY AND PROTECTION</h3>
            <h4 className="font-semibold mb-2">4.1 Legal Compliance</h4>
            <p className="mb-4">TaxWise complies with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Nigeria Data Protection Regulation (NDPR) 2019</li>
              <li>Cybercrimes (Prohibition, Prevention, etc.) Act 2015</li>
              <li>Nigerian Communications Act 2003</li>
              <li>Central Bank of Nigeria (CBN) Guidelines on Electronic Banking</li>
              <li>Federal Competition and Consumer Protection Act 2018</li>
            </ul>

            <h4 className="font-semibold mb-2">4.2 Data We Collect</h4>
            <h5 className="font-semibold mb-2">4.2.1 Personal Information</h5>
            <ul className="list-disc pl-6 mb-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Financial data (income, expenses, tax information)</li>
              <li>Employment information</li>
              <li>Bank account details (if provided)</li>
              <li>Device information and IP address</li>
              <li>Login history and device fingerprints</li>
            </ul>

            <h5 className="font-semibold mb-2">4.2.2 Automatically Collected Data</h5>
            <ul className="list-disc pl-6 mb-4">
              <li>Device type, operating system, and version</li>
              <li>App usage analytics</li>
              <li>IP address and location data (city/state level)</li>
              <li>Session duration and interaction patterns</li>
              <li>Error logs and crash reports</li>
            </ul>

            <h4 className="font-semibold mb-2">4.3 How We Use Your Data</h4>
            <p className="mb-4">We use your data to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide, maintain, and improve the App</li>
              <li>Process financial tracking and tax calculations</li>
              <li>Send important notifications</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Respond to support requests</li>
              <li>Conduct security monitoring</li>
            </ul>

            <h4 className="font-semibold mb-2">4.4 Data Storage and Security</h4>
            <h5 className="font-semibold mb-2">4.4.1 Security Measures</h5>
            <p className="mb-4">We implement:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>TLS 1.3 encryption</li>
              <li>AES-256 encrypted storage</li>
              <li>MFA and bcrypt password hashing</li>
              <li>Regular security audits</li>
              <li>Anomaly detection and rate limiting</li>
              <li>Auto session timeout after 15 minutes</li>
            </ul>

            <h5 className="font-semibold mb-2">4.4.2 Data Location</h5>
            <p className="mb-4">
              Data is securely stored on Supabase cloud servers compliant with international security standards.
            </p>

            <h5 className="font-semibold mb-2">4.4.3 Data Retention</h5>
            <ul className="list-disc pl-6 mb-4">
              <li>90 days: Personal/financial data (for recovery)</li>
              <li>7 years: Tax-related data (legal compliance)</li>
              <li>Indefinitely: Anonymized analytics data</li>
            </ul>

            <h4 className="font-semibold mb-2">4.5 Data Sharing and Disclosure</h4>
            <h5 className="font-semibold mb-2">4.5.1 We DO NOT Sell Your Data</h5>
            <p className="mb-4">We never sell, rent, or trade personal information.</p>

            <h5 className="font-semibold mb-2">4.5.2 Limited Sharing</h5>
            <p className="mb-4">We may share data with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Service providers (Supabase, analytics, notifications)</li>
              <li>Legal authorities (when required)</li>
              <li>During mergers or acquisitions (with prior notice)</li>
            </ul>

            <h5 className="font-semibold mb-2">4.5.3 Third-Party Services</h5>
            <p className="mb-4">The App integrates with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Supabase (database & authentication)</li>
              <li>IP geolocation services</li>
              <li>Push notification platforms</li>
            </ul>

            <h4 className="font-semibold mb-2">4.6 Your Data Rights (NDPR Compliance)</h4>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccuracies</li>
              <li>Request deletion (subject to legal retention)</li>
              <li>Receive data portability exports</li>
              <li>Object to specific processing</li>
              <li>Withdraw consent</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact: <a href="mailto:privacy@koeta.io" className="text-primary">privacy@koeta.io</a>
            </p>
            <p className="mb-4">We respond within 30 days as required by NDPR.</p>

            <h4 className="font-semibold mb-2">4.7 Data Breach Notification</h4>
            <p className="mb-4">If a data breach occurs, Koeta will:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Notify you within 72 hours</li>
              <li>Report to the Nigeria Data Protection Bureau (NDPB)</li>
              <li>Disclose details and mitigation steps</li>
            </ul>

            <h4 className="font-semibold mb-2">4.8 Children's Privacy</h4>
            <p className="mb-4">
              TaxWise is not for users under 18. If we discover data from minors, we delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">5. USER RESPONSIBILITIES AND PROHIBITED CONDUCT</h3>
            <p className="mb-4">You agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate information</li>
              <li>Use the App lawfully</li>
              <li>Avoid fraudulent, malicious, or illegal activities</li>
            </ul>
            <p className="mb-4">Prohibited activities include:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Tax evasion, hacking, or spreading malware</li>
              <li>Sharing account credentials</li>
              <li>Using bots or automated scrapers</li>
              <li>Misrepresenting your identity</li>
              <li>Violating intellectual property rights</li>
              <li>Harassment or abuse</li>
            </ul>
            <p className="mb-4">Violations may lead to suspension, legal action, or reporting to law enforcement.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">6. INTELLECTUAL PROPERTY RIGHTS</h3>
            <p className="mb-4">
              All intellectual property in TaxWise (software, design, trademarks, content) belongs to Koeta Limited.
            </p>
            <p className="mb-4">
              You may use the App under a limited, non-exclusive, revocable license for lawful personal or business use.
            </p>
            <p className="mb-4">
              User data remains yours; by using the App, you grant Koeta the right to store, process, and anonymize it for analytics and security.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">7. COMPLIANCE WITH NIGERIAN LAWS</h3>
            <p className="mb-4">TaxWise complies with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Cybercrimes Act 2015</li>
              <li>NDPR 2019</li>
              <li>Money Laundering (Prohibition) Act 2011</li>
              <li>Federal Competition and Consumer Protection Act 2018</li>
            </ul>
            <p className="mb-4">Koeta's Data Protection Officer (DPO): <a href="mailto:dpo@koeta.io" className="text-primary">dpo@koeta.io</a></p>
            <p className="mb-4">Users are responsible for accurate tax filing and lawful financial activity.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">8. FEES AND PAYMENT</h3>
            <p className="mb-4"><strong>Free Tier:</strong> Basic income and expense tracking</p>
            <p className="mb-4"><strong>Premium Features:</strong> Optional paid subscriptions</p>
            <p className="mb-4"><strong>Taxes:</strong> Fees exclude VAT and other taxes</p>
            <p className="mb-4"><strong>Refunds:</strong> Case-by-case basis via <a href="mailto:support@koeta.io" className="text-primary">support@koeta.io</a></p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">9. DISCLAIMERS AND LIMITATION OF LIABILITY</h3>
            <p className="mb-4">TaxWise is provided "AS IS", without warranties of any kind.</p>
            <p className="mb-4">Koeta is not liable for indirect damages, data loss, or calculation errors.</p>
            <p className="mb-4">Total liability is limited to the lesser of the fees paid in the past 12 months or ₦50,000.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">10. INDEMNIFICATION</h3>
            <p className="mb-4">
              You agree to indemnify and hold harmless Koeta Limited, its officers, employees, and agents from any claims arising from your misuse, violation of laws, or breach of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">11. DISPUTE RESOLUTION</h3>
            <p className="mb-4"><strong>Governing Law:</strong> Federal Republic of Nigeria</p>
            <p className="mb-4"><strong>Negotiation → Mediation → Arbitration</strong> (Lagos Multi-Door Courthouse)</p>
            <p className="mb-4"><strong>Jurisdiction:</strong> Lagos, Nigeria</p>
            <p className="mb-4"><strong>Class Action Waiver:</strong> Disputes must be resolved individually.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">12. FORCE MAJEURE</h3>
            <p className="mb-4">
              Koeta is not liable for service delays or failures caused by circumstances beyond its control, including natural disasters, cyberattacks, or government actions.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">13. TERMINATION</h3>
            <p className="mb-4">You may terminate your account anytime via:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>In-app deletion, or</li>
              <li>Email to <a href="mailto:support@koeta.io" className="text-primary">support@koeta.io</a></li>
            </ul>
            <p className="mb-4">Upon termination, data is retained per policy (90 days recovery, 7 years tax data).</p>
            <p className="mb-4">Koeta may also terminate accounts for violations, fraud, or security risks.</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">14. GENERAL PROVISIONS</h3>
            <p className="mb-4"><strong>Entire Agreement:</strong> These Terms + Privacy Policy</p>
            <p className="mb-4"><strong>Severability:</strong> Invalid clauses don't affect others</p>
            <p className="mb-4"><strong>No Waiver:</strong> Failure to enforce is not a waiver</p>
            <p className="mb-4"><strong>Assignment:</strong> You may not transfer rights; Koeta may assign freely</p>
            <p className="mb-4"><strong>Notices:</strong> Sent via email, in-app, or website updates</p>
            <p className="mb-4"><strong>Language:</strong> English version prevails</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">15. CONTACT INFORMATION</h3>
            <p className="mb-4"><strong>Company:</strong> Koeta Limited</p>
            <p className="mb-4"><strong>Location:</strong> [Abuja, Nigeria]</p>
            <p className="mb-4"><strong>Website:</strong> <a href="https://www.koeta.io" className="text-primary">www.koeta.io</a></p>
            <p className="mb-4"><strong>Email:</strong> <a href="mailto:support@koeta.io" className="text-primary">support@koeta.io</a></p>
            <p className="mb-4"><strong>Data Protection Officer (DPO):</strong> <a href="mailto:dpo@koeta.io" className="text-primary">dpo@koeta.io</a></p>
            <p className="mb-4"><strong>Phone:</strong> +234 705 476 7340</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">16. REGULATORY AUTHORITIES</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Data Protection:</strong> Nigeria Data Protection Bureau (NDPB) – <a href="https://ndpb.gov.ng" className="text-primary">ndpb.gov.ng</a></li>
              <li><strong>Cybercrimes:</strong> Nigeria Police Force – Cybercrime Unit – <a href="https://npf.gov.ng" className="text-primary">npf.gov.ng</a></li>
              <li><strong>Tax Matters:</strong> Federal Inland Revenue Service (FIRS) – <a href="https://firs.gov.ng" className="text-primary">firs.gov.ng</a></li>
              <li><strong>Consumer Protection:</strong> FCCPC – <a href="https://fccpc.gov.ng" className="text-primary">fccpc.gov.ng</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">17. ACKNOWLEDGMENT AND CONSENT</h3>
            <p className="mb-4">By clicking "I Agree" or using TaxWise, you acknowledge that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>✓ You have read and understood these Terms</li>
              <li>✓ You agree to be bound by them</li>
              <li>✓ You consent to data collection and processing</li>
              <li>✓ You are at least 18 years old</li>
              <li>✓ You understand that TaxWise does not provide professional tax advice</li>
              <li>✓ You will comply with all applicable Nigerian laws</li>
            </ul>
            <p className="mb-4">For questions, contact: <a href="mailto:legal@koeta.io" className="text-primary">legal@koeta.io</a></p>
            <p className="mb-4"><strong>© 2025 Koeta Limited. All Rights Reserved.</strong></p>
            <p className="mb-4"><strong>TaxWise is a registered trademark of Koeta Limited.</strong></p>
          </section>
        </div>
      </div>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>TaxWise By Koeta LTD</p>
          <p>&copy; 2025 TaxWise. Built for Nigeria's 2025 Tax Reforms.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
