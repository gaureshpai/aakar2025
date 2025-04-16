"use client";

import React, { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import { HiDownload  } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";

const montserrat = Montserrat({
    weight: "600",
    subsets: ["latin"],
});

const LandingPage = () => {
    const [glowIntensity, setGlowIntensity] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [activeVideo, setActiveVideo] = useState("");

    useEffect(() => {
        const scrollContainer = document.getElementById("videoScrollContainer");
        const dot1 = document.getElementById("scrollDot1");
        const dot2 = document.getElementById("scrollDot2");

        if (scrollContainer && dot1 && dot2) {
            const handleScroll = () => {
                const scrollPosition = scrollContainer.scrollLeft;
                const maxScroll =
                    scrollContainer.scrollWidth - scrollContainer.clientWidth;
                const scrollRatio = scrollPosition / maxScroll;

                // Update dot sizes based on scroll position
                if (scrollRatio < 0.5) {
                    // First video is more visible
                    dot1.classList.remove("w-1", "h-1", "bg-white/30");
                    dot1.classList.add("w-2", "h-2", "bg-white/60");
                    dot2.classList.remove("w-2", "h-2", "bg-white/60");
                    dot2.classList.add("w-1", "h-1", "bg-white/30");
                } else {
                    // Second video is more visible
                    dot2.classList.remove("w-1", "h-1", "bg-white/30");
                    dot2.classList.add("w-2", "h-2", "bg-white/60");
                    dot1.classList.remove("w-2", "h-2", "bg-white/60");
                    dot1.classList.add("w-1", "h-1", "bg-white/30");
                }
            };

            scrollContainer.addEventListener("scroll", handleScroll);
            return () =>
                scrollContainer.removeEventListener("scroll", handleScroll);
        }
    }, []);

    const openModal = (videoSrc: string) => {
        setActiveVideo(videoSrc);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setActiveVideo("");
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setGlowIntensity((prev) => (prev + 0.02) % 1);
        }, 50);

        return () => clearInterval(interval);
    }, []);

    const glowOpacity = 0.3 + 0.2 * Math.sin(glowIntensity * Math.PI * 2);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-red-600 opacity-20 blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-blue-600 opacity-20 blur-3xl"></div>
            </div>

            <div className="hidden md:flex h-full relative z-10">
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex items-center justify-center lg:space-x-4 text-4xl lg:text-8xl font-bold text-center tracking-widest z-10">
                    <span className="text-outline relative">
                        AAKAR
                        <span
                            className="absolute inset-0 text-gray-400 blur-md"
                            style={{ opacity: glowOpacity }}
                        >
                            AAKAR
                        </span>
                    </span>
                    <span className="text-outline relative">
                        2025
                        <span
                            className="absolute inset-0 text-blue-400 blur-md"
                            style={{ opacity: glowOpacity }}
                        >
                            2025
                        </span>
                    </span>
                </div>

                <div className="w-1/4 flex items-center justify-center">
                    <div className="relative right-[-20vw] top-[-50px] z-30 overflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="AAKAR Logo"
                            width={300}
                            height={150}
                            className="mx-auto h-auto"
                        />
                    </div>
                </div>

                <div className="w-2/4 flex flex-col h-full items-center justify-center relative overflow-hidden">
                    <div className="h-[90vh] flex items-center justify-center">
                        <div
                            className="h-5/6 w-auto bg-contain bg-no-repeat bg-center z-20"
                            style={{
                                backgroundImage: "url('/character.png')",
                                minWidth: "250px",
                            }}
                        ></div>
                        <div
                            className={`absolute bottom-36 z-20 ${montserrat.className} cursor-pointer`}
                        >
                            <Link
                                href="/Aakar_2025_brochure.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center px-6 py-3 text-white bg-transparent hover:bg-transparent cursor-pointer transition duration-300 group"
                            >
                                <div className="mr-3 w-10 h-10 flex items-center justify-center border-2 border-white rounded-full transition-all duration-300">
                                    <HiDownload  className="text-lg" />
                                </div>
                                <span className="text-white bg-transparent font-semibold transition-colors duration-300 group-hover:text-white/80">
                                    Download Brochure
                                </span>
                            </Link>
                        </div>
                    </div>
                    <div className="flex justify-center h-[10vh] mt-4 animate-blink text-red-400">
                        <FiChevronDown className="text-6xl" />
                    </div>
                </div>

                <div className="w-1/4 flex items-center justify-start relative">
                    <div className="relative rounded-l-[3rem] w-full">
                        <div className="absolute inset-0 bg-black/50 rounded-l-[3rem] z-0 pointer-events-none"></div>

                        <div
                            className="relative z-10 flex flex-row space-x-4 py-14 px-8 overflow-x-auto scrollbar-hide w-full"
                            style={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                            }}
                            id="videoScrollContainer"
                        >
                            <div
                                className="min-w-[280px] w-[18vw] h-auto rounded-3xl overflow-hidden shadow-lg shadow-blue-500/30 relative flex-shrink-0"
                                onClick={() => openModal("/dj.mp4")}
                            >
                                <video
                                    className="w-full h-full object-cover cursor-pointer"
                                    src="/dj.mp4"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    preload="none"
                                    poster="/dj.png"
                                />

                                <div className="absolute bottom-3 right-3 z-10 cursor-pointer">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 transition">
                                        <FaPlay className="text-sm" />
                                    </div>
                                </div>

                                <div className="absolute inset-0 rounded-3xl border border-blue-400/30 pointer-events-none"></div>
                            </div>

                            <div
                                className="min-w-[280px] w-[18vw] h-auto rounded-3xl overflow-hidden shadow-lg shadow-blue-500/30 relative flex-shrink-0"
                                onClick={() => openModal("/concert.mp4")}
                            >
                                <video
                                    className="w-full h-full object-cover cursor-pointer"
                                    src="/concert.mp4"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    preload="none"
                                    poster="/Concert.png"
                                />

                                <div className="absolute bottom-3 right-3 z-10 cursor-pointer">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 transition">
                                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 md:border-l-8 border-l-black border-b-4 border-b-transparent ml-1"></div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 rounded-3xl border border-blue-400/30 pointer-events-none"></div>
                            </div>
                        </div>

                        {/* Horizontal scroll hint */}
                        <div className="absolute bottom-4 left-1/2 flex items-center gap-3">
                            <div
                                className="w-2 h-2 bg-white/60 rounded-full transition-all duration-300"
                                id="scrollDot1"
                            ></div>
                            <div
                                className="w-1 h-1 bg-white/30 rounded-full transition-all duration-300"
                                id="scrollDot2"
                            ></div>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
                        <div className="bg-black rounded-2xl overflow-hidden max-w-3xl w-full">
                            <video
                                src={activeVideo}
                                controls
                                autoPlay
                                className="w-full h-auto"
                                preload="none"
                            />
                            <div className="text-right p-2">
                                <Button
                                    onClick={closeModal}
                                    className="text-white text-sm cursor-pointer hover:text-red-400"
                                >
                                    Close ✖
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex md:hidden flex-col h-full items-center justify-between py-12">
                <div className="flex flex-col h-[90vh] items-center justify-center space-y-16">
                    <div className="text-white text-6xl font-bold tracking-wider relative top-[30px] text-centeroverflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="AAKAR Logo"
                            width={200}
                            height={100}
                            className="mx-auto h-auto"
                        />
                    </div>

                    <div className="h-full flex items-center justify-center mt relative">
                        <div
                            className="h-5/6 w-auto bg-contain bg-no-repeat bg-center"
                            style={{
                                backgroundImage: "url('/character.png')",
                                minWidth: "250px",
                            }}
                        ></div>
                        <div
                            className={`mt-8 absolute bottom-10 ${montserrat.className}`}
                        >
                            <Link
                                href="/Aakar_2025_brochure.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center bg-transparent hover:bg-transparent cursor-pointer rounded-full px-4 py-2 text-white hover:text-black transition duration-300"
                            >
                                <div className="mr-3 w-10 h-10 flex items-center justify-center border-2 border-white rounded-full transition-all duration-300">
                                    <HiDownload  className="text-sm" />
                                </div>
                                <span className="text-white text-sm font-semibold transition-colors duration-300 group-hover:text-white/80">
                                    Download Brochure
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center h-[10vh] mt-4 animate-blink text-red-400">
                    <FiChevronDown className="text-6xl" />
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
