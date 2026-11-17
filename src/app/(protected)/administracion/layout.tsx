import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const user = await currentUser(); if (user?.role !== "ADMIN") notFound(); return children; }
