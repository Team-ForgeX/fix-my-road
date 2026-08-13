import crypto from "crypto";
import nodemailer from "nodemailer";

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getEmailTransport() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const secure = String(process.env.EMAIL_SECURE ?? "false").toLowerCase() === "true";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

export async function sendVerificationEmail({
  email,
  fullName,
  userId,
  appUrl,
  token
}: {
  email: string;
  fullName?: string;
  userId?: string;
  appUrl: string;
  token: string;
}) {
  const transporter = getEmailTransport();

  if (!transporter) {
    throw new Error("SMTP email configuration is missing. Check EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and EMAIL_PORT in .env.");
  }

  const verifyUrl = `${appUrl.replace(/\/$/, "")}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email for Fix My Road",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
          <h2 style="margin: 0; font-size: 28px;">Fix My Road</h2>
        </div>
        <div style="padding: 28px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <p style="font-size: 20px; font-weight: 700; margin: 0 0 16px; color: #111827;">Hi ${fullName || "there"},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 20px;">
            Thanks for signing up. Please verify your email to complete your Fix My Road account.
          </p>
          <p style="margin: 0 0 20px;">
            <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700;">
              Verify my email
            </a>
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin: 0;">
            If the button does not work, open this link manually:<br />
            <a href="${verifyUrl}" style="color: #7c3aed; word-break: break-all;">${verifyUrl}</a>
          </p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
            User ID: ${userId || "n/a"}
          </p>
        </div>
      </div>
    `
  });

  return verifyUrl;
}
