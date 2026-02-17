import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { CountdownBadge } from "./countdown-badge";
import type { App } from "@/types/database";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  approved: "Onaylandi",
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

export function AppCard({ app }: AppCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{app.name}</h3>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={statusVariants[app.status] || "default"}>
              {statusLabels[app.status] || app.status}
            </Badge>
            {app.end_date && <CountdownBadge endDate={app.end_date} />}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {app.test_url && (
          <a
            href={app.test_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Test Linki
          </a>
        )}
        {app.play_url && (
          <a
            href={app.play_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Play Store
          </a>
        )}
      </div>
    </Card>
  );
}
