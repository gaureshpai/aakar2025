import { Event, Participant, Prisma } from "@prisma/client";

export interface ExtendedEvent extends Event {
    studentCoordinators: { name: string, phone: string }[]
    facultyCoordinators: { name: string, phone: string }[]
}

export interface ExtendedEventCreateInput extends Prisma.EventCreateInput {
    studentCoordinators?: { name: string, phone: string }[]
    facultyCoordinators?: { name: string, phone: string }[]
}

export interface ExtendedParticipant extends Participant {
    groupMembersData: {
        [groupId: string]: {
            participantCount: number;
            members: { name: string; usn: string; email: string }[];
        };
    } | null
}

export interface ExtendedParticipantCreateInput extends Prisma.ParticipantCreateInput {
    groupMembersData?: {
        [groupId: string]: {
            participantCount: number;
            members: { name: string; usn: string; email: string }[];
        };
    }
}

export type CartEvents = string[];