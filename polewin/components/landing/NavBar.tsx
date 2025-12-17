"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/chat", label: "Chat Live" },
    { href: "/classements", label: "Classements" },
    { href: "/predictions", label: "Prédictions" },
    { href: "/profil", label: "Profil" },
    { href: "/roadmap", label: "Roadmap" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <nav className="top-0 right-0 left-0 z-50 fixed bg-transparent py-6 transition-all duration-300">
            <div className="flex justify-between items-center mx-auto px-6 container">
                <Link
                    href="/"
                    className="font-bold text-2xl italic tracking-tighter"
                >
                    POLE<span className="text-[#FF2B2B]">WIN</span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="font-medium text-gray-300 hover:text-white text-sm uppercase tracking-wide transition-colors"
                        >
                            {l.label}
                        </Link>
                    ))}

                    <Link
                        href="/#discord"
                        className="bg-[#FF2B2B] hover:bg-[#D91A1A] shadow-[0_0_15px_rgba(255,43,43,0.4)] px-5 py-2 rounded-full font-bold text-white text-sm hover:scale-105 transition-all transform"
                    >
                        Rejoindre le Discord
                    </Link>
                </div>

                <button
                    onClick={() => setOpen((v) => !v)}
                    className="md:hidden text-white"
                    aria-label="Ouvrir le menu"
                >
                    <Menu size={28} />
                </button>
            </div>

            {open && (
                <div className="md:hidden mt-4 px-6">
                    <div className="space-y-2 bg-[#0a0a0a]/90 backdrop-blur p-4 border border-white/10 rounded-2xl">
                        {navLinks.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className="block py-2 font-medium text-gray-300 hover:text-white text-sm uppercase tracking-wide"
                            >
                                {l.label}
                            </Link>
                        ))}
                        <Link
                            href="/#discord"
                            onClick={() => setOpen(false)}
                            className="block bg-[#FF2B2B] hover:bg-[#D91A1A] shadow-[0_0_15px_rgba(255,43,43,0.4)] mt-2 px-5 py-3 rounded-xl font-bold text-white text-sm text-center"
                        >
                            Rejoindre le Discord
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
