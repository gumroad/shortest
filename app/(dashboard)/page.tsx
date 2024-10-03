import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Clock, PenTool, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
              (Have AI) Write Your Tests HELLO
              <span className="block text-orange-500">Faster Than Ever</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl max-w-2xl mx-auto">
              Shortest observes your pull requests, helps you write tests for
              new features, and fixes broken tests that block you from shipping.
            </p>
            <div className="mt-8 flex justify-center">
              <SignedOut>
                <a href="https://github.com/gumroad/shortest" target="_blank">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
                    View on GitHub
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </SignedOut>
              <SignedIn>
                <a href="/dashboard">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
                    View Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <PenTool className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Writes New Tests
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Intelligently generates test cases for new features in your
                  pull requests{" "}
                  <span className="font-bold text-green-500">
                    only once you're ready
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Fixes Broken Tests
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Suggests fixes for broken tests to align with new
                  functionality,{" "}
                  <span className="font-bold text-green-500">
                    ensuring fast merges
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Seamless Integration
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Integrates with your existing GitHub workflow,{" "}
                  <span className="font-bold text-green-500">
                    suggesting changes as you go
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to streamline your pull requests?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Shortest observes your pull requests, helps write tests for new
                features, and assists in fixing broken tests. Focus on writing
                great code while Shortest ensures your tests are up to date and
                passing.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <SignedOut>
                <a
                  href="https://github.com/gumroad/shortest"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-full text-xl px-12 py-6 inline-flex items-center justify-center">
                    Get started
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </a>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button className="bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-full text-xl px-12 py-6 inline-flex items-center justify-center">
                    View Dashboard
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
