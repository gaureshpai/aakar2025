"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadCollegeData } from "@/app/(Admin)/Participants/utils"
import { ExtendedParticipant } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

interface CollegeStatsProps {
  participants: ExtendedParticipant[]
}

export function CollegeStats({ participants }: CollegeStatsProps) {
  const [collegeData, setCollegeData] = useState<{ name: string; value: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
    "#ffc658",
    "#ff7300",
    "#BA8b28",
    "#00C49F",
    "#00880E",
    "#FF3042",
    "#A9B318",
    "#EAEB28",
    "#ABCB28",
    "#B28",
    "#1A8B28",
    "#BAC",
    "#BFC",
    "#FF8",
    "#888",
  ]

  useEffect(() => {
    const processCollegeData = () => {
      try {
        setIsLoading(true)

        const collegeCounts: Record<string, number> = {}

        for (const participant of participants) {
          const college = participant.college
          if (!collegeCounts[college]) {
            collegeCounts[college] = 0
          }
          collegeCounts[college]++
        }

        let formattedData = Object.entries(collegeCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        setCollegeData(formattedData)
      } catch (err) {
        console.error("Error processing college data:", err)
        setError("Failed to process college statistics")
      } finally {
        setIsLoading(false)
      }
    }

    if (participants.length > 0) {
      processCollegeData()
    }
  }, [participants])

  const handleDownloadCollegeData = async () => {
    try {
      await downloadCollegeData(participants)
    } catch (error) {
      console.error("Error downloading college data:", error)
      setError("Failed to download college data")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(null).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle>
                  <Skeleton className="h-4 w-32" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                {i === 3 && <Skeleton className="h-3 w-24 mt-1" />}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-full max-w-md flex flex-col items-center">
                <div className="w-72 h-72 rounded-full relative">
                  <Skeleton className="w-full h-full rounded-full" />
                  <div className="absolute inset-0 rounded-full border-8 border-background" style={{ borderRadius: '50%' }} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                  {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
  }

  const totalParticipants = participants.length
  const totalColleges = Object.keys(
    participants.reduce(
      (acc, participant) => {
        acc[participant.college] = true
        return acc
      },
      {} as Record<string, boolean>,
    ),
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h3 className="text-lg font-medium">College Registration Statistics</h3>
        <Button onClick={handleDownloadCollegeData} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Download College Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Colleges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalColleges}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registrations (Except HOST)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants - collegeData[0].value}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Registrations per College</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalColleges ? (totalParticipants / totalColleges).toFixed(1) : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top College(Except HOST)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{collegeData.length > 0 ? collegeData[1].name : "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {collegeData.length > 0 ? `${collegeData[1].value} participants` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrations by College</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-screen w-full overflow-hidden">
            {collegeData.length === 0 ? (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                No college data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collegeData.slice(1)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    className="text-sm mb-10"
                    label={({ name, percent, value }) => `${name}: ${value} reg(${(percent * 100).toFixed(0)}%)`}
                  >
                    {collegeData.slice(1).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} registrations`, "Count"]} />
                  <Legend className="text-xs mt-10 pt-10" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

