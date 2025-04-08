"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Trash2,
    Pencil,
    AlertCircle,
    Plus,
    Clock,
    MapPin,
    Image,
    Upload,
    X,
} from "lucide-react";
import {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} from "@/backend/events";
import { uploadFile, deleteFiles } from "@/backend/supabase";
import { eventCategory, eventType } from "@prisma/client";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ExtendedEvent } from "@/types";

interface Coordinator {
    name: string;
    phone: string;
}

interface EventTypeOption {
    value: eventType;
    label: string;
}

interface EventCategoryOption {
    value: eventCategory;
    label: string;
}

interface FormData {
    eventName: string;
    eventType: eventType;
    eventCategory: eventCategory;
    description: string;
    fee: number;
    date: Date;
    time: string;
    venue: string;
    studentCoordinators: Coordinator[];
    facultyCoordinators: Coordinator[];
    rules: string[];
    imageUrl: string;
}

const EventsCRUD = () => {
    const [events, setEvents] = useState<ExtendedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [newStudentCoordinator, setNewStudentCoordinator] =
        useState<Coordinator>({
            name: "",
            phone: "",
        });
    const [newFacultyCoordinator, setNewFacultyCoordinator] =
        useState<Coordinator>({
            name: "",
            phone: "",
        });
    const [newRule, setNewRule] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        eventName: "",
        eventType: "Solo",
        eventCategory: "Cultural",
        description: "",
        fee: 0,
        date: new Date("2024-05-09"),
        time: "",
        venue: "",
        studentCoordinators: [],
        facultyCoordinators: [],
        rules: [],
        imageUrl: "",
    });
    const [previewUrl, setPreviewUrl] = useState<string>("");

    const eventTypes: EventTypeOption[] = [
        { value: "Solo", label: "Solo" },
        { value: "Team", label: "Team" },
    ];

    const eventCategorys: EventCategoryOption[] = [
        { value: "Technical", label: "Technical" },
        { value: "Cultural", label: "Cultural" },
        { value: "Gaming", label: "Gaming" },
    ];

    const dateOptions = [
        { value: new Date("2024-05-09"), label: "May 9, 2024" },
        { value: new Date("2024-05-10"), label: "May 10, 2024" },
    ];

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else if (formData.imageUrl) {
            setPreviewUrl(formData.imageUrl);
        } else {
            setPreviewUrl("");
        }
    }, [selectedFile, formData.imageUrl]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await getAllEvents();
            if (data) {
                setEvents(
                    data.map((event) => ({
                        ...event,
                        date: new Date(event.date),
                        studentCoordinators:
                            typeof event.studentCoordinators === "string"
                                ? JSON.parse(event.studentCoordinators)
                                : event.studentCoordinators,
                        facultyCoordinators:
                            typeof event.facultyCoordinators === "string"
                                ? JSON.parse(event.facultyCoordinators)
                                : event.facultyCoordinators,
                    }))
                );
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError("Could not fetch events. Please try again.");
            setLoading(false);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "fee" ? parseInt(value) || "" : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl("");
        if (!isEditing) {
            setFormData((prev) => ({ ...prev, imageUrl: "" }));
        }
    };

    const handleSelectChange = (
        name: keyof FormData,
        value: eventCategory | eventType | Date
    ) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddStudentCoordinator = () => {
        if (newStudentCoordinator.name && newStudentCoordinator.phone) {
            setFormData((prev) => ({
                ...prev,
                studentCoordinators: [
                    ...prev.studentCoordinators,
                    { ...newStudentCoordinator },
                ],
            }));
            setNewStudentCoordinator({ name: "", phone: "" });
        }
    };

    const handleAddFacultyCoordinator = () => {
        if (newFacultyCoordinator.name && newFacultyCoordinator.phone) {
            setFormData((prev) => ({
                ...prev,
                facultyCoordinators: [
                    ...prev.facultyCoordinators,
                    { ...newFacultyCoordinator },
                ],
            }));
            setNewFacultyCoordinator({ name: "", phone: "" });
        }
    };

    const handleRemoveStudentCoordinator = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            studentCoordinators: prev.studentCoordinators.filter(
                (_, i) => i !== index
            ),
        }));
    };

    const handleRemoveFacultyCoordinator = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            facultyCoordinators: prev.facultyCoordinators.filter(
                (_, i) => i !== index
            ),
        }));
    };

    const handleAddRule = () => {
        if (newRule) {
            setFormData((prev) => ({
                ...prev,
                rules: [...prev.rules, newRule],
            }));
            setNewRule("");
        }
    };

    const handleRemoveRule = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            rules: prev.rules.filter((_, i) => i !== index),
        }));
    };

    const resetForm = () => {
        setFormData({
            eventName: "",
            eventType: "Solo",
            eventCategory: "Cultural",
            description: "",
            fee: 0,
            date: new Date("2024-05-09"),
            time: "",
            venue: "",
            studentCoordinators: [],
            facultyCoordinators: [],
            rules: [],
            imageUrl: "",
        });
        setIsEditing(false);
        setCurrentId(null);
        setNewStudentCoordinator({ name: "", phone: "" });
        setNewFacultyCoordinator({ name: "", phone: "" });
        setNewRule("");
        setSelectedFile(null);
        setPreviewUrl("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setUploadProgress(true);

        try {
            let imageUrl = formData.imageUrl;
            if (selectedFile) {
                const uploadedUrl = await uploadFile(selectedFile);
                if (uploadedUrl) {
                    if (isEditing && formData.imageUrl) {
                        await deleteFiles([formData.imageUrl]);
                    }
                    imageUrl = uploadedUrl;
                } else {
                    throw new Error("Failed to upload image");
                }
            }

            const eventData = {
                ...formData,
                imageUrl,
                fee: formData.fee,
                studentCoordinators: formData.studentCoordinators,
                facultyCoordinators: formData.facultyCoordinators,
            };

            if (isEditing && currentId) {
                await updateEvent(currentId, eventData);
            } else {
                await createEvent(eventData);
            }

            fetchEvents();
            resetForm();
            setOpenDialog(false);
        } catch (error) {
            console.error("Error saving event:", error);
            setError("Could not save event. Please try again.");
        } finally {
            setUploadProgress(false);
        }
    };

    const handleEdit = (event: ExtendedEvent) => {
        setFormData({
            eventName: event.eventName,
            eventType: event.eventType,
            eventCategory: event.eventCategory,
            description: event.description,
            fee: event.fee,
            date: new Date(event.date),
            time: event.time,
            venue: event.venue,
            studentCoordinators: event.studentCoordinators || [],
            facultyCoordinators: event.facultyCoordinators || [],
            rules: event.rules || [],
            imageUrl: event.imageUrl,
        });
        setCurrentId(event.id);
        setIsEditing(true);
        setOpenDialog(true);
        if (event.imageUrl) {
            setPreviewUrl(event.imageUrl);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const eventToDelete = events.find((event) => event.id === id);
            await deleteEvent(id);
            if (eventToDelete && eventToDelete.imageUrl) {
                await deleteFiles([eventToDelete.imageUrl]);
            }
            fetchEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
            setError("Could not delete event. Please try again.");
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Events Management
                    </h1>
                    <p className="text-muted-foreground">
                        Create, edit, and manage all events for your
                        organization
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <Card className="shadow-sm">
                    <CardHeader className="border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    All Events
                                </CardTitle>
                                <CardDescription>
                                    {events.length}{" "}
                                    {events.length === 1 ? "event" : "events"}{" "}
                                    found
                                </CardDescription>
                            </div>
                            <Button
                                className="cursor-pointer"
                                onClick={() => {
                                    resetForm();
                                    setOpenDialog(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Event
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="space-y-4 p-6">
                                <Skeleton className="h-10 w-full" />
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton
                                            key={i}
                                            className="h-12 w-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Image className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">
                                    No events found
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Get started by creating a new event
                                </p>
                                <Button
                                    className="mt-4 cursor-pointer"
                                    onClick={() => {
                                        resetForm();
                                        setOpenDialog(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Event
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[200px]">
                                            Event
                                        </TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Venue</TableHead>
                                        <TableHead>Fee</TableHead>
                                        <TableHead>Poster</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.map((event) => (
                                        <TableRow
                                            key={event.id}
                                            className="hover:bg-muted/10"
                                        >
                                            <TableCell className="font-medium">
                                                {event.eventName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {event.eventType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {event.eventCategory}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>
                                                        {event.date.toDateString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center mt-1">
                                                        <Clock className="h-3 w-3 mr-1" />{" "}
                                                        {event.time}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                                                    {event.venue}
                                                </div>
                                            </TableCell>
                                            <TableCell>₹{event.fee}</TableCell>
                                            <TableCell>
                                                {event.imageUrl ? (
                                                    <div className="w-16 h-16 relative rounded-md overflow-hidden border">
                                                        <img
                                                            src={event.imageUrl}
                                                            alt={
                                                                event.eventName
                                                            }
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                                        <Image className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="flex justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    className="cursor-pointer"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleEdit(event)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            className="cursor-pointer"
                                                            variant="destructive"
                                                            size="sm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Are you sure?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action
                                                                cannot be
                                                                undone. This
                                                                will permanently
                                                                delete the event
                                                                and all its
                                                                data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        event.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {isEditing ? "Edit Event" : "Create New Event"}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? "Update the event details below."
                                    : "Fill in the details for your new event."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="eventName">
                                        Event Name
                                    </Label>
                                    <Input
                                        id="eventName"
                                        name="eventName"
                                        value={formData.eventName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="eventType">
                                            Event Type
                                        </Label>
                                        <Select
                                            value={formData.eventType}
                                            onValueChange={(value: eventType) =>
                                                handleSelectChange(
                                                    "eventType",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select event type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eventTypes.map((type) => (
                                                    <SelectItem
                                                        key={type.value}
                                                        value={type.value}
                                                    >
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="eventCategory">
                                            Event Category
                                        </Label>
                                        <Select
                                            value={formData.eventCategory}
                                            onValueChange={(
                                                value: eventCategory
                                            ) =>
                                                handleSelectChange(
                                                    "eventCategory",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select event type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eventCategorys.map((type) => (
                                                    <SelectItem
                                                        key={type.value}
                                                        value={type.value}
                                                    >
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fee">Fee (₹)</Label>
                                        <Input
                                            id="fee"
                                            name="fee"
                                            type="number"
                                            min="0"
                                            value={formData.fee}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Select
                                            value={formData.date.toISOString()}
                                            onValueChange={(value) => {
                                                const selectedDate = new Date(
                                                    value
                                                );
                                                handleSelectChange(
                                                    "date",
                                                    selectedDate
                                                );
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select date" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dateOptions.map(
                                                    (date, index) => (
                                                        <SelectItem
                                                            key={index}
                                                            value={date.value.toISOString()}
                                                        >
                                                            {date.label}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="time">Time</Label>
                                        <Input
                                            id="time"
                                            name="time"
                                            value={formData.time}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 10:00 AM - 2:00 PM"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="venue">Venue</Label>
                                    <Input
                                        id="venue"
                                        name="venue"
                                        value={formData.venue}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Main Auditorium"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Event Poster</Label>
                                    {previewUrl ? (
                                        <div className="relative">
                                            <div className="border rounded-md overflow-hidden max-w-xs">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-auto object-contain"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 cursor-pointer right-2"
                                                onClick={handleRemoveFile}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-full">
                                            <label
                                                htmlFor="imageUpload"
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground">
                                                        <span className="font-semibold">
                                                            Click to upload
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        PNG, JPG or WebP
                                                        (Recommended: 800x600)
                                                    </p>
                                                </div>
                                                <input
                                                    id="imageUpload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Student Coordinators</Label>
                                    <div className="space-y-3">
                                        {formData.studentCoordinators.length >
                                            0 && (
                                            <div className="space-y-2">
                                                {formData.studentCoordinators.map(
                                                    (coordinator, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <div className="flex-1 rounded-md border p-3 text-sm">
                                                                <span className="font-medium">
                                                                    {
                                                                        coordinator.name
                                                                    }
                                                                </span>
                                                                <span className="text-muted-foreground ml-2">
                                                                    (
                                                                    {
                                                                        coordinator.phone
                                                                    }
                                                                    )
                                                                </span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                className="cursor-pointer"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveStudentCoordinator(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Name"
                                                value={
                                                    newStudentCoordinator.name
                                                }
                                                onChange={(e) =>
                                                    setNewStudentCoordinator({
                                                        ...newStudentCoordinator,
                                                        name: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                placeholder="Phone"
                                                value={
                                                    newStudentCoordinator.phone
                                                }
                                                onChange={(e) =>
                                                    setNewStudentCoordinator({
                                                        ...newStudentCoordinator,
                                                        phone: e.target.value,
                                                    })
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="cursor-pointer"
                                                onClick={
                                                    handleAddStudentCoordinator
                                                }
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Faculty Coordinators</Label>
                                    <div className="space-y-3">
                                        {formData.facultyCoordinators.length >
                                            0 && (
                                            <div className="space-y-2">
                                                {formData.facultyCoordinators.map(
                                                    (coordinator, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <div className="flex-1 rounded-md border p-3 text-sm">
                                                                <span className="font-medium">
                                                                    {
                                                                        coordinator.name
                                                                    }
                                                                </span>
                                                                <span className="text-muted-foreground ml-2">
                                                                    (
                                                                    {
                                                                        coordinator.phone
                                                                    }
                                                                    )
                                                                </span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                className="cursor-pointer"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveFacultyCoordinator(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Name"
                                                value={
                                                    newFacultyCoordinator.name
                                                }
                                                onChange={(e) =>
                                                    setNewFacultyCoordinator({
                                                        ...newFacultyCoordinator,
                                                        name: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                placeholder="Phone"
                                                value={
                                                    newFacultyCoordinator.phone
                                                }
                                                onChange={(e) =>
                                                    setNewFacultyCoordinator({
                                                        ...newFacultyCoordinator,
                                                        phone: e.target.value,
                                                    })
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="cursor-pointer"
                                                onClick={
                                                    handleAddFacultyCoordinator
                                                }
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Event Rules</Label>
                                    <div className="space-y-3">
                                        {formData.rules.length > 0 && (
                                            <div className="space-y-2">
                                                {formData.rules.map(
                                                    (rule, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <div className="flex-1 rounded-md border p-3 text-sm">
                                                                {rule}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                className="cursor-pointer"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveRule(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add a rule"
                                                value={newRule}
                                                onChange={(e) =>
                                                    setNewRule(e.target.value)
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="cursor-pointer"
                                                onClick={handleAddRule}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => {
                                        resetForm();
                                        setOpenDialog(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="cursor-pointer"
                                    disabled={uploadProgress}
                                >
                                    {uploadProgress ? (
                                        <>
                                            <span className="mr-2">
                                                Saving...
                                            </span>
                                        </>
                                    ) : isEditing ? (
                                        "Update Event"
                                    ) : (
                                        "Create Event"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default EventsCRUD;
