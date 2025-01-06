"use client";
import { useState } from "react";
import { ALLOWED_TEST_BEARER } from "@/lib/constants";

export default function TestingPage() {
  const [bearerShown, setBearerShown] = useState(false);

  return (
    <>
      <div className="p-3">
        <button onClick={() => setBearerShown((prev) => !prev)}>
          {bearerShown ? "Hide" : "Show"} bearer token
        </button>
        {bearerShown && (
          <p>
            You bearer token is <b>{ALLOWED_TEST_BEARER}</b>
          </p>
        )}
      </div>
    </>
  );
}
