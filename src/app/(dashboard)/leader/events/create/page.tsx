






// src/app/(dashboard)/leader/events/create/page.tsx
"use client"
import { CreateEventForm } from "@/components/CreateEventForm"
import { ProfessionalHeader } from "@/components/ProfessionalHeader"

export default function CreateEventPage() {
    return (
        <div className="min-h-screen bg-blue-300">
            <ProfessionalHeader
                title="Create New Event"
                subtitle="Schedule a new event for your group"
                backHref="/leader/events"
            />

            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                <CreateEventForm
                    onEventCreated={(event) => {
                        window.location.href = `/leader/events`
                    }}
                />
            </div>
        </div>
    )
}

//////////////////////////////////////////////////////