"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
    registerParticipant,
    validateParticipantData,
} from "@/backend/participant";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { getAllEvents, getEventOptions } from "@/backend/events";
import {
    CartEvents,
    ExtendedEvent,
    ExtendedParticipantCreateInput,
} from "@/types";
import { eventType } from "@prisma/client";
import { uploadFile } from "@/backend/supabase";

const Register = () => {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState<{
        [key: string]: string | undefined;
    }>({});
    const [generalError, setGeneralError] = useState("");
    const [totalAmount, setTotalAmount] = useState(0);
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState("");
    const [paymentStep, setPaymentStep] = useState<
        "details" | "payment" | "verification"
    >("details");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        college: "",
        year: 0,
        department: "",
        usn: "",
        transactionId: "",
        paymentScreenshot: null as File | null,
    });

    const [cartEvents, setCartEvents] = useState<CartEvents>([]);
    const [eventOptions, setEventOptions] = useState<
        Awaited<ReturnType<typeof getEventOptions>>
    >([]);
    const [events, setEvents] = useState<ExtendedEvent[]>([]);
    const [selectedEvents, setSelectedEvents] = useState<
        {
            value: string;
            label: string;
            type: eventType;
            id: string;
        }[]
    >([]);
    const [groupEventData, setGroupEventData] = useState<{
        [groupId: string]: {
            participantCount: number;
            members: { name: string; usn: string; email: string }[];
        };
    }>({});

    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                const eventOptions = await getEventOptions();
                setEventOptions(eventOptions);
                const events = await getAllEvents();
                setEvents(events);
                const cartData = localStorage.getItem("eventCart");
                if (cartData) {
                    const cartEvents = JSON.parse(cartData) as CartEvents;
                    setCartEvents(cartEvents);
                } else {
                    setCartEvents([]);
                }
                cartEvents.forEach((eventId) => {
                    let eventObj = events.find((e) => e.id === eventId);
                    if (!eventObj) return;
                    setSelectedEvents((prev) => {
                        if (prev.find((e) => e.id === eventId)) return prev;
                        return [
                            ...prev,
                            {
                                value: eventId.toString(),
                                label: eventObj.eventName,
                                type: eventObj.eventType,
                                id: eventObj.id,
                            },
                        ];
                    });
                });
            } catch (error) {
                console.error("Error fetching cart data:", error);
                setCartEvents([]);
            }
            setIsLoading(false);
        })();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: id === "year" ? parseInt(value) : value,
        }));

        if (formErrors[id]) {
            setFormErrors((prev) => ({
                ...prev,
                [id]: undefined,
            }));
        }
    };

    const handleEventSelection = (selectedOptions: any) => {
        setSelectedEvents(selectedOptions);

        const selectedEventIds = selectedOptions.map(
            (option: any) => option.id
        );

        const newGroupData = { ...groupEventData };

        selectedEvents.forEach((event) => {
            const eventObj = events.find((e) => e.id === event.id);

            if (
                eventObj &&
                eventObj.eventType === "Team" &&
                !newGroupData[event.id]
            ) {
                newGroupData[event.id] = {
                    participantCount: 1,
                    members: [{ name: "", usn: "", email: "" }],
                };
            }
        });

        Object.keys(newGroupData).forEach((groupId) => {
            if (!selectedEventIds.includes(Number(groupId))) {
                delete newGroupData[groupId];
            }
        });

        setGroupEventData(newGroupData);
        console.log(selectedEvents);

        const amount = selectedOptions.reduce((sum: number, event: any) => {
            const eventObj = events.find((e) => e.id === event.id);
            return sum + (eventObj?.fee || 0);
        }, 0);

        setTotalAmount(amount);
    };

    const handleParticipantCountChange = (
        groupId: string | number,
        count: number
    ) => {
        const currentMembers = groupEventData[groupId]?.members || [];
        const newCount = Math.max(1, count);

        let newMembers = [...currentMembers];

        if (newCount > currentMembers.length) {
            for (let i = currentMembers.length; i < newCount; i++) {
                newMembers.push({ name: "", usn: "", email: "" });
            }
        } else if (newCount < currentMembers.length) {
            newMembers = newMembers.slice(0, newCount);
        }

        setGroupEventData((prev) => ({
            ...prev,
            [groupId]: {
                participantCount: newCount,
                members: newMembers,
            },
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({
                ...prev,
                paymentScreenshot: e.target.files![0],
            }));
        }
    };

    const handleGroupMemberChange = (
        groupId: number | string,
        index: number,
        field: string,
        value: string
    ) => {
        setGroupEventData((prev) => {
            const updatedMembers = [...(prev[groupId]?.members || [])];
            updatedMembers[index] = {
                ...updatedMembers[index],
                [field]: value,
            };
            return {
                ...prev,
                [groupId]: {
                    ...prev[groupId],
                    members: updatedMembers,
                },
            };
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

        const upiId = "ajiet@cnrb";
        const payeeName = "Aakar 2025 Regitsration";
        const transactionNote = "Aakar 2025 Regitsration";

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

    const proceedToPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const errors = (await validateParticipantData(formData)) || {};

        if (selectedEvents.length === 0) {
            errors.events = "Please select at least one event";
        }

        Object.keys(groupEventData).forEach((groupId) => {
            if (
                selectedEvents.find(
                    (e) => e.value === groupId || e.id === groupId
                )
            ) {
                groupEventData[groupId].members.forEach((member, index) => {
                    if (!member.name) {
                        errors[`group_${groupId}_member_${index}_name`] =
                            "Member name is required";
                    }
                    if (!member.usn) {
                        errors[`group_${groupId}_member_${index}_usn`] =
                            "Member USN is required";
                    }
                    if (!member.email) {
                        errors[`group_${groupId}_member_${index}_email`] =
                            "Member Email is required";
                    }
                });
            }
        });

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setPaymentStep("payment");
        generateQRCode();
    };

    const proceedToVerification = () => {
        if (!formData.transactionId) {
            setFormErrors({ transactionId: "Transaction ID is required" });
            return;
        }

        if (!formData.paymentScreenshot) {
            setFormErrors({
                paymentScreenshot: "Payment screenshot is required",
            });
            return;
        }

        setPaymentStep("verification");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsRegistering(true);
        setFormErrors({});
        setGeneralError("");

        try {
            const fileUrl = await uploadFile(formData.paymentScreenshot!);
            console.log(fileUrl);
            if (!fileUrl) return setGeneralError("File not found!");

            const participantData: ExtendedParticipantCreateInput = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                college: formData.college,
                year: formData.year,
                department: formData.department,
                usn: formData.usn.toUpperCase(),
                transaction_ids: [formData.transactionId],
                paymentScreenshotUrls: [fileUrl],
                groupMembersData: groupEventData,
                amount: totalAmount,
            };

            const { data, error } = await registerParticipant(
                participantData,
                selectedEvents.map((e) => e.id)
            );
            console.log(data, error);

            if (error) {
                setIsRegistering(false);

                if (typeof error === "object") {
                    setFormErrors(error);
                } else {
                    setGeneralError(error);
                }
                return;
            }

            router.push("/registration-success");
            router.refresh();
        } catch (error) {
            setGeneralError(
                "Something went wrong during registration. Please try again."
            );
            console.error("Registration error:", error);
            setIsRegistering(false);
        }
    };

    const colleges: string[] = [
        "A J Institute of Engineering and Technology, Mangalore",
        "Alva's Ayurveda Medical College, Moodbidri",
        "Alva's Homoeopathic Medical College, Moodbidri",
        "Alva's Institute of Engineering Technology, Moodbidri",
        "Alvas College of Nursing, Moodbidri",
        "Aloysius MBA, Mangalore",
        "Canara Engineering College, Mangalore",
        "Carmel Degree College, Modankap, BC Road",
        "College of Fisheries, Mangalore",
        "Dr G Shankar Government Women's First Grade College & PG Study Centre, Ajjarkadu, Udupi",
        "Govt. First Grade College, Kaup",
        "Government Girls Degree College, Brahmagiri, Udupi",
        "Govinda Dasa College, Surathkal",
        "GTTC Baikampady, Mangalore",
        "Karavali Ayurveda and Medical Research, Mangalore",
        "Karavali College of Hotel Management",
        "Karavali College of Nursing Science",
        "Karavali College of Pharmacy, Mangalore",
        "Karavali College of Pharmacy, Vamanjoor, Mangalore",
        "Karavali College of Physiotherapy",
        "Karavali Institute of Technology, Mangalore",
        "Karavali Institute of Technology, Moodbidri",
        "KMC, Manipal",
        "Mahatma Gandhi Memorial (MGM) College, Udupi",
        "MIT Hotel Management",
        "MIT Manipal",
        "MITE - Mangalore Institute of Technology & Engineering",
        "Moodlakatte Institute of Technology, Kundapur",
        "N.M.A.M. Institute of Technology, Nitte, Karkala",
        "NITK, Surathkal",
        "Nitte Institute of Pharmacy",
        "Padua College, Mangaluru",
        "Padu Thirupathi Degree College, Karkala",
        "Poornaprajna College, Udupi",
        "Pompeii College, Aikala",
        "Sahyadri College of Engineering and Management",
        "SDM College of Engineering and Technology (SDMC)",
        "SDM Polytechnic, Ujire",
        "SDPT First Grade College, Kateel",
        "Shirdi Sai Degree College, Karkala",
        "Shri Madhwa Vadiraja Institute of Technology & Management, Bantakal",
        "Sri Bhuvanendra College, Karkala",
        "Sri Devi Institute of Technology, Kenjara, Bajpe",
        "Sri Mahaveera College, Kodangallu, Moodbidri",
        "Sri Taralabalu Jagadguru Institute of Technology",
        "Srinivas Institute of Engineering and Technology, Mukka",
        "Srinivas Institute of Medical Sciences and Research Center, Mukka",
        "St Joseph Engineering College, Vamanjoor, Mangaluru",
        "St. Raymond's Degree College, Vamanjoor, Kudupu, Karnataka",
        "Sumedha Fashion Institute, Karkala",
        "S NM Polytechnic, Moodbidri",
        "Udupi Group of Institutions",
        "Upendra Pai Memorial College (UPMC), Kunjebettu, Udupi",
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4 md:px-8 py-8 md:py-12 relative">
                <div className="flex flex-col bg-white w-200 p-6 rounded shadow-md space-y-4">
                    <Skeleton className="h-6 bg-gray-300 rounded w-1/3 mx-auto"></Skeleton>
                    <Skeleton className="h-4 bg-gray-200 rounded w-2/3 self-end mb-2"></Skeleton>
                    {[...Array(9)].map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col md:flex-row gap-1"
                        >
                            <Skeleton className="bg-gray-200 h-5 w-32 rounded"></Skeleton>
                            <div className="w-full">
                                <Skeleton className="h-10 bg-gray-200 rounded"></Skeleton>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center">
                        <Skeleton className="h-10 w-32 bg-gray-300 rounded-full"></Skeleton>
                    </div>
                </div>
                <div className="h-96 w-64 bg-transparent absolute bottom-0 left-0 hidden md:block">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: "url('/register-ch.png')",
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                        }}
                    ></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4 md:px-8 py-8 md:py-12 relative">
            <div className="flex flex-col bg-white w-200 p-6 rounded shadow-md">
                <h2 className="text-black text-lg font-semibold mb-4 flex justify-center">
                    {paymentStep === "details" && "Register"}
                    {paymentStep === "payment" && "Make Payment"}
                    {paymentStep === "verification" && "Verify Payment"}
                </h2>

                {generalError && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {generalError}
                    </div>
                )}

                {paymentStep === "details" && (
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={proceedToPayment}
                    >
                        <h3 className="font-semibold">Event Registration</h3>

                        <div className="flex flex-col gap-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="name"
                                        className="text-gray-700"
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                        required
                                        className={`border ${
                                            formErrors.name
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                    />
                                    {formErrors.name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {formErrors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="email"
                                        className="text-gray-700"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                        className={`border ${
                                            formErrors.email
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                    />
                                    {formErrors.email && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {formErrors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="phone"
                                        className="text-gray-700"
                                    >
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Enter your phone number"
                                        required
                                        className={`border ${
                                            formErrors.phone
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                    />
                                    {formErrors.phone && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {formErrors.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="usn"
                                        className="text-gray-700"
                                    >
                                        USN
                                    </label>
                                    <input
                                        type="text"
                                        id="usn"
                                        value={formData.usn}
                                        onChange={handleChange}
                                        placeholder="Enter your USN"
                                        required
                                        className={`border ${
                                            formErrors.usn
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                    />
                                    {formErrors.usn && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {formErrors.usn}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="college"
                                        className="text-gray-700"
                                    >
                                        College Name
                                    </label>
                                    <input
                                        type="text"
                                        id="college"
                                        list="collegeList"
                                        value={formData.college}
                                        onChange={handleChange}
                                        placeholder="Search or enter your college"
                                        required
                                        className={`border ${
                                            formErrors.college
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                    />
                                    {formErrors.college && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {formErrors.college}
                                        </p>
                                    )}
                                    <datalist id="collegeList">
                                        {colleges.map((college) => (
                                            <option
                                                key={college}
                                                value={college}
                                                className="cursor-pointer"
                                            >
                                                {college}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="year"
                                        className="text-gray-700"
                                    >
                                        Year (1,2,3 or 4)
                                    </label>
                                    <input
                                        id="year"
                                        value={formData.year || ""}
                                        min={1}
                                        max={8}
                                        step={1}
                                        placeholder="Enter your year"
                                        onChange={handleChange}
                                        required
                                        className={`border ${
                                            formErrors.year
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                    />
                                    {formErrors.year && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {formErrors.year}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="department"
                                        className="text-gray-700"
                                    >
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        id="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="Enter your department"
                                        required
                                        className={`border ${
                                            formErrors.department
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                    />
                                    {formErrors.department && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {formErrors.department}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-4">
                            <h3 className="font-semibold">Event Selection</h3>

                            {selectedEvents.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">
                                        Selected Events:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEvents.map((selectedEvent) => {
                                            const event = events.find(
                                                (e) => e.id === selectedEvent.id
                                            );
                                            if (!event) return <></>;
                                            return (
                                                <div
                                                    key={event.id}
                                                    className="bg-pink-100 px-3 py-1 rounded-full flex items-center"
                                                >
                                                    <span>
                                                        {event.eventName} - ₹
                                                        {event.fee || 0}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedSelection =
                                                                selectedEvents.filter(
                                                                    (
                                                                        selectedEvent
                                                                    ) =>
                                                                        selectedEvent.id !==
                                                                        event.id
                                                                );
                                                            setSelectedEvents(
                                                                updatedSelection
                                                            );

                                                            if (
                                                                groupEventData[
                                                                    event.id
                                                                ]
                                                            ) {
                                                                setGroupEventData(
                                                                    (prev) => {
                                                                        const updated =
                                                                            {
                                                                                ...prev,
                                                                            };
                                                                        delete updated[
                                                                            event
                                                                                .id
                                                                        ];
                                                                        return updated;
                                                                    }
                                                                );
                                                            }

                                                            const selected =
                                                                events.filter(
                                                                    (event) =>
                                                                        updatedSelection.find(
                                                                            (
                                                                                e
                                                                            ) =>
                                                                                e.id ===
                                                                                event.id
                                                                        )
                                                                );
                                                            const amount =
                                                                selected.reduce(
                                                                    (
                                                                        sum,
                                                                        event
                                                                    ) =>
                                                                        sum +
                                                                        (event.fee ||
                                                                            0),
                                                                    0
                                                                );
                                                            setTotalAmount(
                                                                amount
                                                            );
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
                                            Total: ₹{totalAmount}
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
                                    placeholder="Select event(s)..."
                                    className={`${
                                        formErrors.events
                                            ? "border-red-500"
                                            : ""
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
                                {selectedEvents.map((event) => {
                                    if (event?.type !== "Team") return null;

                                    const groupData = groupEventData[
                                        event.id
                                    ] || {
                                        participantCount: 1,
                                        members: [
                                            { name: "", usn: "", email: "" },
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
                                                                                        ...prev[
                                                                                            event
                                                                                                .id
                                                                                        ],
                                                                                        participantCount:
                                                                                            prev[
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

                        <div className="flex justify-center mt-6">
                            <button
                                type="submit"
                                className="bg-pink-800 text-white py-2 px-6 rounded-full hover:bg-pink-700 cursor-pointer disabled:opacity-70"
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex flex-col gap-4">
                    <div className="text-center mb-4">
                        {paymentStep === "payment" ? (
                            <div className="flex flex-col gap-4">
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
                                            src={
                                                qrImageUrl || "/placeholder.svg"
                                            }
                                            alt="Payment QR Code"
                                            className="w-64 h-64 border"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <p className="text-gray-700">
                                                Click the button below to
                                                generate payment QR code
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
                                        After payment, please enter your
                                        transaction details:
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
                                            value={formData.transactionId}
                                            onChange={handleChange}
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
                                            onChange={handleFileUpload}
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

                                <div className="flex flex-row justify-center gap-4 mt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentStep("details")
                                        }
                                        className="bg-gray-300 cursor-pointer text-gray-700 py-2 px-4 rounded-full hover:bg-gray-400"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={proceedToVerification}
                                        className="bg-pink-800 cursor-pointer text-white py-2 px-4 rounded-full hover:bg-pink-700"
                                    >
                                        Verify Payment
                                    </button>
                                </div>
                            </div>
                        ) : (
                            paymentStep === "verification" && (
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="text-center mb-4">
                                        <p className="font-medium">
                                            Please review your details before
                                            submitting
                                        </p>
                                    </div>

                                    <div className="border rounded p-4 mb-4">
                                        <h3 className="font-semibold mb-2">
                                            Personal Information
                                        </h3>
                                        <ul className="text-sm space-y-1">
                                            <li>
                                                <span className="font-medium">
                                                    Name:
                                                </span>{" "}
                                                {formData.name}
                                            </li>
                                            <li>
                                                <span className="font-medium">
                                                    Email:
                                                </span>{" "}
                                                {formData.email}
                                            </li>
                                            <li>
                                                <span className="font-medium">
                                                    Phone:
                                                </span>{" "}
                                                {formData.phone}
                                            </li>
                                            <li>
                                                <span className="font-medium">
                                                    College:
                                                </span>{" "}
                                                {formData.college}
                                            </li>
                                            <li>
                                                <span className="font-medium">
                                                    USN:
                                                </span>{" "}
                                                {formData.usn}
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="border rounded p-4 mb-4">
                                        <h3 className="font-semibold mb-2">
                                            Selected Events
                                        </h3>
                                        <ul className="text-sm space-y-1">
                                            {selectedEvents.map(
                                                (selectedEvent) => {
                                                    const event = events.find(
                                                        (e) =>
                                                            e.id ===
                                                            selectedEvent.id
                                                    );
                                                    return event ? (
                                                        <li key={event.id}>
                                                            <span className="font-medium">
                                                                {
                                                                    event.eventName
                                                                }
                                                            </span>{" "}
                                                            - ₹{event.fee || 0}
                                                            {event.eventType ===
                                                                "Team" &&
                                                                groupEventData[
                                                                    event.id
                                                                ] && (
                                                                    <ul className="ml-4 mt-1 text-xs text-gray-600">
                                                                        {groupEventData[
                                                                            event
                                                                                .id
                                                                        ].members.map(
                                                                            (
                                                                                member,
                                                                                idx
                                                                            ) => (
                                                                                <li
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                >
                                                                                    Member{" "}
                                                                                    {idx +
                                                                                        1}

                                                                                    :{" "}
                                                                                    {
                                                                                        member.name
                                                                                    }{" "}
                                                                                    (
                                                                                    {
                                                                                        member.usn
                                                                                    }{" "}
                                                                                    -{" "}
                                                                                    {
                                                                                        member.email
                                                                                    }

                                                                                    )
                                                                                </li>
                                                                            )
                                                                        )}
                                                                    </ul>
                                                                )}
                                                        </li>
                                                    ) : null;
                                                }
                                            )}
                                        </ul>
                                        <p className="font-bold mt-2">
                                            Total: ₹{totalAmount}
                                        </p>
                                    </div>

                                    <div className="border rounded p-4 mb-4">
                                        <h3 className="font-semibold mb-2">
                                            Payment Information
                                        </h3>
                                        <ul className="text-sm space-y-1">
                                            <li>
                                                <span className="font-medium">
                                                    Transaction ID:
                                                </span>{" "}
                                                {formData.transactionId}
                                            </li>
                                            <li>
                                                <span className="font-medium">
                                                    Payment Screenshot:
                                                </span>{" "}
                                                {formData.paymentScreenshot
                                                    ?.name ||
                                                    "No file selected"}
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex flex-row justify-center gap-4 mt-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPaymentStep("payment")
                                            }
                                            className="bg-gray-300 text-gray-700 cursor-pointer py-2 px-4 rounded-full hover:bg-gray-400"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isRegistering}
                                            className="bg-pink-800 text-white cursor-pointer py-2 px-4 rounded-full hover:bg-pink-700 disabled:opacity-70 flex items-center gap-2"
                                        >
                                            {isRegistering ? (
                                                <>
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
                                                    Registering...
                                                </>
                                            ) : (
                                                "Complete Registration"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )
                        )}
                    </div>
                    <div className="h-96 w-64 bg-transparent absolute bottom-0 left-0 hidden md:block">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: "url('/register-ch.png')",
                                backgroundSize: "contain",
                                backgroundRepeat: "no-repeat",
                            }}
                        ></div>
                    </div>
                </div>
            </div>
            <div className="h-96 w-64 bg-transparent absolute bottom-0 left-0 hidden md:block">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/register-ch.png')",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                    }}
                ></div>
            </div>
        </div>
    );
};

export default Register;
