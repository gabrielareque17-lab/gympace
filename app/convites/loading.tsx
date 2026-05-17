import { AppShell } from "@/components/ui/layout/app-shell";

export default function ConvitesLoading() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <div className="max-w-5xl">
          <div className="mb-8 space-y-4">
            <div className="h-6 w-40 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-10 w-72 max-w-full animate-pulse rounded bg-white/[0.07]" />
            <div className="h-4 w-[520px] max-w-full animate-pulse rounded bg-white/[0.05]" />
          </div>
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]"
              />
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
