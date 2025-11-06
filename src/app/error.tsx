'use client'

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorBoundary({ 
    error,
    reset,
}: { 
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter()
    const reload = () => {
        startTransition(() => {
            router.refresh();
            reset();
        })
    }
    return (
        <div className="min-h-screen bg-blue-300 flex items-center justify-center px-4">
            <div className="bg-blue-200/90 backdrop-blur-md rounded-lg shadow-xl border border-blue-300 p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-blue-800 mb-2">Oops! Something went wrong</h1>
                    <p className="text-blue-700 mb-6">{error.message}</p>
                </div>
                <button 
                    onClick={reload} 
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Try Again
                </button>
            </div>
        </div>
    )
}