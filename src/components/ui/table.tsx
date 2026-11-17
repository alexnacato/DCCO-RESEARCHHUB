import { cn } from "@/lib/utils";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className="w-full overflow-x-auto overscroll-x-contain">
    <table className={cn("w-full min-w-[780px] border-collapse text-left text-sm", className)}>{children}</table>
  </div>;
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase leading-snug tracking-wide text-slate-600", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-slate-100 px-4 py-4 align-top", className)}>{children}</td>;
}
