import { MemberBottomNav } from "@/components/MemberNav"

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    // pb-16: leaves room for the fixed mobile bottom nav (64px)
    // sm:pb-0: on desktop the nav is inline, no extra padding needed
    <div className="pb-20 sm:pb-0">
      {children}
      <MemberBottomNav />
    </div>
  )
}
