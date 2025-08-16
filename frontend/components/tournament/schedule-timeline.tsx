"use client"

import React from "react"
import { CheckCircle2, Circle, ChevronRight } from "lucide-react"

export type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "CANCELLED"
  | "POSTPONED"

interface ScheduleTimelineProps {
  registrationStart?: string
  registrationEnd?: string
  tournamentStart?: string
  tournamentEnd?: string
  status: TournamentStatus
}

function formatDate(value?: string) {
  if (!value) return "TBD"
  try {
    return new Date(value).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

function clampProgress(n: number) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function progressBetween(start?: string, end?: string) {
  if (!start || !end) return 0
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const now = Date.now()
  if (Number.isNaN(s) || Number.isNaN(e) || s >= e) return 0
  if (now <= s) return 1
  if (now >= e) return 100
  const pct = ((now - s) / (e - s)) * 100
  return clampProgress(pct)
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  registrationStart,
  registrationEnd,
  tournamentStart,
  tournamentEnd,
  status,
}) => {
  // Derive phase states
  const now = Date.now()
  const regStartTs = registrationStart ? new Date(registrationStart).getTime() : undefined
  const regEndTs = registrationEnd ? new Date(registrationEnd).getTime() : undefined
  const tourStartTs = tournamentStart ? new Date(tournamentStart).getTime() : undefined
  const tourEndTs = tournamentEnd ? new Date(tournamentEnd).getTime() : undefined

  // Determine which step is active
  const activeKey: "registration" | "checkin" | "tournament" | "results" =
    status === "REGISTRATION"
      ? "registration"
      : status === "READY"
      ? "checkin"
      : status === "RUNNING"
      ? "tournament"
      : status === "COMPLETED"
      ? "results"
      : // Default fallbacks
        (now < (regStartTs ?? Number.MAX_SAFE_INTEGER) ? "registration" : now < (tourStartTs ?? Number.MAX_SAFE_INTEGER) ? "checkin" : "tournament")

  const isCompleted = (key: string) => {
    switch (key) {
      case "registration":
        return status !== "DRAFT" && (status === "READY" || status === "RUNNING" || status === "COMPLETED")
      case "checkin":
        return status === "RUNNING" || status === "COMPLETED"
      case "tournament":
        return status === "COMPLETED"
      default:
        return false
    }
  }

  const steps: Array<{
    key: "registration" | "checkin" | "tournament" | "results"
    title: string
    subtitle: string
    progress: number
  }> = [
    {
      key: "registration",
      title: "Registration",
      subtitle:
        status === "REGISTRATION"
          ? regEndTs
            ? `Open until ${formatDate(registrationEnd)}`
            : `Open`
          : regEndTs && now > (regEndTs || 0)
          ? `Closed on ${formatDate(registrationEnd)}`
          : registrationStart
          ? `Opens ${formatDate(registrationStart)}`
          : "Pending",
      progress: status === "REGISTRATION" ? progressBetween(registrationStart, registrationEnd) : isCompleted("registration") ? 100 : 0,
    },
    {
      key: "checkin",
      title: "Check-in",
      subtitle:
        status === "READY"
          ? "Check-in started"
          : status === "REGISTRATION"
          ? regEndTs
            ? `Starts ${formatDate(registrationEnd)}`
            : "Awaiting registration end"
          : isCompleted("checkin")
          ? "Completed"
          : tourStartTs
          ? `Starts ${formatDate(tournamentStart)}`
          : "Pending",
      progress: status === "READY" ? 50 : isCompleted("checkin") ? 100 : 0,
    },
    {
      key: "tournament",
      title: "Matches",
      subtitle:
        status === "RUNNING"
          ? tourEndTs
            ? `Live • Ends ${formatDate(tournamentEnd)}`
            : "Live"
          : isCompleted("tournament")
          ? "Finished"
          : tourStartTs
          ? `Starts ${formatDate(tournamentStart)}`
          : "Pending",
      progress: status === "RUNNING" ? progressBetween(tournamentStart, tournamentEnd) : isCompleted("tournament") ? 100 : 0,
    },
    {
      key: "results",
      title: "Results",
      subtitle: status === "COMPLETED" ? (tournamentEnd ? `Completed ${formatDate(tournamentEnd)}` : "Completed") : "Pending",
      progress: status === "COMPLETED" ? 100 : 0,
    },
  ]

  return (
    <div className="w-full">
      <div className="flex items-stretch gap-4 overflow-x-auto py-2">
        {steps.map((step) => {
          const active = activeKey === step.key
          const done = isCompleted(step.key)
          const topBar = done ? 100 : active ? Math.max(8, step.progress) : 8

          return (
            <div
              key={step.key}
              className={`relative min-w-[260px] max-w-[320px] flex-1 rounded-xl border bg-gray-800/60 border-gray-700/50 p-4 shadow-sm ${
                active ? "ring-1 ring-cyan-400/40" : ""
              }`}
            >
              {/* Top progress bar */}
              <div className="absolute left-0 right-0 top-0 h-1.5 rounded-t-xl overflow-hidden bg-gray-700/60">
                <div
                  className={`h-full transition-all duration-500 ${done ? "bg-green-400" : "bg-cyan-400"}`}
                  style={{ width: `${topBar}%` }}
                />
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    done
                      ? "bg-green-500/20 border-green-400/40 text-green-300"
                      : active
                      ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                      : "bg-gray-700/40 border-gray-600 text-gray-400"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
                </div>
                <div className="text-white font-medium">{step.title}</div>
              </div>

              <div className="mt-2 text-sm text-gray-400 line-clamp-2">{step.subtitle}</div>

              {active && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/80">
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}