"use strict";

const PARIS_TIME_ZONE = "Europe/Paris";

function getDatePartsInParis(referenceDate = new Date()) {
  const formatter = new Intl.DateTimeFormat("fr-CA", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(referenceDate);
  const byType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second),
  };
}

function formatDate({ year, month, day }) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function timeToMinutes(time) {
  const normalized = String(time || "").trim();
  const [hours = "0", minutes = "0"] = normalized.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesToTime(minutes) {
  const safeMinutes = Math.max(0, Math.min(1439, Number(minutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function getBookingDateTimeConstraints(referenceDate = new Date()) {
  const parts = getDatePartsInParis(referenceDate);
  const minDate = formatDate(parts);
  const nextMinute = parts.hour * 60 + parts.minute + 1;

  return {
    minDate,
    minTimeToday: nextMinute <= 1439 ? minutesToTime(nextMinute) : null,
    isTodayStillBookable: nextMinute <= 1439,
  };
}

export function getBookingReferenceForComparison(referenceDate = new Date()) {
  const parts = getDatePartsInParis(referenceDate);

  return {
    currentDate: formatDate(parts),
    currentTime: `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:00`,
    currentMinutes: parts.hour * 60 + parts.minute,
  };
}

export function isBookingSlotExpired({
  bookingDate,
  bookingTime,
  referenceDate = new Date(),
} = {}) {
  if (!bookingDate || !bookingTime) {
    return false;
  }

  const { currentDate, currentMinutes } = getBookingReferenceForComparison(referenceDate);
  const normalizedDate = String(bookingDate).slice(0, 10);

  if (normalizedDate < currentDate) {
    return true;
  }

  if (normalizedDate > currentDate) {
    return false;
  }

  return timeToMinutes(bookingTime) <= currentMinutes;
}

export function validateBookingSlot({
  bookingDate,
  bookingTime,
  referenceDate = new Date(),
} = {}) {
  if (!bookingDate || !bookingTime) {
    return { valid: true, message: null };
  }

  const { minDate } = getBookingDateTimeConstraints(referenceDate);

  if (String(bookingDate) < minDate) {
    return {
      valid: false,
      message: "La date de reservation ne peut pas etre dans le passe.",
    };
  }

  if (String(bookingDate) > minDate) {
    return { valid: true, message: null };
  }

  const nowParts = getDatePartsInParis(referenceDate);
  const currentMinutes = nowParts.hour * 60 + nowParts.minute;
  const selectedMinutes = timeToMinutes(bookingTime);

  if (selectedMinutes <= currentMinutes) {
    return {
      valid: false,
      message: "Pour aujourd'hui, choisissez une heure future.",
    };
  }

  return { valid: true, message: null };
}
