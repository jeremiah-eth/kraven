"use client"

import {
    CheckCircleIcon,
    InfoIcon,
    Loader2Icon,
    XOctagonIcon,
    AlertTriangleIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            icons={{
                success: <CheckCircleIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <AlertTriangleIcon className="size-4" />,
                error: <XOctagonIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                } as React.CSSProperties
            }
            {...props}
        />
    )
}

export { Toaster }
