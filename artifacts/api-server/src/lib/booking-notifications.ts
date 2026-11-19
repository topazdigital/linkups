import nodemailer from "nodemailer";

export interface BookingNotification {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  adventure: string;
  travelDate: string | null;
  travellers: number;
  totalAmount: number;
  specialRequests: string | null;
}

function getSmtpSettings() {
  const host = process.env.BOOKING_SMTP_HOST?.trim();
  const port = Number(process.env.BOOKING_SMTP_PORT || 587);
  const user = process.env.BOOKING_SMTP_USER?.trim();
  const password = process.env.BOOKING_SMTP_PASSWORD;
  const recipient = process.env.BOOKING_NOTIFICATION_TO?.trim();

  const missing: string[] = [];
  if (!host) missing.push("BOOKING_SMTP_HOST");
  if (!user) missing.push("BOOKING_SMTP_USER");
  if (!password) missing.push("BOOKING_SMTP_PASSWORD");
  if (!recipient) missing.push("BOOKING_NOTIFICATION_TO");
  if (missing.length) {
    throw new Error(`Booking email is not configured: ${missing.join(", ")}`);
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("BOOKING_SMTP_PORT must be a valid port number.");
  }

  return { host: host!, port, user: user!, password: password!, recipient: recipient! };
}

export async function sendBookingNotification(
  booking: BookingNotification,
): Promise<void> {
  const settings = getSmtpSettings();
  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    requireTLS: settings.port === 587,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  const lines = [
    `A new booking request was received.`,
    ``,
    `Reference: ${booking.reference}`,
    `Customer: ${booking.fullName}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Adventure: ${booking.adventure}`,
    `Preferred date: ${booking.travelDate || "Not specified"}`,
    `Travellers: ${booking.travellers}`,
    `Estimated total: KES ${booking.totalAmount.toLocaleString("en-KE")}`,
    ``,
    `Special requests:`,
    booking.specialRequests?.trim() || "None",
    ``,
    `Review this request in the LinkUps Adventures admin workspace.`,
  ];

  try {
    await transporter.sendMail({
      from: `LinkUps Adventures <${settings.user}>`,
      to: settings.recipient,
      subject: `New booking request ${booking.reference}`,
      text: lines.join("\n"),
    });
  } finally {
    transporter.close();
  }
}
