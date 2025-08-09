"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  variant = 'default',
  loading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-cyan-500 hover:bg-cyan-600 text-black'
            }
          >
            {loading ? 'Ładowanie...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}