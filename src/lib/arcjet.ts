import arcjet, { fixedWindow } from "@arcjet/next";

// Arcjet rate limiting configuration
// Users are limited to 10 messages per day (24 hours)
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userId"],
  rules: [
    fixedWindow({
      mode: "LIVE",
      window: "1d", // 1 day window
      max: 10, // 10 messages per day
    }),
  ],
});

export default aj;
