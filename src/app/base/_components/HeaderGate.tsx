"use client";
import { usePathname } from "next/navigation";
import BaseHeader from "./BaseHeader";
import GuestHeader from "./GuestHeader";
import { isAuthPage } from "./authPaths";

export default function HeaderGate({ companyName }: { companyName: string | null }) {
  const pathname = usePathname();
  if (isAuthPage(pathname)) return null;
  return companyName ? <BaseHeader companyName={companyName} /> : <GuestHeader />;
}
