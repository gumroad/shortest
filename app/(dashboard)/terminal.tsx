"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

export function Terminal() {
  const [terminalStep, setTerminalStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const terminalSteps = [
    "- name: Run tests with Shortest",
    "  env:",
    "    RAILS_ENV: test",
    "    RAILS_MASTER_KEY: ${{ secrets.RAILS_MASTER_KEY }}",
    "    SHORTEST_API_KEY: ${{ secrets.SHORTEST_API_KEY }}",
    "  run: |",
    "    bundle exec shortest run --confidence 80",
    "    bundle exec shortest run --confidence 95",
    "    bundle exec shortest run --confidence 99",
    "    bundle exec shortest run --confidence 99.9",
    "    bundle exec shortest run --confidence 100",
    "  timeout-minutes: 10",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerminalStep((prev) =>
        prev < terminalSteps.length - 1 ? prev + 1 : prev
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [terminalStep]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalSteps.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSpacing = (step: string) => {
    const leadingSpaces = step.match(/^\s*/)?.[0].length || 0;
    return "\u00A0".repeat(leadingSpaces) + step.trimLeft();
  };

  return (
    <div className="w-full rounded-lg shadow-lg overflow-hidden bg-gray-900 text-white font-mono text-sm relative">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="space-y-2">
          {terminalSteps.map((step, index) => (
            <div
              key={index}
              className={`${
                index > terminalStep ? "opacity-0" : "opacity-100"
              } transition-opacity duration-300`}
            >
              {addSpacing(step)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
