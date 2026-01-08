import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline',
    size?: 'default' | 'sm' | 'lg'
}>(
    ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
        const variants = {
            primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm",
            secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)]",
            outline: "bg-transparent border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]",
            ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--accent)]",
            danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm"
        };
        const sizes = {
            default: "px-4 py-2 text-sm",
            sm: "px-3 py-1.5 text-xs",
            lg: "px-6 py-3 text-base"
        };
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
                    variants[variant],
                    sizes[size],
                    className
                )}
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
                className={cn("flex h-10 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-[var(--background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 transition-all", className)}
                {...props}
            />
        )
    }
)

export const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={cn("text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--foreground)]", className)}>{children}</label>
)

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm p-6", className)}>{children}</div>
)

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={cn("flex h-10 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 transition-all", className)}
                {...props}
            />
        )
    }
)
