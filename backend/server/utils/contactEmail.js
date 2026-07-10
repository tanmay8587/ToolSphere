import logger from "./logger.js";

/* =====================================
   CONTACT EMAIL TEMPLATES
   ===================================== */

/**
 * Build the contact email verification template.
 * @param {string} token - The raw (unhashed) verification token to embed in the link.
 * @param {string} [name] - The contact's name, used for a personalized greeting.
 * @returns {{ subject: string, html: string }}
 */
export const getContactVerificationTemplate = (token, name) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-contact/${token}`;
  const firstName = name ? name.trim().split(/\s+/)[0] : "there";

  return {
    subject: "Verify your email address for ToolSphere Contact Request",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f6f8;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #0e7490 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">ToolSphere</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0;">Your AI Tools Discovery Platform</p>
          </div>

          <!-- Body -->
          <div style="padding: 36px 32px;">
            <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 16px;">Verify your email address</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              Hi ${firstName},
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              Thank you for reaching out to the ToolSphere team. To ensure we can securely associate your
              message with the correct inbox and respond to you, we need to verify that you own this email address.
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
              Please confirm your email by clicking the button below. This step only takes a moment and helps us
              keep our community safe from spam.
            </p>

            <!-- Verification Button -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
              <tr>
                <td align="center">
                  <a href="${verificationUrl}"
                     style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0e7490 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
              This verification link will expire in <strong>24 hours</strong>. If the button doesn't work,
              copy and paste this URL into your browser:
            </p>
            <p style="color: #06b6d4; font-size: 13px; word-break: break-all; margin: 0 0 24px;">
              <a href="${verificationUrl}" style="color: #06b6d4; text-decoration: underline;">${verificationUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 4px;">
              If you didn't submit a contact request to ToolSphere, you can safely ignore this email &mdash; no further action is needed.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
              &copy; ${new Date().getFullYear()} ToolSphere. All rights reserved.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Empowering your workflow with AI.
            </p>
          </div>
        </div>
      </div>
    `,
  };
};

export default {
  getContactVerificationTemplate,
};