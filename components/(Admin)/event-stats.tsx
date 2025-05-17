"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Button } from "@/components/ui/button"
import { Download, Filter, Loader2 } from "lucide-react"
import { downloadEventData } from "@/app/(Admin)/Participants/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { getEventsOfUser } from "@/backend/events"
import type { ExtendedParticipant } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface EventStatsProps {
  participants: ExtendedParticipant[]
}

type EventData = {
  name: string
  count: number
  category: string
  participantCount: number
  ajietCount: number
  nonAjietCount: number
}

export function EventStats({ participants }: EventStatsProps) {
  const [eventData, setEventData] = useState<EventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState<number>(50)
  const [processedCount, setProcessedCount] = useState<number>(0)
  const [totalToProcess, setTotalToProcess] = useState<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088fe",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#a4de6c",
    "#d0ed57",
  ]

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    const processEventData = async () => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        setIsLoading(true)
        setProcessedCount(0)
        setTotalToProcess(participants.length)

        const eventCounts: Record<
          string,
          {
            count: number
            category: string
            participantCount: number
            ajietCount: number
            nonAjietCount: number
          }
        > = {}

        const processedUSNs: Record<
          string,
          {
            all: Set<string>
            ajiet: Set<string>
            nonAjiet: Set<string>
          }
        > = {}

        const batchSize = 10
        for (let i = 0; i < participants.length; i += batchSize) {
          if (abortControllerRef.current?.signal.aborted) {
            return
          }

          const batch = participants.slice(i, i + batchSize)

          for (const participant of batch) {
            const events = await getEventsOfUser(participant.id)
            const isAjiet = participant.college?.includes("A J Institute of Engineering and Technology, Mangalore") || false

            if (events && Array.isArray(events)) {
              for (const event of events) {
                const eventName = event.eventName

                if (!eventCounts[eventName]) {
                  eventCounts[eventName] = {
                    count: 0,
                    category: event.eventCategory,
                    participantCount: 0,
                    ajietCount: 0,
                    nonAjietCount: 0,
                  }
                  processedUSNs[eventName] = {
                    all: new Set<string>(),
                    ajiet: new Set<string>(),
                    nonAjiet: new Set<string>(),
                  }
                }

                eventCounts[eventName].count++

                if (!processedUSNs[eventName].all.has(participant.usn)) {
                  processedUSNs[eventName].all.add(participant.usn)
                  eventCounts[eventName].participantCount++

                  if (isAjiet) {
                    processedUSNs[eventName].ajiet.add(participant.usn)
                    eventCounts[eventName].ajietCount++
                  } else {
                    processedUSNs[eventName].nonAjiet.add(participant.usn)
                    eventCounts[eventName].nonAjietCount++
                  }
                }
              }
            }

            setProcessedCount((prev) => prev + 1)
          }

          const formattedData = Object.entries(eventCounts).map(([name, data]) => ({
            name,
            count: data.count,
            participantCount: data.participantCount,
            ajietCount: data.ajietCount,
            nonAjietCount: data.nonAjietCount,
            category: data.category,
          }))

          formattedData.sort((a, b) => b.count - a.count)
          setEventData(formattedData)
        }

        const finalFormattedData = Object.entries(eventCounts).map(([name, data]) => ({
          name,
          count: data.count,
          participantCount: data.participantCount,
          ajietCount: data.ajietCount,
          nonAjietCount: data.nonAjietCount,
          category: data.category,
        }))

        finalFormattedData.sort((a, b) => b.count - a.count)
        setEventData(finalFormattedData)
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Error processing event data:", err)
          setError("Failed to process event statistics")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (participants.length > 0) {
      processEventData()
    }
  }, [participants])

  const handleDownloadEventData = async () => {
    try {
      await downloadEventData(eventData)
    } catch (error) {
      console.error("Error downloading event data:", error)
      setError("Failed to download event data")
    }
  }

  const handleDownloadAjietData = async () => {
    try {
      const ajietData = eventData.map(event => ({
        name: event.name,
        count: event.ajietCount,
        participantCount: event.ajietCount,
        ajietCount: event.ajietCount,
        nonAjietCount: 0,
        category: event.category,
      })).filter(event => event.ajietCount > 0)

      await downloadEventData(ajietData)
    } catch (error) {
      console.error("Error downloading AJIET event data:", error)
      setError("Failed to download AJIET event data")
    }
  }

  const handleDownloadNonAjietData = async () => {
    try {
      const nonAjietData = eventData.map(event => ({
        name: event.name,
        count: event.nonAjietCount,
        participantCount: event.nonAjietCount,
        ajietCount: 0,
        nonAjietCount: event.nonAjietCount,
        category: event.category,
      })).filter(event => event.nonAjietCount > 0)

      await downloadEventData(nonAjietData)
    } catch (error) {
      console.error("Error downloading non-AJIET event data:", error)
      setError("Failed to download non-AJIET event data")
    }
  }

  const prepareBarData = (data: EventData[], type: "all" | "A J Institute of Engineering and Technology, Mangalore" | "nonAjiet") => {
    const displayData = data.slice(0, displayCount)

    return displayData
      .map((event) => ({
        name: event.name,
        value: type === "all" ? event.participantCount : type === "A J Institute of Engineering and Technology, Mangalore" ? event.ajietCount : event.nonAjietCount,
        category: event.category,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  const allParticipantsData = prepareBarData(eventData, "all")
  const ajietParticipantsData = prepareBarData(eventData, "A J Institute of Engineering and Technology, Mangalore")
  const nonAjietParticipantsData = prepareBarData(eventData, "nonAjiet")


  const getCategoryData = (data: EventData[], type: "all" | "A J Institute of Engineering and Technology, Mangalore" | "nonAjiet") => {
    const categoryMap: Record<string, number> = {}

    data.forEach((event) => {
      const count = type === "all" ? event.participantCount : type === "A J Institute of Engineering and Technology, Mangalore" ? event.ajietCount : event.nonAjietCount

      if (count > 0) {
        if (!categoryMap[event.category]) {
          categoryMap[event.category] = 0
        }
        categoryMap[event.category] += count
      }
    })

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }

  const allCategoryData = getCategoryData(eventData, "all")
  const ajietCategoryData = getCategoryData(eventData, "A J Institute of Engineering and Technology, Mangalore")
  const nonAjietCategoryData = getCategoryData(eventData, "nonAjiet")


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm">{`Count: ${payload[0].value}`}</p>
          {payload[0].payload.category && (
            <p className="text-xs text-muted-foreground">{`Category: ${payload[0].payload.category}`}</p>
          )}
        </div>
      )
    }
    return null
  }

  // if (isLoading && eventData.length === 0) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="flex justify-between items-center">
  //         <Skeleton className="h-9 w-64" />
  //         <Skeleton className="h-9 w-36" />
  //       </div>
  //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //         <Skeleton className="h-28 w-full rounded-lg" />
  //         <Skeleton className="h-28 w-full rounded-lg" />
  //         <Skeleton className="h-28 w-full rounded-lg" />
  //       </div>
  //       <Skeleton className="h-64 w-full rounded-lg" />
  //     </div>
  //   )
  // }

  if (error) {
    return <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="md:text-lg font-medium">Event Registration Statistics</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={displayCount.toString()} onValueChange={(value) => setDisplayCount(Number.parseInt(value))}>
              <SelectTrigger className="w-[180px] cursor-pointer">
                <SelectValue placeholder="Show top events" />
              </SelectTrigger>
              <SelectContent className="cursor-pointer">
                <SelectItem value="50" className="cursor-pointer">All events</SelectItem>
                <SelectItem value="5" className="cursor-pointer">Top 5 events</SelectItem>
                <SelectItem value="10" className="cursor-pointer">Top 10 events</SelectItem>
                <SelectItem value="15" className="cursor-pointer">Top 15 events</SelectItem>
                <SelectItem value="20" className="cursor-pointer">Top 20 events</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleDownloadEventData} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              Download All Data
            </Button>
            <Button onClick={handleDownloadAjietData} className="cursor-pointer" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              AJIET Data Only
            </Button>
            <Button onClick={handleDownloadNonAjietData} className="cursor-pointer" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Non-AJIET Data
            </Button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">
              Processing data: {processedCount} Registrations processed
            </p>
          </div>
          <Progress value={(processedCount / totalToProcess) * 100} className="h-2" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {["Technical", "Cultural", "Gaming", "Special", "ComboPass"].map((category) => {
          const categoryEvents = eventData.filter((event) => event.category.toLowerCase() === category.toLowerCase())
          const totalRegistrations = categoryEvents.reduce((sum, event) => sum + event.count, 0)

          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{category} Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoryEvents.length}</div>
                <p className="text-xs text-muted-foreground">{totalRegistrations} total registrations</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="all" className="w-full hidden md:flex">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="cursor-pointer">All Registrations</TabsTrigger>
          <TabsTrigger value="ajiet" className="cursor-pointer">AJIET Students</TabsTrigger>
          <TabsTrigger value="nonAjiet" className="cursor-pointer">Non-AJIET Students</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Events - All Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {allParticipantsData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No event data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={allParticipantsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => (value.length > 10 ? `${value.substring(0, 10)}...` : value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Registrations">
                          {allParticipantsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrations by Category - All</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {allCategoryData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No category data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={allCategoryData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Registrations">
                          {allCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ajiet">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Events - AJIET Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {ajietParticipantsData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No AJIET student data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ajietParticipantsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => (value.length > 10 ? `${value.substring(0, 10)}...` : value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Registrations">
                          {ajietParticipantsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrations by Category - AJIET</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {ajietCategoryData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No AJIET category data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ajietCategoryData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Registrations">
                          {ajietCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nonAjiet">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Events - Non-AJIET Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {nonAjietParticipantsData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No non-AJIET student data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={nonAjietParticipantsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => (value.length > 10 ? `${value.substring(0, 10)}...` : value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Registrations">
                          {nonAjietParticipantsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrations by Category - Non-AJIET</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {nonAjietCategoryData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No non-AJIET category data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={nonAjietCategoryData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Registrations">
                          {nonAjietCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}