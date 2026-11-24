import type { Response } from "express";

export const nombreCookieSesion = "tattoomanager_session";

export function escribirCookieSesion(
  res: Response,
  token: string,
  expiraAt: Date,
): void {
  res.cookie(nombreCookieSesion, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, expiraAt.getTime() - Date.now()),
  });
}
