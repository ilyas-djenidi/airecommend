import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700",
            secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
            danger: "bg-red-500 text-white hover:bg-red-600"
        };
        return (
            <button
                ref={ref}
                className={cn("px-4 py-2 rounded-md transition-colors text-sm font-medium focus:ring-2 focus:ring-offset-1 disabled:opacity-50", variants[variant], className)}
                {...props}
            />
        )
    }
)

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn("px-3 py-2 border rounded-md border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full", className)}
                {...props}
            />
        )
    }
)

export const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={cn("block text-sm font-medium text-slate-700 mb-1", className)}>{children}</label>
)

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white rounded-lg border border-slate-200 shadow-sm p-6", className)}>{children}</div>
)

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={cn("px-3 py-2 border rounded-md border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full", className)}
                {...props}
            />
        )
    }
)
