import { getEventById } from "@/backend/events";
import Eventdescription from "@/components/(User)/events/desc/eventdescription";
import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const eventData = await getEventById(id);

    return (
        <Eventdescription eventData={eventData}/>
    );
};

export default page;
