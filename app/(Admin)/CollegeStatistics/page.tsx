"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { getParticipantsWithEvents } from "@/backend/participant"
import { CollegeStats } from "@/components/(Admin)/college-stats"
import { Skeleton } from "@/components/ui/skeleton"
import type { ExtendedEvent, ExtendedParticipant } from "@/types"

export default function CollegeStatisticsPage() {
    const [participants, setParticipants] = useState<(ExtendedParticipant & { events: ExtendedEvent[] })[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const sortParticipantsByNewest = (participants: any) => {
        return [...participants].sort((a, b) => b.id - a.id)
    }

    const fetchParticipants = async () => {
        try {
            setIsLoading(true)
            const response = await getParticipantsWithEvents()

            if (response.error) {
                setError(typeof response.error === "string" ? response.error : "Failed to fetch participants")
                return
            }

            if (response.data) {
                const sortedData = sortParticipantsByNewest(response.data)
                setParticipants(sortedData)
            }
        } catch (err) {
            setError("An error occurred while fetching participants")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchParticipants()
    }, [])

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardContent>
                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">{error}</div>}

                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-64" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-64 w-full" />
                                <Skeleton className="h-64 w-full" />
                            </div>
                        </div>
                    ) : (
                        <CollegeStats participants={participants} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}