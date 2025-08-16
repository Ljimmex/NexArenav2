"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button as UIButton } from "@/components/ui/button"

export type EditMatchFormState = {
  score1: string
  score2: string
  best_of: string
  status: "PENDING" | "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "WALKOVER" | "DISQUALIFIED"
  scheduled_at: string
  walkoverFor: string
  dqFor: string
}

interface EditMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingMatch: any | null
  formState: EditMatchFormState
  setFormState: React.Dispatch<React.SetStateAction<EditMatchFormState>>
  saving: boolean
  onCancel: () => void
  onSave: () => void
}

export function EditMatchModal({
  open,
  onOpenChange,
  editingMatch,
  formState,
  setFormState,
  saving,
  onCancel,
  onSave,
}: EditMatchModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Edytuj mecz</DialogTitle>
        </DialogHeader>

        {editingMatch && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Wyniki meczu</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{editingMatch.participant1?.name || "TBD"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formState.score1}
                    onChange={(e) => setFormState((s) => ({ ...s, score1: e.target.value }))}
                    className="text-center text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{editingMatch.participant2?.name || "TBD"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formState.score2}
                    onChange={(e) => setFormState((s) => ({ ...s, score2: e.target.value }))}
                    className="text-center text-lg font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">BOx (best of)</Label>
                <Input
                  type="number"
                  min={1}
                  step={2}
                  placeholder="1, 3, 5..."
                  value={formState.best_of}
                  onChange={(e) => setFormState((s) => ({ ...s, best_of: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Uwaga: zmiana BOx może wymagać aktualizacji w harmonogramie meczów.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <select
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, status: e.target.value as EditMatchFormState["status"] }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="PENDING">Oczekuje</option>
                  <option value="SCHEDULED">Zaplanowany</option>
                  <option value="LIVE">W trakcie</option>
                  <option value="COMPLETED">Zakończony</option>
                  <option value="CANCELLED">Anulowany</option>
                  <option value="WALKOVER">Walkover</option>
                  <option value="DISQUALIFIED">Dyskwalifikacja</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Czas (zaplanowany)</Label>
              <input
                type="datetime-local"
                value={formState.scheduled_at}
                onChange={(e) => setFormState((s) => ({ ...s, scheduled_at: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">Format: lokalny czas przeglądarki.</p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">Akcje specjalne</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Walkover dla</Label>
                  <select
                    value={formState.walkoverFor}
                    onChange={(e) => setFormState((s) => ({ ...s, walkoverFor: e.target.value, dqFor: "" }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">— brak —</option>
                    <option value="p1">{editingMatch.participant1?.name || "TBD"}</option>
                    <option value="p2">{editingMatch.participant2?.name || "TBD"}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dyskwalifikacja</Label>
                  <select
                    value={formState.dqFor}
                    onChange={(e) => setFormState((s) => ({ ...s, dqFor: e.target.value, walkoverFor: "" }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">— brak —</option>
                    <option value="p1">{editingMatch.participant1?.name || "TBD"}</option>
                    <option value="p2">{editingMatch.participant2?.name || "TBD"}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-8 gap-3">
          <UIButton variant="outline" onClick={onCancel}>
            Anuluj
          </UIButton>
          <UIButton onClick={onSave} disabled={saving} className="min-w-[100px]">
            {saving ? "Zapisywanie..." : "Zapisz"}
          </UIButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
