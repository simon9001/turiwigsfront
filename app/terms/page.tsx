import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Tiuri Nails & Wigs Parlour',
  description: 'Terms and Conditions for Tiuri Nails & Wigs Parlour, governed by the laws of Kenya.',
};

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    body: `These Terms and Conditions ("Terms") govern your use of the Tiuri Nails & Wigs Parlour website (tiuri.co.ke) and any services, products or bookings made through it. By accessing our website or purchasing our products and services, you agree to be bound by these Terms. If you do not agree, please do not use our platform.

Tiuri Nails & Wigs Parlour is a business registered and operating in Nairobi, Kenya ("we", "us", "our").`,
  },
  {
    id: 'governing-law',
    title: '2. Governing Law & Jurisdiction',
    body: `These Terms are governed by and construed in accordance with the laws of Kenya, including but not limited to:

• The Consumer Protection Act, 2012 (Cap. 46B)
• The Kenya Data Protection Act, 2019
• The Computer Misuse and Cybercrimes Act, 2018
• The Copyright Act (Cap. 130)
• The Business Registration Service Act, 2015
• The Central Bank of Kenya Act and applicable CBK regulations on digital payments

Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Kenya. We encourage dispute resolution through the Consumer Protection Advisory Committee where applicable.`,
  },
  {
    id: 'data-protection',
    title: '3. Data Protection & Privacy (Kenya Data Protection Act, 2019)',
    body: `In compliance with the Kenya Data Protection Act, 2019, we are committed to protecting your personal data. As a data controller, we:

• Collect only personal data that is necessary, adequate and relevant to the purpose of our services (name, phone number, email, payment information, appointment details).
• Process your data lawfully, fairly and in a transparent manner.
• Store your data securely and only for as long as is necessary.
• Do not sell, lease or share your personal data with third parties except where required by law or with your explicit consent.
• Use your data to: process bookings and orders, send appointment reminders, process payments, and (with your consent) send promotional communications.

You have the right to:
• Access your personal data held by us.
• Correct inaccurate or incomplete personal data.
• Request deletion of your personal data (right to be forgotten).
• Object to or restrict processing of your data.
• Lodge a complaint with the Office of the Data Protection Commissioner (ODPC) at www.odpc.go.ke.

To exercise any of these rights, contact us at privacy@tiuri.co.ke or call +254 700 000 000.`,
  },
  {
    id: 'consumer-protection',
    title: '4. Consumer Rights (Consumer Protection Act, 2012)',
    body: `In compliance with the Consumer Protection Act, 2012 (Cap. 46B), you are entitled to:

• Receive goods and services that are of acceptable quality, fit for purpose and as described.
• Accurate and truthful information about our products and services, including pricing in Kenya Shillings (KES).
• A remedy (refund, repair or replacement) where goods are defective or services are not rendered as agreed.
• Protection against unfair, unreasonable or unjust contract terms.

Pricing: All prices are displayed in Kenya Shillings (KES) and are inclusive of applicable taxes. We reserve the right to change prices, but confirmed orders will be honoured at the price quoted at time of checkout.

Refunds & Returns: Unused physical products (wigs, nail accessories) in original packaging may be returned within 7 days of purchase. Due to hygiene reasons, used wigs or nail products cannot be returned. Service bookings cancelled at least 24 hours in advance are eligible for a full refund or reschedule.`,
  },
  {
    id: 'services',
    title: '5. Booking & Services',
    body: `Appointment Bookings: Bookings made through our website or in-person are confirmed upon receipt of any required deposit. We reserve the right to reschedule or cancel appointments with reasonable notice in exceptional circumstances.

No-Show Policy: Clients who miss an appointment without 24-hour prior notice may forfeit any deposit paid.

Health & Safety: Clients are required to disclose any relevant allergies, skin conditions or sensitivities before services are rendered. Tiuri Nails & Wigs Parlour will not be liable for adverse reactions resulting from undisclosed medical conditions.

Minors: Clients under the age of 18 must be accompanied by a parent or legal guardian who consents to the service.`,
  },
  {
    id: 'payments',
    title: '6. Payments',
    body: `All payments are processed in Kenya Shillings (KES). We accept M-Pesa, Visa, Mastercard and cash payments. Online payments are processed securely through Paystack, a PCI-DSS compliant payment processor.

Fraudulent Transactions: Any fraudulent payment activity will be reported to the relevant authorities, including the Communications Authority of Kenya and law enforcement, in accordance with the Computer Misuse and Cybercrimes Act, 2018.`,
  },
  {
    id: 'intellectual-property',
    title: '7. Intellectual Property (Copyright Act, Cap. 130)',
    body: `All content on this website — including text, photographs, logos, graphics, videos and designs — is the property of Tiuri Nails & Wigs Parlour and is protected under the Copyright Act (Cap. 130) of Kenya. You may not reproduce, distribute, modify or use any content for commercial purposes without our prior written consent.

User-Generated Content: By posting reviews or content on our platform, you grant us a non-exclusive, royalty-free licence to use, display and share that content for marketing purposes, while retaining your ownership rights.`,
  },
  {
    id: 'prohibited-conduct',
    title: '8. Prohibited Conduct (Computer Misuse and Cybercrimes Act, 2018)',
    body: `In accordance with the Computer Misuse and Cybercrimes Act, 2018, you must not:

• Attempt to gain unauthorised access to any part of our systems or networks.
• Use our website to transmit harmful, offensive or fraudulent content.
• Introduce viruses, malware or any other harmful code.
• Engage in any activity that disrupts or interferes with our website or services.

Violations will be reported to the relevant Kenyan authorities and may result in civil or criminal proceedings.`,
  },
  {
    id: 'limitation-of-liability',
    title: '9. Limitation of Liability',
    body: `To the maximum extent permitted by Kenyan law, Tiuri Nails & Wigs Parlour shall not be liable for:

• Indirect, incidental, special or consequential damages arising from the use of our website or services.
• Loss of profit, data or business opportunities.
• Damages resulting from your failure to follow our aftercare instructions.

Our total liability to you for any claim arising under these Terms shall not exceed the amount paid by you for the specific product or service giving rise to the claim.`,
  },
  {
    id: 'dispute-resolution',
    title: '10. Dispute Resolution',
    body: `We encourage clients to first contact us directly to resolve any dispute. If a resolution cannot be reached:

1. You may refer the matter to the Consumer Protection Advisory Committee under the Consumer Protection Act, 2012.
2. Disputes may also be referred to mediation or arbitration in Nairobi, Kenya, before proceeding to litigation.
3. Any legal proceedings shall be brought in the courts of Kenya.

Contact for disputes: disputes@tiuri.co.ke or +254 700 000 000.`,
  },
  {
    id: 'changes',
    title: '11. Changes to These Terms',
    body: `We reserve the right to update these Terms at any time. Significant changes will be communicated via our website or email. Continued use of our website or services after any changes constitutes your acceptance of the revised Terms. We recommend reviewing this page periodically.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    body: `If you have any questions about these Terms, please contact us:

Tiuri Nails & Wigs Parlour
Nairobi, Kenya
Email: hello@tiuri.co.ke
Phone: +254 700 000 000
Instagram: @tiurinails
TikTok: @tiurinails
Facebook: Tiuri Nails & Wigs Parlour`,
  },
];

export default function TermsPage() {
  return (
    <main style={{ background: '#ffffff' }}>

      {/* Scoped hover style — no JS needed */}
      <style>{`
        .toc-link { color: rgba(23,22,20,0.5); transition: color 150ms; }
        .toc-link:hover { color: #171614; }
      `}</style>

      {/* Hero */}
      <section className="py-16 sm:py-20" style={{ background: '#171614' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-4"
            style={{ color: 'rgba(255,255,255,0.72)' }}>
            Legal
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Last updated: June 2025 &nbsp;·&nbsp; Governed by the laws of Kenya
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 grid lg:grid-cols-[220px_1fr] gap-12">

        {/* Sidebar TOC — pure CSS hover via .toc-link */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{ color: '#8b8881' }}>
              Contents
            </p>
            <nav className="flex flex-col gap-2">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="toc-link text-xs leading-snug">
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Body */}
        <article className="min-w-0">
          <div className="rounded-2xl p-5 mb-10 text-sm leading-relaxed"
            style={{ background: 'rgba(23,22,20,0.08)', border: '1px solid rgba(23,22,20,0.25)', color: 'rgba(23,22,20,0.7)' }}>
            Please read these Terms carefully before using our website or services. By proceeding, you confirm that you have read, understood and agree to be bound by these Terms, which comply with the applicable laws of Kenya.
          </div>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="mb-10 scroll-mt-28">
              <h2 className="text-lg font-bold mb-3" style={{ color: '#171614' }}>
                {s.title}
              </h2>
              <div className="h-0.5 w-10 mb-4 rounded-full" style={{ background: '#171614' }} />
              <div className="text-sm leading-[1.85] whitespace-pre-line"
                style={{ color: 'rgba(23,22,20,0.65)' }}>
                {s.body}
              </div>
            </section>
          ))}

          <div className="mt-14 pt-8 border-t flex items-center justify-between"
            style={{ borderColor: 'rgba(23,22,20,0.2)' }}>
            <p className="text-xs" style={{ color: 'rgba(23,22,20,0.35)' }}>
              © {new Date().getFullYear()} Tiuri Nails &amp; Wigs Parlour. All rights reserved.
            </p>
            <Link href="/" className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ color: '#8b8881' }}>
              Back to Home
            </Link>
          </div>
        </article>

      </div>
    </main>
  );
}
