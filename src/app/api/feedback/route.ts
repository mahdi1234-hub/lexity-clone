import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SENDER_EMAIL = "louatimahdi390@gmail.com";
const APP_PASSWORD = "vtjb rtop rbfd nevr";
const RECIPIENT_EMAIL = "louatimahdi390@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL,
    pass: APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, rating, message } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: "Type and message are required." },
        { status: 400 }
      );
    }

    const ratingStars = rating
      ? "★".repeat(rating) + "☆".repeat(5 - rating)
      : "Not rated";

    const subject =
      type === "contact"
        ? `[Lexity Contact] Message from ${name || "Anonymous"}`
        : type === "rating"
        ? `[Lexity Rating] ${ratingStars} from ${name || "Anonymous"}`
        : `[Lexity Feedback] From ${name || "Anonymous"}`;

    const htmlBody = `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F2EFEA; border-radius: 12px; overflow: hidden;">
        <div style="background: #2C2824; padding: 24px 32px;">
          <h1 style="color: #F2EFEA; font-size: 20px; font-weight: 300; margin: 0;">
            Lexity Platform — ${type === "contact" ? "Contact Request" : type === "rating" ? "Experience Rating" : "User Feedback"}
          </h1>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #8a8178; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; width: 120px;">Type</td>
              <td style="padding: 8px 0; color: #181512; font-size: 14px; font-weight: 500;">${type}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8a8178; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Name</td>
              <td style="padding: 8px 0; color: #181512; font-size: 14px;">${name || "Anonymous"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8a8178; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
              <td style="padding: 8px 0; color: #181512; font-size: 14px;">${email || "Not provided"}</td>
            </tr>
            ${
              rating
                ? `<tr>
              <td style="padding: 8px 0; color: #8a8178; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Rating</td>
              <td style="padding: 8px 0; color: #C48C56; font-size: 20px;">${ratingStars} (${rating}/5)</td>
            </tr>`
                : ""
            }
          </table>
          <div style="margin-top: 20px; padding: 16px; background: white; border: 1px solid #d9d1c5; border-radius: 8px;">
            <p style="color: #8a8178; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Message</p>
            <p style="color: #181512; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 24px; color: #8a8178; font-size: 11px;">
            Sent from Lexity Platform Feedback Toolbar — ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Lexity Feedback" <${SENDER_EMAIL}>`,
      to: RECIPIENT_EMAIL,
      subject,
      html: htmlBody,
      replyTo: email || SENDER_EMAIL,
    });

    return NextResponse.json({ success: true, message: "Feedback sent successfully!" });
  } catch (error) {
    console.error("Feedback email error:", error);
    return NextResponse.json(
      { error: "Failed to send feedback. Please try again." },
      { status: 500 }
    );
  }
}
