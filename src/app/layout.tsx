import type { Metadata } from "next";
import { Rowdies, Cinzel } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import { AlertProvider } from "@/components/ui/alert-system";

import React from "react";

// Load Rowdies and Cinzel fonts
const rowdies = Rowdies({
    variable: "--font-rowdies",
    subsets: ["latin"],
    weight: ["300", "400", "700"], // Adjust weights based on your design needs
});

const cinzel = Cinzel({
    variable: "--font-cinzel",
    subsets: ["latin"],
    weight: ["400", "700", "900"], // Adjust weights as needed
});

export const metadata: Metadata = {
    title: "G-45 Main - Church Management System",
    description: "Prepare the way - Professional church management platform",
    icons: {
        icon: [
            {
                url: "/logo.jpg",
                sizes: "32x32",
                type: "image/jpeg",
            },
            {
                url: "/logo.jpg", 
                sizes: "16x16",
                type: "image/jpeg",
            }
        ],
        apple: [
            {
                url: "/logo.jpg",
                sizes: "180x180",
                type: "image/jpeg",
            }
        ],
        other: [
            {
                rel: "icon",
                url: "/logo.jpg",
            }
        ]
    },
};

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode;}>) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/logo.jpg" type="image/jpeg" />
            <link rel="apple-touch-icon" href="/logo.jpg" />
            <link rel="shortcut icon" href="/logo.jpg" />
        </head>
        <body
            className={`${rowdies.variable} ${cinzel.variable} antialiased`}
        >
        <Providers>
            <AlertProvider>
                {children}
            </AlertProvider>
        </Providers>
        </body>
        </html>
    );
}
