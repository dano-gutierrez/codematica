"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  return <Button label={label} icon={ArrowLeft} variant="quiet" onClick={() => router.back()} />;
}
