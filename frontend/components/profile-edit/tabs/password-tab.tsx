"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import toast from "react-hot-toast"

export function ProfileEditPasswordTab() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" })
  const [loading, setLoading] = useState(false)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      toast.error("Hasła nie są takie same")
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password: form.new_password })
      if (error) throw error
      toast.success("Hasło zostało zaktualizowane")
      setForm({ current_password: "", new_password: "", confirm_password: "" })
    } catch (err: any) {
      toast.error(err.message || "Błąd aktualizacji hasła")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-2">Password</h1>
        <p className="text-gray-400 text-sm">It is a long established fact that a reader will be distracted.</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white font-medium mb-2 block">Current password</Label>
                <Input
                  name="current_password"
                  type="password"
                  value={form.current_password}
                  onChange={onChange}
                  placeholder="Enter current password"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <Label className="text-white font-medium mb-2 block">New password</Label>
                <Input
                  name="new_password"
                  type="password"
                  value={form.new_password}
                  onChange={onChange}
                  placeholder="Enter new password"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <Label className="text-white font-medium mb-2 block">Confirm new password</Label>
                <Input
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={onChange}
                  placeholder="Repeat the new password"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-2 font-medium"
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
