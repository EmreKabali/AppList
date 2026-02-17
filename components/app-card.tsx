import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CountdownBadge } from "./countdown-badge";
import type { App } from "@/types/database";
import { ExternalLink } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const statusVariants: Record<string, "default" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: Readonly<AppCardProps>) {
  const storeLabel =
    app.platform === "ios" || app.play_url?.includes("apps.apple.com") ? "App Store" : "Play Store";
  const typeLabel = app.submission_type === "live" ? "Yayında" : "Test";
  const getPlatformLabel = () => {
    if (app.platform === "ios") return "iOS";
    if (app.platform === "android") return "Android";
    return null;
  };
  const platformLabel = getPlatformLabel();

  return (
    <Card className="group p-5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:border-indigo-500/30">
      <div className="flex items-start gap-5">
        {/* Sol: İkon Bölümü */}
        <div className="relative h-16 w-16 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500">
          {app.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.icon_url}
              alt={`${app.name} ikonu`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 font-medium">
              APP
            </div>
          )}
        </div>

        {/* Orta/Sağ: İçerik Bölümü */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {app.name}
            </h3>
            {app.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {app.description}
              </p>
            )}
          </div>

          {/* Alt Bilgiler ve Aksiyonlar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {app.submission_type !== "live" && (
                <Badge variant="warning" className="font-medium bg-amber-50 text-amber-700 border-amber-100">{typeLabel}</Badge>
              )}

              {platformLabel && (
                <Badge variant="default" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-none font-medium">
                  {platformLabel}
                </Badge>
              )}

              {app.end_date && <CountdownBadge endDate={app.end_date} />}
            </div>

            <div className="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {app.play_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  onClick={() => globalThis.open(app.play_url!, "_blank", "noopener,noreferrer")}
                >
                  {storeLabel}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
