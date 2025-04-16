import type { Metadata } from "next";
import "./globals.css";
import { GameOfSquids } from "@/lib/font";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Loading from "@/components/loading";

export const metadata: Metadata = {
    title: "AAKAR 2025 | Brains, Guts and Glory",
    description:
        "Experience the spirit of innovation, creativity, and competition at AAKAR 2025 – a premier TechnoCultural fest bringing together students, tech enthusiasts, and innovators for exciting events, workshops, and unforgettable memories.",
    keywords: [
        "AAKAR 2025",
        "TechnoCultural Fest",
        "Engineering Fest",
        "Cultural Fest India",
        "Student Innovation",
        "Workshops",
        "Competitions",
        "Technical Events",
        "Cultural Events",
        "College Fest",
        "Best College Fest in India",
        "AAKAR Events",
        "AAKAR Tech Fest",
        "AAKAR Cultural Night",
        "AAKAR Workshops",
        "AAKAR Competitions",
        "College Fest Karnataka",
        "South India Tech Fest",
        "Student Techno Fest",
        "Youth Cultural Fest",
        "Tech Symposium 2025",
        "Hackathon India",
        "Robotics Competition",
        "Technical Paper Presentation",
        "Dance Battle College",
        "Music Fest for Students",
        "Innovation Challenge",
        "Entrepreneurship Event",
        "Cultural Talent Hunt",
        "Online Gaming Competition",
        "LAN Gaming Fest",
        "Web Development Event",
        "Python Workshop College",
        "AI ML Workshop",
        "Drone Making College Event",
        "App Development Challenge",
        "Battle of Bands India",
        "DJ Night College",
        "Street Play Competition",
        "Fashion Show College Fest",
        "Photography Contest College",
        "Short Film Competition",
        "Youth Festival India",
        "Top College Fests India",
        "AAKAR Registration 2025",
        "Techno Fest Schedule",
        "College Tech Fest Winners",
        "Coding Contest 2025",
        "Innovation Hackathon",
        "Startup Pitch Fest",
        "UI UX Design Contest",
        "Google Developer Fest",
        "Fest for Coders",
        "Fest for Designers",
        "AAKAR Official Website",
        "AAKAR Registration Link",
        "AAKAR Tumkur",
        "AAKAR AIT College",
        "Karnataka College Fest",
        "Top Fests for Engineers",
        "Engineering Student Fest",
        "College Fest Ideas",
        "Fests with Huge Prize Pools",
        "Cultural Events 2025",
        "Best Workshops 2025",
        "Innovative College Fests",
        "Tech + Culture Festival",
        "Youth Empowerment Events",
        "College Drama Contest",
        "Idea Presentation Competition",
        "National Level Fest",
        "All India College Fest",
        "Music Production Workshop",
        "Spoken Word Event",
        "Open Mic Night",
        "Quiz Bowl College",
        "Treasure Hunt College Event",
        "Gaming Night",
        "Live Coding Contest",
        "Animation Workshop Students",
        "Digital Art College Event",
        "Meme Making Contest",
        "Green Innovation Challenge",
        "Science Exhibition College",
        "College Robotics Show",
        "Data Science Bootcamp",
        "Machine Learning Basics",
        "Tech Trivia Quiz",
        "Python Coding Fest",
        "Blockchain Student Workshop",
        "Campus Tech Revolution",
        "Tech Fest India 2025",
        "Trophy Night College",
        "Fest Closing Ceremony",
        "College Event Photos",
        "AAKAR 2025 Aftermovie",
        "Register for AAKAR",
        "Plan your trip AAKAR",
        "Best Events AAKAR",
        "AAKAR 2025 Highlights",
        "AAKAR 2025 official fest",
        "AAKAR Techno-Cultural Fest",
        "AAKAR engineering college fest",
        "AAKAR Tumkur fest",
        "AAKAR AIT College event",
        "AAKAR national level fest",
        "AAKAR best college fest Karnataka",
        "AAKAR fest registration 2025",
        "AAKAR fest dates",
        "AAKAR fest schedule",
        "AAKAR fest highlights",
        "AAKAR fest aftermovie",
        "AAKAR fest winners",
        "AAKAR fest prize money",
        "AAKAR fest sponsors",
        "AAKAR fest guest speakers",
        "AAKAR fest chief guest",
        "AAKAR fest theme",
        "AAKAR fest logo",
        "AAKAR fest Instagram",
        "AAKAR hackathon 2025",
        "AAKAR coding competition",
        "AAKAR robotics challenge",
        "AAKAR drone racing",
        "AAKAR AI/ML workshop",
        "AAKAR Python programming contest",
        "AAKAR web development battle",
        "AAKAR app development challenge",
    ],
    authors: [{ name: "AAKAR Team", url: "https://aakar2025.in" }],
    creator: "AAKAR Team",
    publisher: "AAKAR Fest Committee",
    robots: "index, follow",
    metadataBase: new URL("https://aakar2025.in"),
    openGraph: {
        title: "AAKAR 2025 | Brains, Guts and Glory",
        description:
            "Join us for AAKAR 2025, the ultimate blend of technology and culture. Participate in events, win prizes, and make unforgettable memories!",
        url: "https://aakar2025.in",
        siteName: "AAKAR 2025",
        images: [
            {
                url: "https://aakar2025.in/Aakarlogo.svg",
                width: 1200,
                height: 630,
                alt: "AAKAR 2025 Banner",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "AAKAR 2025 | Brains, Guts and Glory",
        description:
            "Tech meets culture at AAKAR 2025! Explore innovation, creativity, and fun at our annual fest.",
        images: ["https://aakar2025.in/Aakarlogo.svg"],
        creator: "@aakar__2025",
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();
    return (
        <html lang="en">
            <head>
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-EXY2XKHRKM"></script>
            <script>
            {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-EXY2XKHRKM');`}
            </script>
            </head>
            <body className={`${GameOfSquids.className} antialiased`}>
                <Loading />
                <SessionProvider session={session}>{children}</SessionProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
