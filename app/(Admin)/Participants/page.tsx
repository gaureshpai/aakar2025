"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DownloadCloud,
    Filter,
    Search,
    School,
    FileSpreadsheet,
    Users,
    ChevronDown,
    ChevronRight,
    Calendar,
} from "lucide-react";
import React from "react";
import { getParticipants } from "@/backend/participant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EventStats } from "@/components/(Admin)/Participants/event-stats";
import { CollegeStats } from "@/components/(Admin)/Participants/college-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadParticipantData } from "./utils";
import { ExtendedParticipant } from "@/types";

export default function ParticipantsPage() {
    const [participants, setParticipants] = useState<ExtendedParticipant[]>([]);
    const [filteredParticipants, setFilteredParticipants] = useState<
        ExtendedParticipant[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCollege, setSelectedCollege] = useState<string>("");
    const [colleges, setColleges] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [expandedParticipant, setExpandedParticipant] = useState<
        string | null
    >(null);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                setIsLoading(true);
                const response = await getParticipants();

                if (response.error) {
                    setError(
                        typeof response.error === "string"
                            ? response.error
                            : "Failed to fetch participants"
                    );
                    return;
                }

                if (response.data) {
                    const processedParticipants = response.data.map(
                        (p: ExtendedParticipant) => {
                            let groupMembers = [];

                            if (p.groupMembersData) {
                                try {
                                    groupMembers =
                                        typeof p.groupMembersData === "string"
                                            ? JSON.parse(p.groupMembersData)
                                            : p.groupMembersData;
                                } catch (e) {
                                    console.error(
                                        "Error parsing group members data",
                                        e
                                    );
                                }
                            }

                            return {
                                ...p,
                                groupMembers,
                            };
                        }
                    );

                    setParticipants(processedParticipants);
                    setFilteredParticipants(processedParticipants);

                    const uniqueColleges = Array.from(
                        new Set(processedParticipants.map((p) => p.college))
                    ) as string[];
                    setColleges(uniqueColleges);
                }
            } catch (err) {
                setError("An error occurred while fetching participants");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchParticipants();
    }, []);

    useEffect(() => {
        let result = [...participants];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.email.toLowerCase().includes(query) ||
                    p.phone.includes(query) ||
                    p.college.toLowerCase().includes(query) ||
                    p.usn.toLowerCase().includes(query) ||
                    (p.groupMembersData &&
                        Object.values(p.groupMembersData).some((group) =>
                            group.members.some(
                                (m) =>
                                    m.name.toLowerCase().includes(query) ||
                                    m.usn.toLowerCase().includes(query)
                            )
                        ))
            );
        }

        if (selectedCollege && selectedCollege !== "all") {
            result = result.filter((p) => p.college === selectedCollege);
        }

        setFilteredParticipants(result);
    }, [searchQuery, selectedCollege, participants]);

    const handleDownloadAll = async () => {
        try {
            await downloadParticipantData(filteredParticipants);
        } catch (error) {
            console.error("Error downloading data:", error);
            setError("Failed to download participant data");
        }
    };

    const handleDownloadByCollege = async () => {
        try {
            await downloadParticipantData(filteredParticipants, true);
        } catch (error) {
            console.error("Error downloading data by college:", error);
            setError("Failed to download participant data by college");
        }
    };

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedCollege("");
        setFilteredParticipants(participants);
    };

    const toggleParticipantExpanded = (id: string) => {
        setExpandedParticipant(
            expandedParticipant === id ? null : id
        );
    };

    const TableSkeleton = () => (
        <>
            {Array(5)
                .fill(0)
                .map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-8" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-8 w-24" />
                        </TableCell>
                    </TableRow>
                ))}
        </>
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Participant Management</CardTitle>
                    <CardDescription>
                        View and manage all participant registrations for your
                        event
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="participants">
                        <TabsList className="mb-4">
                            <TabsTrigger
                                value="participants"
                                className="cursor-pointer"
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Participants
                            </TabsTrigger>
                            <TabsTrigger
                                value="events"
                                className="cursor-pointer"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Event Statistics
                            </TabsTrigger>
                            <TabsTrigger
                                value="colleges"
                                className="cursor-pointer"
                            >
                                <School className="mr-2 h-4 w-4" />
                                College Statistics
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="participants">
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Search participants, USN, email..."
                                                className="pl-8 w-full"
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    setSearchQuery(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                        <Select
                                            value={selectedCollege}
                                            onValueChange={setSelectedCollege}
                                        >
                                            <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
                                                <SelectValue placeholder="College" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value="all"
                                                    className="cursor-pointer"
                                                >
                                                    All Colleges
                                                </SelectItem>
                                                {colleges.map((college) => (
                                                    <SelectItem
                                                        key={college}
                                                        value={college}
                                                        className="cursor-pointer"
                                                    >
                                                        {college}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="outline"
                                            onClick={resetFilters}
                                            className="cursor-pointer"
                                        >
                                            <Filter className="mr-2 h-4 w-4" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {filteredParticipants.length}{" "}
                                            participants
                                        </Badge>
                                        {selectedCollege &&
                                            selectedCollege !== "all" && (
                                                <Badge variant="secondary">
                                                    <School className="mr-1 h-3 w-3" />
                                                    {selectedCollege}
                                                </Badge>
                                            )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            onClick={handleDownloadAll}
                                            className="cursor-pointer"
                                        >
                                            <DownloadCloud className="mr-2 h-4 w-4" />
                                            <span className="whitespace-nowrap">
                                                Download Data
                                            </span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleDownloadByCollege}
                                            className="cursor-pointer"
                                        >
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            <span className="whitespace-nowrap">
                                                Download by College
                                            </span>
                                        </Button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-500 p-3 rounded-md">
                                        {error}
                                    </div>
                                )}

                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>College</TableHead>
                                                <TableHead>
                                                    Department
                                                </TableHead>
                                                <TableHead>Year</TableHead>
                                                <TableHead>USN</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>
                                                    Registered On
                                                </TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableSkeleton />
                                            ) : filteredParticipants.length ===
                                              0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={10}
                                                        className="text-center py-10"
                                                    >
                                                        No participants found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredParticipants.map(
                                                    (participant) => (
                                                        <React.Fragment
                                                            key={participant.id}
                                                        >
                                                            <TableRow
                                                                className={
                                                                    expandedParticipant ===
                                                                    participant.id.toString()
                                                                        ? "border-b-0"
                                                                        : ""
                                                                }
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {
                                                                        participant.name
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        participant.email
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        participant.phone
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        participant.college
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {participant.department ||
                                                                        "N/A"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        participant.year
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        participant.usn
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    ₹
                                                                    {
                                                                        participant.amount
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {new Date(
                                                                        participant.createdAt
                                                                    ).toLocaleDateString()}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                (window.location.href = `/Participants/${participant.id}`)
                                                                            }
                                                                            className="cursor-pointer"
                                                                        >
                                                                            View
                                                                        </Button>

                                                                        {participant.groupMembersData &&
                                                                            Object.values(
                                                                                participant.groupMembersData
                                                                            ).some(
                                                                                (
                                                                                    group
                                                                                ) =>
                                                                                    group
                                                                                        .members
                                                                                        .length >
                                                                                    0
                                                                            ) && (
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        toggleParticipantExpanded(
                                                                                            participant.id
                                                                                        )
                                                                                    }
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    {expandedParticipant ===
                                                                                    participant.id.toString() ? (
                                                                                        <ChevronDown className="h-4 w-4" />
                                                                                    ) : (
                                                                                        <ChevronRight className="h-4 w-4" />
                                                                                    )}
                                                                                    Group
                                                                                </Button>
                                                                            )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            {participant.groupMembersData &&
                                                                Object.values(
                                                                    participant.groupMembersData
                                                                ).some(
                                                                    (group) =>
                                                                        group
                                                                            .members
                                                                            .length >
                                                                        0
                                                                ) &&
                                                                expandedParticipant ===
                                                                    participant.id.toString() && (
                                                                    <TableRow className="bg-muted/50">
                                                                        <TableCell
                                                                            colSpan={
                                                                                10
                                                                            }
                                                                            className="py-2"
                                                                        >
                                                                            <div className="pl-6 border-l-2 border-primary/20 ml-2 mt-2 overflow-x-auto">
                                                                                <h4 className="font-medium text-sm mb-2">
                                                                                    Group
                                                                                    Members
                                                                                </h4>
                                                                                <Table>
                                                                                    <TableHeader>
                                                                                        <TableRow>
                                                                                            <TableHead className="w-1/4">
                                                                                                Name
                                                                                            </TableHead>
                                                                                            <TableHead className="w-1/4">
                                                                                                USN
                                                                                            </TableHead>
                                                                                        </TableRow>
                                                                                    </TableHeader>
                                                                                    <TableBody>
                                                                                        {Object.values(
                                                                                            participant.groupMembersData
                                                                                        ).flatMap(
                                                                                            (
                                                                                                group
                                                                                            ) =>
                                                                                                group.members.map(
                                                                                                    (
                                                                                                        member,
                                                                                                        idx
                                                                                                    ) => (
                                                                                                        <TableRow
                                                                                                            key={
                                                                                                                idx
                                                                                                            }
                                                                                                        >
                                                                                                            <TableCell>
                                                                                                                {
                                                                                                                    member.name
                                                                                                                }
                                                                                                            </TableCell>
                                                                                                            <TableCell>
                                                                                                                {
                                                                                                                    member.usn
                                                                                                                }
                                                                                                            </TableCell>
                                                                                                        </TableRow>
                                                                                                    )
                                                                                                )
                                                                                        )}
                                                                                    </TableBody>
                                                                                </Table>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                        </React.Fragment>
                                                    )
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="events">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-64" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Skeleton className="h-32 w-full" />
                                        <Skeleton className="h-32 w-full" />
                                        <Skeleton className="h-32 w-full" />
                                    </div>
                                    <Skeleton className="h-64 w-full" />
                                </div>
                            ) : (
                                <EventStats participants={participants} />
                            )}
                        </TabsContent>

                        <TabsContent value="colleges">
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
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
