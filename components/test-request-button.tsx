"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { registerAsTester, unregisterAsTester } from "@/lib/api";

interface TestRequestButtonProps {
  appId: string;
  initialIsTester?: boolean;
  testerCount?: number;
}

export function TestRequestButton({
  appId,
  initialIsTester = false,
  testerCount = 0,
}: Readonly<TestRequestButtonProps>) {
  const { data: session } = useSession();
  const [isTester, setIsTester] = useState(initialIsTester);
  const [count, setCount] = useState(testerCount);
  const [loading, setLoading] = useState(false);

  if (!session?.user) {
    return (
      <span className="text-xs text-gray-500">
        {count > 0 ? `${count} tester` : ""}
      </span>
    );
  }

  const handleToggle = async () => {
    setLoading(true);
    if (isTester) {
      const res = await unregisterAsTester(appId);
      if (res.success) {
        setIsTester(false);
        setCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      const res = await registerAsTester(appId);
      if (res.success) {
        setIsTester(true);
        setCount((prev) => prev + 1);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {count > 0 && (
        <span className="text-xs text-gray-500">{count} tester</span>
      )}
      <Button
        size="sm"
        variant={isTester ? "outline" : "primary"}
        onClick={handleToggle}
        disabled={loading}
        className="text-xs h-7"
      >
        {loading ? "..." : isTester ? "Tester Olundu" : "Test Et"}
      </Button>
    </div>
  );
}
