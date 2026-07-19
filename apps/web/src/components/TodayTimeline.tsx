import { useEffect, useState } from "react";
import { fetchTimeline, type TimelineEvent } from "../lib/data-api.js";

interface TodayTimelineProps {
  workspaceSlug: string;
}

export function TodayTimeline({ workspaceSlug }: TodayTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    fetchTimeline(workspaceSlug)
      .then((data) => setEvents(data.timeline))
      .catch(() => setEvents([]));
  }, [workspaceSlug]);

  if (!events.length) return null;

  return (
    <section className="buek-section space-y-4">
      <h2 className="buek-card-title text-slate-400">Today</h2>
      <ol className="relative space-y-0 border-l border-white/10 pl-8">
        {events.map((event, index) => (
          <li key={event.id} className="relative pb-8 last:pb-0">
            <span className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full bg-tenant-primary ring-4 ring-slate-950" />
            <p className="font-mono text-sm text-slate-500">{event.time}</p>
            <p className="buek-body text-white">{event.title}</p>
            {event.detail ? <p className="buek-small text-slate-500">{event.detail}</p> : null}
            {index < events.length - 1 ? (
              <span className="absolute -left-[1.05rem] top-5 h-full w-px bg-white/10" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
