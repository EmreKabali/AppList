"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CountdownBadge } from "./countdown-badge";
import { TestRequestButton } from "./test-request-button";
import { ExternalLink } from "lucide-react";
import type { SerializedApp } from "@/types";

const statusVariants: Record<string, "default" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

interface AppCardProps {
  app: SerializedApp;
}

export function AppCard({ app }: Readonly<AppCardProps>) {
  const [copied, setCopied] = useState(false);
  const linkUrl = app.playUrl ?? app.testUrl;
  const storeLabel =
    app.platform === "ios" || linkUrl?.includes("apps.apple.com") ? "App Store" : "Play Store";
  const typeLabel = app.submissionType === "live" ? "Yayında" : "Test";
  const getPlatformLabel = () => {
    if (app.platform === "ios") return "iOS";
    if (app.platform === "android") return "Android";
    return null;
  };
  const platformLabel = getPlatformLabel();

  const handleCopyTestLink = async () => {
    if (!app.testUrl) return;

    try {
      await navigator.clipboard.writeText(app.testUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="group p-5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 border-gray-100 bg-white/50 backdrop-blur-sm hover:border-indigo-500/30">
      <div className="flex items-start gap-5">
        <div className="relative h-16 w-16 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500">
          {app.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.iconUrl}
              alt={`${app.name} ikonu`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 font-medium">
              APP
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors truncate">
              {app.name}
            </h3>
            {app.description && (
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {app.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {app.submissionType !== "live" && (
                <Badge variant="warning" className="font-medium bg-amber-50 text-amber-700 border-amber-100">{typeLabel}</Badge>
              )}

              {platformLabel && (
                <Badge variant="default" className="bg-gray-100 text-gray-600 border-none font-medium">
                  {platformLabel}
                </Badge>
              )}

              {app.endDate && <CountdownBadge endDate={app.endDate} />}

              {app.testerCount !== undefined && app.testerCount > 0 && (
                <Badge variant="default" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-medium">
                  {app.testerCount} tester
                </Badge>
              )}

              {app.submissionType === "test" && (
                <TestRequestButton appId={app.id} testerCount={app.testerCount ?? 0} />
              )}
            </div>

            <div
              className={`flex items-center gap-2 ml-auto transition-opacity duration-300 ${app.submissionType === "test" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            >
              {app.submissionType === "test" && app.testUrl ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    onClick={() => globalThis.open(app.testUrl ?? "", "_blank", "noopener,noreferrer")}
                  >
                    Test Linki
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={handleCopyTestLink}
                  >
                    {copied ? "Kopyalandı" : "Kopyala"}
                  </Button>
                </>
              ) : (
                linkUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  onClick={() => globalThis.open(linkUrl, "_blank", "noopener,noreferrer")}
                >
                  {storeLabel}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
