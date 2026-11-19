import type {
  AdminImageUploadResponse,
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
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
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

export function uploadAdminImages(
  files: File[],
): Promise<AdminImageUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file, file.name));
  return apiRequest<AdminImageUploadResponse>("/admin/uploads", {
    method: "POST",
    body: formData,
  });
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

export function formatAdventurePrice(
  adventure: Pick<Adventure, "price" | "priceUsd">,
): string {
  const prices: string[] = [];
  if (adventure.price > 0) prices.push(formatKes(adventure.price));
  if (adventure.priceUsd && adventure.priceUsd > 0) {
    prices.push(`USD ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(adventure.priceUsd)}`);
  }
  return prices.length ? prices.join(" · ") : "Price on request";
}
