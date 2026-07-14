// app/(auth)/layout.tsx
// Auth layout — no sidebar, just centered content
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
