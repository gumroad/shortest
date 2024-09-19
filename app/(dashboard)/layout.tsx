import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <SignedIn>
                <Link href="/dashboard" className="flex items-center">
                  <span className="ml-2 text-xl font-semibold text-gray-900">
                    Shortest
                  </span>
                </Link>
              </SignedIn>
              <SignedOut>
                <Link href="/" className="flex items-center">
                  <span className="ml-2 text-xl font-semibold text-gray-900">
                    Shortest
                  </span>
                </Link>
              </SignedOut>
              <div className="flex items-center space-x-8">
                <SignedOut>
                  <Link href="/pricing">Pricing</Link>
                  <SignInButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
