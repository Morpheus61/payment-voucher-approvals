import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'compliance@foodstream.in';

if (!RESEND_API_KEY) {
  console.warn('Warning: RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    if (!RESEND_API_KEY) {
      console.error('Error: RESEND_API_KEY is not configured');
      return { 
        success: false, 
        error: new Error('RESEND_API_KEY is not configured. Please add it to your environment variables.') 
      };
    }

    const data = await resend.emails.send({
      from: `Payment Approvals <${RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
      // Adding additional email headers for better deliverability
      headers: {
        'X-Entity-Ref-ID': `pv-${new Date().getTime()}`,
      },
      tags: [
        {
          name: 'category',
          value: 'payment-voucher-approvals'
        }
      ]
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
