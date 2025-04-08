"use server"
import { eventCategory } from "@prisma/client";
import { db } from ".";
import { isAdmin } from "./admin";
import { ExtendedEvent, ExtendedEventCreateInput } from "@/types";

const eventsCache = {
    date: null as Date | null,
    events: [] as ExtendedEvent[],
    categoryEvents: {} as Record<eventCategory, { date: Date, events: ExtendedEvent[] }>,
    eventById: {} as Record<string, { date: Date, event: ExtendedEvent }>
}

function isCacheValid(cacheDate: Date | null) {
    if (!cacheDate) return false;
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    return cacheDate > now;
}

export async function createEvent(event: ExtendedEventCreateInput) {
    try {
        if (!await isAdmin()) throw new Error("Not authorized");
        const newEvent = await db.event.create({
            data: event
        }) as ExtendedEvent | null;

        eventsCache.date = null;
        eventsCache.events = [];
        eventsCache.categoryEvents = {} as any;
        eventsCache.eventById = {};

        return newEvent;
    } catch (e) {
        console.error("Create Event Error:", e);
        return null;
    }
}

export async function getEventById(id: string) {
    try {
        if (eventsCache.eventById[id] && isCacheValid(eventsCache.eventById[id].date)) {
            return eventsCache.eventById[id].event;
        }

        const event = await db.event.findUnique({
            where: { id }
        }) as ExtendedEvent | null;

        if (event) {
            eventsCache.eventById[id] = {
                date: new Date(),
                event
            };
        }

        return event;
    } catch (e) {
        console.error("Get Event By ID Error:", e);
        return null;
    }
}

export async function getAllEvents() {
    try {
        if (isCacheValid(eventsCache.date)) {
            return eventsCache.events;
        }

        const events = await db.event.findMany({
            orderBy: {
                date: "asc"
            }
        }) as ExtendedEvent[];

        eventsCache.date = new Date();
        eventsCache.events = events;
        return events;
    } catch (e) {
        console.error("Get All Events Error:", e);
        return [];
    }
}

export async function getEventsByCategory(eventCategory: eventCategory) {
    try {
        if (eventsCache.categoryEvents[eventCategory] &&
            isCacheValid(eventsCache.categoryEvents[eventCategory].date)) {
            return eventsCache.categoryEvents[eventCategory].events;
        }

        const events = await db.event.findMany({
            where: {
                eventCategory
            },
            orderBy: {
                date: "asc"
            }
        }) as ExtendedEvent[];

        eventsCache.categoryEvents[eventCategory] = {
            date: new Date(),
            events
        };

        return events;
    } catch (e) {
        console.error("Get Category Events Error:", e);
        return [];
    }
}

export async function getEventsOfUser(userId: string) {
    try {
        return (await db.participant.findUnique({
            where: {
                id: userId
            },
            select: {
                events: true
            }
        }))?.events as ExtendedEvent[] | null;
    } catch (e) {
        console.error("Get Events Of User Error:", e);
        return [];
    }
}

export async function getEventsOfAllUsers() {
    try {
        const participants = await db.participant.findMany({
            select: {
                id: true,
                events: true
            }
        })

        let a = {} as Record<string, ExtendedEvent[]>;
        participants.forEach((participant) => {
            a[participant.id] = participant.events as ExtendedEvent[];
        })
        return a;
    } catch (e) {
        console.error("Get Events Of All Users Error:", e);
        return {} as Record<string, ExtendedEvent[]>;
    }
}

export async function getEventOptions() {
    try {
        const events = await getAllEvents();
        const eventCategories = [...new Set(events.map(e => e.eventCategory))];

        const mappedOptions = eventCategories.map((category) => {
            let categoryEvents = events.filter(ev => ev.eventCategory === category);
            let eventOptions = categoryEvents.map((event) => {
                return {
                    value: event.id.toString(),
                    label: event.eventName,
                    type: event.eventType,
                    id: event.id,
                };
            });

            return {
                label: category,
                options: eventOptions
            };
        });

        return mappedOptions;
    } catch (e) {
        console.error("Get Formatted Events Error:", e);
        return [];
    }
}

export async function getEventsTotalFee(eventIds: string[]) {
    try {
        if (isCacheValid(eventsCache.date) && eventsCache.events.length > 0) {
            const cachedEvents = eventsCache.events.filter(event => eventIds.includes(event.id));
            if (cachedEvents.length === eventIds.length) {
                return cachedEvents.reduce((acc, event) => acc + event.fee, 0);
            }
        }

        return await db.event.findMany({
            where: {
                id: {
                    in: eventIds
                }
            },
            select: {
                fee: true
            }
        }).then((events) => {
            return events.reduce((acc, event) => acc + event.fee, 0);
        });
    } catch (e) {
        console.error("Get Events Total Fee Error:", e);
        return 0;
    }
}

export async function getTotalEvents() {
    try {
        return await db.event.count();
    } catch (e) {
        console.error("Get Total Events Error:", e);
        return 0;
    }
}

export async function updateEvent(id: string, data: ExtendedEventCreateInput) {
    try {
        if (!await isAdmin()) throw new Error("Not authorized");
        const updatedEvent = await db.event.update({
            where: { id },
            data
        }) as ExtendedEvent | null;

        eventsCache.date = null;
        eventsCache.events = [];
        eventsCache.categoryEvents = {} as any;
        eventsCache.eventById = {};

        return updatedEvent;
    } catch (e) {
        console.error("Update Event Error:", e);
        return null;
    }
}

export async function deleteEvent(id: string) {
    try {
        if (!await isAdmin()) throw new Error("Not authorized");
        const deletedEvent = await db.event.delete({
            where: { id }
        }) as ExtendedEvent | null;

        eventsCache.date = null;
        eventsCache.events = [];
        eventsCache.categoryEvents = {} as any;
        eventsCache.eventById = {};

        return deletedEvent;
    } catch (e) {
        console.error("Delete Event Error:", e);
        return null;
    }
}