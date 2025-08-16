"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth/auth-context"
import { supabase } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

// Predefiniowane awatary
const predefinedAvatars = [
  "/images/Avatar1.png",
  "/images/Avatar2.png",
  "/images/Avatar3.png",
  "/images/Avatar4.png",
  "/images/Avatar5.png",
]

// Predefiniowane banery
const predefinedBanners = [
  "/banners/ProfilBaner.png",
  "/banners/ProfilBaner2.png",
  "/banners/Tournament-card.png",
  "/banners/cs2-tournament.webp",
  "/banners/default-tournament-banner.png",
  "/banners/valorant-tournament.png",
]

// Lista krajów z kodami ISO i flagami emoji
const countries = [
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
]

// Popularne strefy czasowe
const timezones = [
  { value: "Europe/Warsaw", label: "Europe/Warsaw (CET/CEST)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/Rome", label: "Europe/Rome (CET/CEST)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET/CEST)" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm (CET/CEST)" },
  { value: "Europe/Helsinki", label: "Europe/Helsinki (EET/EEST)" },
  { value: "Europe/Moscow", label: "Europe/Moscow (MSK)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "America/Toronto", label: "America/Toronto (EST/EDT)" },
  { value: "America/Vancouver", label: "America/Vancouver (PST/PDT)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT/BRST)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (CST/CDT)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong (HKT)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne (AEST/AEDT)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZST/NZDT)" },
]

export function ProfileEditProfileTab() {
  const { customUser, updateProfile, refreshUserData } = useAuth()

  const [form, setForm] = useState({
    username: customUser?.username || "",
    display_name: customUser?.display_name || "",
    email: customUser?.email || "",
    bio: customUser?.bio || "",
    avatar_url: customUser?.avatar_url || "/images/demo-avatar.png",
    banner_url: customUser?.banner_url || "/banners/ProfilBaner.png",
    country: customUser?.country || "",
    city: customUser?.city || "",
    date_of_birth: customUser?.date_of_birth || "",
    timezone: customUser?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const [uploading, setUploading] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const getUUID = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto as Crypto).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  const isFromAvatarsBucket = (url: string) => url.includes("/storage/v1/object/public/avatars/")
  const getStoragePathFromPublicUrl = (url: string) => url.split("/storage/v1/object/public/avatars/")[1]

  const isFromBannersBucket = (url: string) => url.includes("/storage/v1/object/public/banners/")
  const getBannerStoragePathFromPublicUrl = (url: string) => url.split("/storage/v1/object/public/banners/")[1]

  const handleAvatarUpload = async (file: File) => {
    try {
      if (!file) return
      if (!file.type.startsWith("image/")) {
        toast.error("Dozwolone są wyłącznie pliki graficzne")
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Maksymalny rozmiar pliku to 2MB")
        return
      }
      setUploading(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${customUser?.id}/${getUUID()}.${fileExt}`
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(data.path)
      const url = publicUrl.publicUrl
      setForm((prev) => ({ ...prev, avatar_url: url }))
      await updateProfile({ avatar_url: url })
      await refreshUserData()
      toast.success("Zdjęcie profilowe zaktualizowane")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Błąd podczas przesyłania pliku")
    } finally {
      setUploading(false)
    }
  }

  const handleBannerUpload = async (file: File) => {
    try {
      if (!file) return
      if (!file.type.startsWith("image/")) {
        toast.error("Dozwolone są wyłącznie pliki graficzne")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Maksymalny rozmiar pliku to 5MB")
        return
      }
      setUploadingBanner(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${customUser?.id}/${getUUID()}.${fileExt}`
      const { data, error } = await supabase.storage.from("banners").upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: publicUrl } = supabase.storage.from("banners").getPublicUrl(data.path)
      const url = publicUrl.publicUrl
      setForm((prev) => ({ ...prev, banner_url: url }))
      await updateProfile({ banner_url: url })
      await refreshUserData()
      toast.success("Banner zaktualizowany")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Błąd podczas przesyłania baneru")
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      if (form.avatar_url && isFromAvatarsBucket(form.avatar_url)) {
        const path = getStoragePathFromPublicUrl(form.avatar_url)
        await supabase.storage.from("avatars").remove([path])
      }
      const fallback = "/images/demo-avatar.png"
      setForm((prev) => ({ ...prev, avatar_url: fallback }))
      await updateProfile({ avatar_url: fallback })
      await refreshUserData()
      toast.success("Avatar usunięty")
    } catch (err: any) {
      toast.error(err.message || "Nie udało się usunąć avatara")
    }
  }

  const handleRemoveBanner = async () => {
    try {
      if (form.banner_url && isFromBannersBucket(form.banner_url)) {
        const path = getBannerStoragePathFromPublicUrl(form.banner_url)
        await supabase.storage.from("banners").remove([path])
      }
      const fallback = "/banners/ProfilBaner.png"
      setForm((prev) => ({ ...prev, banner_url: fallback }))
      await updateProfile({ banner_url: fallback })
      await refreshUserData()
      toast.success("Banner usunięty")
    } catch (err: any) {
      toast.error(err.message || "Nie udało się usunąć baneru")
    }
  }

  const handleSelectPredefinedAvatar = async (avatarUrl: string) => {
    try {
      setForm((prev) => ({ ...prev, avatar_url: avatarUrl }))
      await updateProfile({ avatar_url: avatarUrl })
      await refreshUserData()
      toast.success("Avatar zaktualizowany")
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zaktualizować avatara")
    }
  }

  const handleSelectPredefinedBanner = async (bannerUrl: string) => {
    try {
      setForm((prev) => ({ ...prev, banner_url: bannerUrl }))
      await updateProfile({ banner_url: bannerUrl })
      await refreshUserData()
      toast.success("Banner zaktualizowany")
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zaktualizować baneru")
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Build updates payload
      const updates: any = {
        username: form.username,
        display_name: form.display_name,
        bio: form.bio,
        avatar_url: form.avatar_url,
        banner_url: form.banner_url,
        country: form.country || undefined,
        city: form.city || undefined,
        date_of_birth: form.date_of_birth || undefined,
      }

      // Only send timezone/settings if it actually changed compared to current user data
      const currentTz = customUser?.settings?.timezone || ""
      if (form.timezone && form.timezone !== currentTz) {
        updates.settings = { timezone: form.timezone }
      }

      await updateProfile(updates)
      await refreshUserData()
      toast.success("Profil zapisany")
    } catch (e) {
      toast.error("Nie udało się zapisać profilu")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Profile Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400 text-sm">It is a long established fact that a reader will be distracted.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Banner Upload Section */}
          <div className="space-y-6">
            {/* Large Banner Upload Area */}
            <div className="relative">
              <div className="w-full h-48 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center space-y-4">
                {form.banner_url ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image src={form.banner_url || "/placeholder.svg"} alt="Banner" fill className="object-cover" />
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-white mb-2">Upload Banner Image</h3>
                      <p className="text-gray-400 text-sm">Optimal dimensions 1200x300px</p>
                    </div>
                    <Button
                      type="button"
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg"
                      onClick={() => document.getElementById("banner-upload")?.click()}
                    >
                      Upload banner
                    </Button>
                  </>
                )}
              </div>
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleBannerUpload(e.target.files[0])}
                disabled={uploadingBanner}
                className="hidden"
              />
            </div>

            {/* Predefiniowane banery */}
            <div>
              <Label className="text-sm text-gray-300 mb-3 block">Lub wybierz predefiniowany banner:</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {predefinedBanners.map((bannerUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPredefinedBanner(bannerUrl)}
                    className={cn(
                      "relative w-full h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                      form.banner_url === bannerUrl
                        ? "border-cyan-500 ring-2 ring-cyan-500/50"
                        : "border-gray-600 hover:border-gray-500",
                    )}
                  >
                    <Image
                      src={bannerUrl || "/placeholder.svg"}
                      alt={`Banner ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Info Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Personal Info</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Username</Label>
                <Input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder="@Blade"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Display Name</Label>
                <Input
                  name="display_name"
                  value={form.display_name}
                  onChange={onChange}
                  placeholder="Your display name"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Email</Label>
                <Input
                  name="email"
                  value={form.email}
                  disabled
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">Country</Label>
                  <Select
                    value={form.country || ""}
                    onValueChange={(value) => onSelectChange("country", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500 focus:ring-cyan-500">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="mr-2">{country.flag}</span>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">City</Label>
                  <Input
                    name="city"
                    value={form.city}
                    onChange={onChange}
                    placeholder="Your city"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Date of Birth</Label>
                <Input
                  name="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={onChange}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Timezone</Label>
                <Select
                  value={form.timezone || ""}
                  onValueChange={(value) => onSelectChange("timezone", value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-cyan-500 focus:ring-cyan-500">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Description</Label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-32 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                  placeholder="Describe yourself"
                />
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Social media</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-gray-400">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
                <Input
                  placeholder="@blade"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
                <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  ×
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-gray-400">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </div>
                <Input
                  placeholder="@blade"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
                <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  ×
                </Button>
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Avatar</h2>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700">
                <Image
                  src={form.avatar_url || "/placeholder.svg"}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleAvatarUpload(e.target.files[0])}
                    disabled={uploading}
                    className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:text-white bg-transparent"
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                  >
                    Usuń
                  </Button>
                </div>
                <p className="text-xs text-gray-400">PNG/JPG/SVG. Max 2MB.</p>
              </div>
            </div>

            {/* Predefiniowane awatary */}
            <div>
              <Label className="text-sm text-gray-300 mb-3 block">Lub wybierz predefiniowany avatar:</Label>
              <div className="grid grid-cols-6 gap-3">
                {predefinedAvatars.map((avatarUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPredefinedAvatar(avatarUrl)}
                    className={cn(
                      "w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105",
                      form.avatar_url === avatarUrl
                        ? "border-cyan-500 ring-2 ring-cyan-500/50"
                        : "border-gray-600 hover:border-gray-500",
                    )}
                  >
                    <Image
                      src={avatarUrl || "/placeholder.svg"}
                      alt={`Avatar ${index + 1}`}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-2">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
