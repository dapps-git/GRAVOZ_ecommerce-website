import path from 'path';
import fs from 'fs';

export interface RepurchaseEmailPayload {
  toEmail: string;
  customerName: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productSize?: string;
  productColor?: string;
  productUrl: string;
  orderNumber?: string;
  purchaseDate?: string;
  logoUrl?: string;
  appUrl?: string;
  type?: '3_months' | '4_months';
}

export function generateRepurchaseEmailHtml(data: RepurchaseEmailPayload): string {
  const {
    customerName,
    productName,
    productImage,
    productPrice,
    productSize,
    productColor,
    productUrl,
    orderNumber,
    purchaseDate,
    type = '3_months',
  } = data;

  const appUrl = data.appUrl || 'https://gravoz-ecommerce-website.vercel.app';
  const logoUrl = data.logoUrl || 'cid:gravoz-logo';
  const currentYear = new Date().getFullYear();

  const isFourMonths = type === '4_months';

  const badgeText = isFourMonths ? '4-Month Milestone' : '3-Month Check-In';
  const headline = isFourMonths
    ? `Hey ${customerName || 'Friend'}, ready to refresh your pair?`
    : `Hey ${customerName || 'Friend'}, how are your shoes treating you?`;

  const leadParagraph = isFourMonths
    ? `It has been <strong>4 months</strong> since you welcomed your pair into your daily rotation! Your shoes have walked hundreds of miles with you, and while genuine leather molds to your feet beautifully, nothing beats having a fresh backup pair for rotation.`
    : `Can you believe it has already been <strong>3 months</strong> since you got your pair? Time flies when you're stepping in handcrafted comfort!`;

  const questionParagraph = isFourMonths
    ? `How is the sole holding up? Are you ready to add a fresh new pair, switch to another shade, or replace a pair that has faced heavy adventures? We've got your exact design handcrafted and ready to ship to your doorstep.`
    : `How is the leather holding up? Still feeling soft and comfortable on your feet? Or did your pair face heavy daily wear, unexpected damage on the road, or maybe get <em>"borrowed"</em> permanently by someone who loved them too much? 😉`;

  const calloutText = isFourMonths
    ? `Treat your feet to that crisp day-one feeling again. We're ready with your exact size and 100% Free All-India Delivery.`
    : `Don't worry for a moment! We have the exact same design ready in our workshop—fresh, premium, and crafted to deliver that day-one comfort all over again.`;

  const buttonText = isFourMonths
    ? `Order Your Fresh Pair Again →`
    : `Order This Pair Again →`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isFourMonths ? '4 Months of Comfort - Time to refresh your pair?' : 'How are your shoes treating you? - GRAVOZ'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    body, table, td, p, a, h1, h2, h3, span, div {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      font-weight: 300;
      letter-spacing: 0.02em;
    }
    strong, b {
      font-weight: 600;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 300; -webkit-font-smoothing: antialiased; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f5f0; width: 100%; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border: 1px solid #e8decb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.03);">
          
          <!-- Top Header with Official GRAVOZ Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 26px 28px 22px 28px; text-align: center; border-bottom: 1px solid #ebdccb;">
              <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img 
                  src="${logoUrl}" 
                  alt="GRAVOZ" 
                  width="160" 
                  style="display: block; width: 160px; max-width: 100%; height: auto; margin: 0 auto; border: 0;"
                />
              </a>
              <p style="margin: 8px 0 0 0; color: #89591C; font-size: 10.5px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase;">
                Handcrafted Footwear · Pure Leather
              </p>
            </td>
          </tr>

          <!-- Free Shipping All Over India Highlight Strip -->
          <tr>
            <td style="background-color: #faf6ef; border-bottom: 1px solid #ebdccb; padding: 10px 18px; text-align: center;">
              <span style="font-size: 11px; font-weight: 500; color: #89591C; letter-spacing: 0.08em; text-transform: uppercase;">
                🚚 100% Free Shipping All Over India
              </span>
            </td>
          </tr>

          <!-- Hero Greeting Content -->
          <tr>
            <td style="padding: 34px 32px 28px 32px;">
              <div style="display: inline-block; background-color: #faf4eb; border: 1px solid #ebdccb; color: #89591C; font-size: 10.5px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.12em; padding: 4px 12px; border-radius: 20px; margin-bottom: 18px;">
                ${badgeText}
              </div>

              <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 22px; font-weight: 400; line-height: 1.4; letter-spacing: -0.01em;">
                ${headline}
              </h2>

              <p style="margin: 0 0 14px 0; font-size: 13.5px; line-height: 1.75; color: #444444; font-weight: 300;">
                ${leadParagraph}
              </p>

              <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.75; color: #444444; font-weight: 300;">
                ${questionParagraph}
              </p>

              <div style="background-color: #faf7f2; border-left: 3px solid #89591C; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; font-weight: 400; color: #6e4414; line-height: 1.6;">
                  ${calloutText}
                </p>
              </div>

              <!-- Product Showcase Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border: 1px solid #ebdccb; border-radius: 12px; overflow: hidden; margin-bottom: 8px;">
                <tr>
                  <td align="center" style="background-color: #fdfaf6; padding: 22px; border-bottom: 1px solid #ebdccb;">
                    <img 
                      src="${productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800'}" 
                      alt="${productName}" 
                      width="260" 
                      style="display: block; max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #ebdccb;"
                    />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 22px 24px;">
                    <div style="font-size: 10px; font-weight: 600; color: #89591C; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 4px;">
                      ${isFourMonths ? 'Your Favorite Footwear Style' : 'Your Previously Purchased Design'}
                    </div>
                    <div style="font-size: 17px; font-weight: 500; color: #111111; line-height: 1.35; margin-bottom: 8px;">
                      ${productName}
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 14px;">
                      <tr>
                        <td style="font-size: 12px; color: #666666; font-weight: 300;">
                          ${productSize ? `<strong>Size:</strong> ${productSize}&nbsp;&nbsp;•&nbsp;&nbsp;` : ''}
                          ${productColor ? `<strong>Color:</strong> ${productColor}&nbsp;&nbsp;•&nbsp;&nbsp;` : ''}
                          ${purchaseDate ? `<strong>Ordered:</strong> ${purchaseDate}` : ''}
                        </td>
                      </tr>
                    </table>

                    <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 18px;">
                      <span style="font-size: 20px; font-weight: 600; color: #89591C;">
                        ₹${productPrice ? productPrice.toLocaleString('en-IN') : '1,399'}
                      </span>
                      <span style="font-size: 10.5px; font-weight: 500; color: #166534; background-color: #dcfce7; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em;">
                        Free Delivery (India)
                      </span>
                    </div>

                    <!-- Buy Again Primary Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #89591C;">
                          <a 
                            href="${productUrl}" 
                            target="_blank" 
                            style="display: block; padding: 14px 24px; font-size: 13px; font-weight: 500; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 8px; text-align: center;"
                          >
                            ${buttonText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf7f2; padding: 22px 28px; text-align: center; border-top: 1px solid #ebdccb;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #777777; font-weight: 300;">
                Questions or need custom sizing? Reply directly to this email or visit our store.
              </p>
              <p style="margin: 0; font-size: 10.5px; color: #999999; font-weight: 300;">
                © ${currentYear} GRAVOZ. All rights reserved. Handcrafted in India.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends the 3-Month or 4-Month Check-in & Repurchase email via Nodemailer
 */
export async function sendRepurchaseEmail(payload: RepurchaseEmailPayload): Promise<{
  success: boolean;
  message: string;
  previewHtml?: string;
}> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME || 'GRAVOZ Store';

  const html = generateRepurchaseEmailHtml(payload);
  const subject = payload.type === '4_months'
    ? `4 Months of Comfort: Time to refresh your pair, ${payload.customerName}?`
    : `How are your shoes treating you, ${payload.customerName}? (It's been 3 months!)`;

  if (!smtpEmail || !smtpPassword) {
    return {
      success: true,
      message: `Demo email generated for ${payload.toEmail} (${payload.type || '3_months'}). Preview is ready!`,
      previewHtml: html,
    };
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    const logoPath = path.join(process.cwd(), 'public', 'gravoz-logo.png');
    const hasLogo = fs.existsSync(logoPath);

    await transporter.sendMail({
      from: `"${fromName}" <${smtpEmail}>`,
      to: payload.toEmail,
      subject,
      attachments: hasLogo
        ? [
            {
              filename: 'gravoz-logo.png',
              path: logoPath,
              cid: 'gravoz-logo',
            },
          ]
        : [],
      html,
    });

    return {
      success: true,
      message: `Email (${payload.type || '3_months'}) dispatched successfully to ${payload.toEmail}!`,
      previewHtml: html,
    };
  } catch (error: any) {
    console.error('Nodemailer sendRepurchaseEmail error:', error);
    return {
      success: false,
      message: error.message || 'Failed to dispatch email',
      previewHtml: html,
    };
  }
}
