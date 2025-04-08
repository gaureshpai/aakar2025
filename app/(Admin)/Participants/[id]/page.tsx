"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Phone, Mail, School, User, Users, Tag, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getParticipant } from "@/backend/participant"
import Link from "next/link"
import type { Participant, Event } from "@prisma/client"

type ExtendedParticipant = Participant & {
  events: Event[]
}

export default function ParticipantDetailPage() {
  const { id } = useParams()
  const [participant, setParticipant] = useState<ExtendedParticipant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])

  useEffect(() => {
    const fetchParticipantDetails = async () => {
      try {
        setIsLoading(true)
        const participantId = Array.isArray(id) ? id[0] : id

        if (!participantId) {
          setError("Invalid participant ID")
          return
        }

        const response = await getParticipant(participantId)

        if (response.error) {
          setError(typeof response.error === "string" ? response.error : "Failed to fetch participant details")
          return
        }

        if (response.data) {
          setParticipant(response.data as ExtendedParticipant)

          // Parse group members data if available
          if (response.data.groupMembersData) {
            try {
              const parsedData =
                typeof response.data.groupMembersData === "string"
                  ? JSON.parse(response.data.groupMembersData)
                  : response.data.groupMembersData

              setGroupMembers(Array.isArray(parsedData) ? parsedData : [])
            } catch (err) {
              console.error("Error parsing group members data:", err)
              setGroupMembers([])
            }
          }
        }
      } catch (err) {
        setError("An error occurred while fetching participant details")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchParticipantDetails()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-lg">Loading participant details...</div>
        </div>
      </div>
    )
  }

  if (error || !participant) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 text-red-500 p-4 rounded-md">{error || "Participant not found"}</div>
            <div className="mt-4">
              <Button asChild className="cursor-pointer">
                <Link href="/admin/participants">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Participants
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild className="cursor-pointer">
          <Link href="/Participants" className="cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Participants
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participant Details</CardTitle>
          <CardDescription>Complete information about the participant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <Separator />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Name</div>
                    <div>{participant.name}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div>{participant.email}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div>{participant.phone}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Tag className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">USN</div>
                    <div>{participant.usn}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <School className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">College</div>
                    <div>{participant.college}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Department & Year</div>
                    <div>
                      {participant.department || "N/A"} - {participant.year}st Year
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Registered On</div>
                    <div>{new Date(participant.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Payment Information</h3>
                <Separator />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Amount Paid</div>
                    <div>₹{participant.amount}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Tag className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Transaction ID</div>
                    <div>{participant.transaction_ids.join(", ") || "N/A"}</div>
                  </div>
                </div>

                {participant.paymentScreenshotUrls && (
                  participant.paymentScreenshotUrls.map(pS=>(
                  <div>
                    <div className="font-medium mb-2">Payment Screenshot</div>
                    <div className="border rounded-md overflow-hidden max-w-xs">
                      <img
                        src={pS || "/placeholder.svg"}
                        alt="Payment Screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Registered Events</h3>
              <Separator />
            </div>

            {participant.events && participant.events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participant.events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{event.eventName}</h4>
                          <div className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()} at {event.time}
                          </div>
                          <div className="text-sm text-muted-foreground">Venue: {event.venue}</div>
                          <div className="mt-2 flex gap-2">
                            <Badge>{event.eventCategory}</Badge>
                            <Badge variant="outline">{event.eventType}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{event.fee}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No events registered</div>
            )}
          </div>

          {groupMembers.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Group Members</h3>
                <Separator />
              </div>

              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        USN
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Event
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groupMembers.map((member, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap">{member.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{member.usn}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{member.event}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

