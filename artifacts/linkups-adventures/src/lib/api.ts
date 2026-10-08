import type {
  Adventure,
  AdminSession,
  BookingCreated,
  BookingInput,
  Booking,
  Enquiry,
  EnquiryCreated,
  EnquiryInput,
} from "@workspace/api-client-react";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`;
    throw new ApiRequestError(message, response.status);
  }
  return payload as T;
}

export function getPublicAdventures(): Promise<Adventure[]> {
  return apiRequest<Adventure[]>("/adventures");
}

export function createBooking(input: BookingInput): Promise<BookingCreated> {
  return apiRequest<BookingCreated>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createEnquiry(input: EnquiryInput): Promise<EnquiryCreated> {
  return apiRequest<EnquiryCreated>("/enquiries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdminSession(): Promise<AdminSession> {
  return apiRequest<AdminSession>("/admin/session");
}

export function getAdminBookings(): Promise<Booking[]> {
  return apiRequest<Booking[]>("/admin/bookings");
}

export function getAdminEnquiries(): Promise<Enquiry[]> {
  return apiRequest<Enquiry[]>("/admin/enquiries");
}

export function formatKes(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}
