"use client";

import { useState, useEffect, use } from "react";
import Select from "react-select";
import Link from "next/link";
import { eventType } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
    getAllEvents,
    getEventOptions,
    getEventsOfUser,
} from "@/backend/events";
import {
    getParticipant,
    updateParticipantWithNotify,
} from "@/backend/participant";
import { ExtendedEvent, ExtendedParticipant } from "@/types";
import { uploadFile } from "@/backend/supabase";
import Error from "next/error";
import { Skeleton } from "@/components/ui/skeleton";

interface FormErrors {
    [key: string]: string;
}

export default function AddAdditionalEvents({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const userId = use(params).id;

    const [events, setEvents] = useState<ExtendedEvent[]>([]);
    const [eventOptions, setEventOptions] =
        useState<Awaited<ReturnType<typeof getEventOptions>>>();
    const [userInfo, setUserInfo] = useState<ExtendedParticipant | null>(null);
    const [existingEvents, setExistingEvents] = useState<
        {
            value: string;
            label: string;
            type: eventType;
            id: number;
        }[]
    >([]);
    const [selectedEvents, setSelectedEvents] = useState<
        {
            value: string;
            label: string;
            type: eventType;
            id: number;
        }[]
    >([]);
    const [groupEventData, setGroupEventData] = useState<
        ExtendedParticipant["groupMembersData"]
    >({});
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [transactionId, setTransactionId] = useState<string>("");
    const [paymentScreenshot, setPaymentScreenshot] = useState<File>();
    const [qrImageUrl, setQrImageUrl] = useState<string>("");
    const [showQRCode, setShowQRCode] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                setEvents(await getAllEvents());

                const { data: userData } = await getParticipant(userId);
                setUserInfo(userData);

                let userEvents = (await getEventsOfUser(userId))?.map(
                    (event) => ({
                        label: event.eventName,
                        value: event.id.toString(),
                        type: event.eventType,
                        id: event.id,
                    })
                );

                if (userEvents) {
                    setExistingEvents(userEvents);
                }

                const eventOpts = await getEventOptions();
                setEventOptions(
                    eventOpts.map((eC) => ({
                        label: eC.label,
                        options: eC.options.filter(
                            (e) => !userEvents?.some((ex) => ex.id === e.id)
                        ),
                    }))
                );
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    async function addUserEvents(
        data: typeof selectedEvents,
        groupData: typeof groupEventData
    ): Promise<void> {
        let fileUrl = await uploadFile(
            paymentScreenshot!,
            "paymentscreenshots"
        );
        if (!fileUrl) return;
        await updateParticipantWithNotify(userId, {
            events: { connect: data.map((e) => ({ id: e.id })) },
            paymentScreenshotUrls: { push: fileUrl },
            transaction_ids: { push: transactionId },
            groupMembersData: groupData
                ? { ...(userInfo!.groupMembersData || {}), ...groupData }
                : userInfo!.groupMembersData || {},
            amount: (userInfo?.amount || 0) + totalAmount,
        });
    }

    const handleEventSelection = (selected: any) => {
        const selectedOptions: typeof selectedEvents = selected || [];
        setSelectedEvents([...selectedOptions]);
        setShowQRCode(false);
        setQrImageUrl("");

        const amount = selectedOptions.reduce(
            (sum: number, event) =>
                sum + (events.find((e) => e.id === event.id)?.fee || 0),
            0
        );
        setTotalAmount(amount);

        selectedOptions.forEach((event) => {
            if (event.type === "Team" && !groupEventData?.[event.id]) {
                setGroupEventData((prev) => ({
                    ...prev,
                    [event.id]: {
                        participantCount: 1,
                        members: [{ name: "", usn: "", email: "" }],
                    },
                }));
            }
        });
    };

    const generateQRCode = () => {
        const amount =
            selectedEvents.length > 0
                ? events
                      .filter((event) =>
                          selectedEvents.find((e) => e.id === event.id)
                      )
                      .reduce((sum, event) => sum + (event.fee || 0), 0)
                : 0;

        setTotalAmount(amount);

        const upiId = "8861621934@upi";
        const payeeName = "Aakar 2025 Registration";
        const transactionNote = "Aakar 2025 Registration";

        const upiUrl = `upi://pay?pa=${encodeURIComponent(
            upiId
        )}&pn=${encodeURIComponent(
            payeeName
        )}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

        setQrImageUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                upiUrl
            )}`
        );
        setShowQRCode(true);
    };

    const handleParticipantCountChange = (eventId: number, count: number) => {
        const currentData = groupEventData?.[eventId] || {
            participantCount: 1,
            members: [{ name: "", usn: "", email: "" }],
        };

        count = Math.max(1, Math.min(10, count));

        let members = [...currentData.members];
        if (count > members.length) {
            for (let i = members.length; i < count; i++) {
                members.push({ name: "", usn: "", email: "" });
            }
        } else if (count < members.length) {
            members = members.slice(0, count);
        }

        setGroupEventData((prev) => ({
            ...prev,
            [eventId]: {
                participantCount: count,
                members,
            },
        }));
    };

    const handleGroupMemberChange = (
        eventId: number,
        index: number,
        field: "name" | "usn" | "email",
        value: string
    ) => {
        const currentData = groupEventData?.[eventId];
        if (!currentData) return;

        const updatedMembers = [...currentData.members];
        updatedMembers[index] = {
            ...updatedMembers[index],
            [field]: value,
        };

        setGroupEventData((prev) => ({
            ...prev,
            [eventId]: {
                ...prev?.[eventId],
                members: updatedMembers,
            },
        }));
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (selectedEvents.length === 0) {
            errors.events = "Please select at least one event";
        }

        selectedEvents.forEach((event) => {
            if (event.type === "Team") {
                const teamData = groupEventData?.[event.id];

                if (teamData) {
                    teamData.members.forEach((member, index) => {
                        if (!member.name || member.name.trim() === "") {
                            errors[`group_${event.id}_member_${index}_name`] =
                                "Name is required";
                        }

                        if (!member.usn || member.usn.trim() === "") {
                            errors[`group_${event.id}_member_${index}_usn`] =
                                "USN is required";
                        } else if (!/^[A-Z0-9]+$/i.test(member.usn)) {
                            errors[`group_${event.id}_member_${index}_usn`] =
                                "Enter a valid USN";
                        }

                        if (!member.email || member.email.trim() === "") {
                            errors[`group_${event.id}_member_${index}_email`] =
                                "Email is required";
                        } else if (
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)
                        ) {
                            errors[`group_${event.id}_member_${index}_email`] =
                                "Enter a valid email";
                        }
                    });
                }
            }
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await addUserEvents(selectedEvents, groupEventData);

            setTimeout(() => {
                router.push(`/registration-success`);
            }, 2000);
        } catch (error) {
            console.error("Error submitting form:", error);
            setFormErrors({
                submit: "An error occurred while submitting. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>

                    <div className="space-y-4 border rounded-lg p-6">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Array(6).fill(null).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <Skeleton className="h-10 w-[100px]" />
                            <Skeleton className="h-10 w-[100px]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!userInfo) return <Error statusCode={404} />;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                <div className="border-b pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Add Additional Events
                    </h1>
                    <p className="text-gray-600">
                        {userInfo && `${userInfo.name} (${userInfo.usn})`}
                    </p>
                </div>
                <form onSubmit={handleSubmit}>
                    {existingEvents.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-3">
                                Already Registered Events
                            </h2>
                            <div className="bg-gray-100 p-4 rounded-md">
                                <div className="flex flex-wrap gap-2">
                                    {existingEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="bg-gray-200 px-3 py-1 rounded-full flex items-center"
                                        >
                                            <span>{event.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 mt-4">
                        <h3 className="font-semibold">
                            Additional Event Selection
                        </h3>

                        {selectedEvents.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">
                                    Selected Additional Events:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedEvents.map((selectedEvent) => {
                                        return (
                                            <div
                                                key={selectedEvent.id}
                                                className="bg-pink-100 px-3 py-1 rounded-full flex items-center"
                                            >
                                                <span>
                                                    {selectedEvent.label}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedSelection =
                                                            selectedEvents.filter(
                                                                (event) =>
                                                                    event.id !==
                                                                    selectedEvent.id
                                                            );
                                                        setSelectedEvents(
                                                            updatedSelection
                                                        );

                                                        if (
                                                            groupEventData?.[
                                                                selectedEvent.id
                                                            ]
                                                        ) {
                                                            setGroupEventData(
                                                                (prev) => {
                                                                    const updated =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete updated[
                                                                        selectedEvent
                                                                            .id
                                                                    ];
                                                                    return updated;
                                                                }
                                                            );
                                                        }

                                                        const amount =
                                                            updatedSelection.reduce(
                                                                (sum, event) =>
                                                                    sum +
                                                                    (events.find(
                                                                        (e) =>
                                                                            e.id ===
                                                                            event.id
                                                                    )?.fee ||
                                                                        0),
                                                                0
                                                            );
                                                        setTotalAmount(amount);
                                                    }}
                                                    className="ml-2 text-pink-700 cursor-pointer hover:text-pink-900"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3">
                                    <p className="font-bold">
                                        Additional Total: ₹{totalAmount}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="add-event"
                                className="text-gray-700"
                            >
                                Add Events
                            </label>
                            <Select
                                id="events"
                                instanceId="events-select"
                                options={eventOptions}
                                isMulti
                                value={selectedEvents}
                                onChange={handleEventSelection}
                                placeholder="Select additional event(s)..."
                                className={`${
                                    formErrors.events ? "border-red-500" : ""
                                } w-full`}
                                classNamePrefix="select"
                            />
                            {formErrors.events && (
                                <p className="text-red-500 text-xs mt-1">
                                    {formErrors.events}
                                </p>
                            )}
                        </div>
                    </div>

                    {selectedEvents.length > 0 && (
                        <div className="mt-4">
                            {selectedEvents
                                .filter((event) => event.type === "Team")
                                .map((event) => {
                                    const groupData = groupEventData?.[
                                        event.id
                                    ] || {
                                        participantCount: 1,
                                        members: [
                                            {
                                                name: "",
                                                usn: "",
                                                email: "",
                                            },
                                        ],
                                    };

                                    return (
                                        <div
                                            key={event.id}
                                            className="mb-6 p-4 border rounded-lg bg-gray-50"
                                        >
                                            <h4 className="font-medium mb-3">
                                                {event.label} - Team Details
                                            </h4>

                                            <div className="mb-4">
                                                <label
                                                    htmlFor={`participant-count-${event.id}`}
                                                    className="text-gray-700 text-sm block mb-1"
                                                >
                                                    Number of Team Members
                                                </label>
                                                <input
                                                    type="number"
                                                    id={`participant-count-${event.id}`}
                                                    min="1"
                                                    max="10"
                                                    value={
                                                        groupData.participantCount
                                                    }
                                                    onChange={(e) =>
                                                        handleParticipantCountChange(
                                                            event.id,
                                                            Number.parseInt(
                                                                e.target.value
                                                            ) || 1
                                                        )
                                                    }
                                                    className="border border-gray-300 rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                />
                                            </div>

                                            {groupData.members.map(
                                                (member, index) => (
                                                    <div
                                                        key={index}
                                                        className="mb-4 p-3 border rounded-md bg-white"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <p className="font-medium text-sm">
                                                                Team Member{" "}
                                                                {index + 1}
                                                            </p>
                                                            {index > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updatedMembers =
                                                                            [
                                                                                ...(groupData?.members ||
                                                                                    []),
                                                                            ];
                                                                        updatedMembers.splice(
                                                                            index,
                                                                            1
                                                                        );
                                                                        setGroupEventData(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                [event.id]:
                                                                                    {
                                                                                        ...prev?.[
                                                                                            event
                                                                                                .id
                                                                                        ],
                                                                                        participantCount:
                                                                                            prev![
                                                                                                event
                                                                                                    .id
                                                                                            ]
                                                                                                .participantCount -
                                                                                            1,
                                                                                        members:
                                                                                            updatedMembers,
                                                                                    },
                                                                            })
                                                                        );
                                                                    }}
                                                                    className="text-red-500 cursor-pointer text-sm hover:text-red-700"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="text-xs text-gray-500">
                                                                    Full Name
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        member.name ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleGroupMemberChange(
                                                                            event.id,
                                                                            index,
                                                                            "name",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Member Name"
                                                                    required
                                                                    className={`border ${
                                                                        formErrors[
                                                                            `group_${event.id}_member_${index}_name`
                                                                        ]
                                                                            ? "border-red-500"
                                                                            : "border-gray-300"
                                                                    } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                                                />
                                                                {formErrors[
                                                                    `group_${event.id}_member_${index}_name`
                                                                ] && (
                                                                    <p className="text-red-500 text-xs mt-1">
                                                                        {
                                                                            formErrors[
                                                                                `group_${event.id}_member_${index}_name`
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="text-xs text-gray-500">
                                                                    USN
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        member.usn ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleGroupMemberChange(
                                                                            event.id,
                                                                            index,
                                                                            "usn",
                                                                            e.target.value.toUpperCase()
                                                                        )
                                                                    }
                                                                    placeholder="Member USN"
                                                                    required
                                                                    className={`border ${
                                                                        formErrors[
                                                                            `group_${event.id}_member_${index}_usn`
                                                                        ]
                                                                            ? "border-red-500"
                                                                            : "border-gray-300"
                                                                    } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                                                />
                                                                {formErrors[
                                                                    `group_${event.id}_member_${index}_usn`
                                                                ] && (
                                                                    <p className="text-red-500 text-xs mt-1">
                                                                        {
                                                                            formErrors[
                                                                                `group_${event.id}_member_${index}_usn`
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="text-xs text-gray-500">
                                                                    Email
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        member.email ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleGroupMemberChange(
                                                                            event.id,
                                                                            index,
                                                                            "email",
                                                                            e.target.value.toLowerCase()
                                                                        )
                                                                    }
                                                                    placeholder="Member Email"
                                                                    required
                                                                    className={`border ${
                                                                        formErrors[
                                                                            `group_${event.id}_member_${index}_email`
                                                                        ]
                                                                            ? "border-red-500"
                                                                            : "border-gray-300"
                                                                    } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                                                />
                                                                {formErrors[
                                                                    `group_${event.id}_member_${index}_email`
                                                                ] && (
                                                                    <p className="text-red-500 text-xs mt-1">
                                                                        {
                                                                            formErrors[
                                                                                `group_${event.id}_member_${index}_email`
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    <div className="flex flex-col gap-4 mt-4">
                        <div className="text-center mb-4">
                            <p className="font-bold text-lg">
                                Total Amount: ₹{totalAmount}
                            </p>
                            <p className="text-gray-600">
                                Please scan the QR code to make payment
                            </p>
                        </div>

                        <div className="flex justify-center mb-4">
                            {showQRCode ? (
                                <img
                                    src={qrImageUrl || "/placeholder.svg"}
                                    alt="Payment QR Code"
                                    className="w-64 h-64 border"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-gray-700">
                                        Click the button below to generate
                                        payment QR code
                                    </p>
                                    <button
                                        type="button"
                                        onClick={generateQRCode}
                                        className="bg-pink-800 text-white cursor-pointer py-2 px-4 rounded-full hover:bg-pink-700"
                                    >
                                        Generate QR Code
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-gray-700 font-medium">
                                After payment, please enter your transaction
                                details:
                            </p>

                            <div>
                                <label
                                    htmlFor="transactionId"
                                    className="text-gray-700 text-sm"
                                >
                                    Transaction ID / Reference Number
                                </label>
                                <input
                                    type="text"
                                    id="transactionId"
                                    value={transactionId}
                                    onChange={(e) =>
                                        setTransactionId(e.target.value)
                                    }
                                    placeholder="Enter transaction ID"
                                    className={`border ${
                                        formErrors.transactionId
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500 mt-1`}
                                />
                                {formErrors.transactionId && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {formErrors.transactionId}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="paymentScreenshot"
                                    className="text-gray-700 text-sm"
                                >
                                    Upload Payment Screenshot
                                </label>
                                <input
                                    type="file"
                                    id="paymentScreenshot"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setPaymentScreenshot(e.target.files![0])
                                    }
                                    className={`border ${
                                        formErrors.paymentScreenshot
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500 mt-1`}
                                />
                                {formErrors.paymentScreenshot && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {formErrors.paymentScreenshot}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <Link
                            href={`/users/${userId}/dashboard`}
                            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={
                                isSubmitting || selectedEvents.length === 0
                            }
                            className={`px-5 py-2 bg-pink-600 cursor-pointer text-white rounded-md ${
                                isSubmitting || selectedEvents.length === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-pink-700"
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                "Register"
                            )}
                        </button>
                    </div>
                    {formErrors.submit && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {formErrors.submit}
                        </div>
                    )}
                </form>
            </div>
            <div className="h-80 w-80 bg-transparent absolute bottom-0 left-0 hidden md:block">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/cutie.png')",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                    }}
                ></div>
            </div>
        </div>
    );
}
