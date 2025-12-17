import Link from "next/link";
// import Navbar from "./Navbar";
import Footer from "./Footer";

import {
    ArrowRight,
    Award,
    CircleCheckBig,
    Flag,
    Gamepad2,
    MessageSquare,
    Plus,
    Trophy,
} from "lucide-react";

import Navbar from "./NavBar";

export default function LandingPage() {
    return (
        <div className="bg-[#050505] selection:bg-[#FF2B2B] min-h-screen font-sans text-white selection:text-white">
            <Navbar />

            <main>
                {/* HERO */}
                <section className="relative flex items-center pt-20 min-h-screen overflow-hidden">
                    <div className="z-0 absolute inset-0">
                        <img
                            src="https://static.lumi.new/1b/1b53b5e79491430bd082cc9da8548062.png"
                            alt="F1 Track Background"
                            className="opacity-40 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-[#050505]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    </div>

                    <div className="z-10 relative items-center gap-12 grid md:grid-cols-2 mx-auto px-6 container">
                        <div>
                            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm mb-6 px-4 py-1.5 border border-white/20 rounded-full">
                                <Flag size={14} className="text-[#FF2B2B]" />
                                <span className="font-bold text-white text-xs uppercase tracking-wider">
                                    L&apos;expérience F1 Ultime
                                </span>
                            </div>

                            <h1 className="mb-6 font-extrabold text-4xl md:text-6xl lg:text-7xl italic leading-tight">
                                L’APP COMMUNAUTAIRE POUR VIVRE CHAQUE{" "}
                                <span className="bg-clip-text bg-gradient-to-r from-[#FF2B2B] to-[#ff6b6b] text-transparent">
                                    GRAND PRIX
                                </span>{" "}
                                EN DIRECT
                            </h1>

                            <p className="mb-8 max-w-xl text-gray-300 text-lg md:text-xl leading-relaxed">
                                Chat en direct, prédictions rapides et
                                mini-fantasy entre fans. PoleWin, c’est le
                                paddock virtuel où tu vibres chaque week-end de
                                course.
                            </p>

                            <div className="flex sm:flex-row flex-col gap-4 mb-6">
                                <Link
                                    href="/#discord"
                                    className="flex justify-center items-center gap-2 bg-[#FF2B2B] hover:bg-[#D91A1A] shadow-[0_0_20px_rgba(255,43,43,0.5)] px-8 py-4 rounded-lg font-bold text-white text-lg hover:scale-105 transition-all transform"
                                >
                                    Rejoindre le Discord{" "}
                                    <ArrowRight size={20} />
                                </Link>

                                <Link
                                    href="/#early-access"
                                    className="flex justify-center items-center hover:bg-white/10 px-8 py-4 border border-white/30 hover:border-white rounded-lg font-bold text-white text-lg transition-all"
                                >
                                    S’inscrire en Early Access
                                </Link>
                            </div>

                            <p className="flex items-center gap-2 text-gray-400 text-sm">
                                <span className="bg-green-500 rounded-full w-2 h-2 animate-pulse" />
                                100 % gratuit pendant la phase Early •
                                Communauté francophone et européenne
                            </p>
                        </div>

                        <div className="hidden md:block relative">
                            <div className="z-10 relative rotate-[-5deg] hover:rotate-0 transition-transform duration-500 transform">
                                <img
                                    src="https://static.lumi.new/61/61aeed6a980140daa7eba5675bd2e887.png"
                                    alt="PoleWin App Interface"
                                    className="drop-shadow-[0_20px_50px_rgba(255,43,43,0.2)] mx-auto border-4 border-gray-800 rounded-[2rem] w-full max-w-md"
                                />
                            </div>
                            <div className="top-1/2 left-1/2 -z-10 absolute bg-[#FF2B2B] opacity-10 blur-[100px] rounded-full w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2" />
                        </div>
                    </div>
                </section>

                {/* CONCEPT */}
                <section
                    id="concept"
                    className="relative bg-[#050505] py-24 overflow-hidden"
                >
                    <div className="z-10 relative mx-auto px-6 container">
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="mb-8 font-bold text-3xl md:text-5xl italic">
                                POLEWIN EST NÉ DE LA{" "}
                                <span className="text-[#FF2B2B]">
                                    PASSION POUR LA F1
                                </span>
                            </h2>

                            <div className="space-y-6 mx-auto max-w-3xl text-gray-300 text-lg text-left md:text-center leading-relaxed">
                                <p>
                                    Les applications officielles sont géniales
                                    pour les données et la vidéo, mais il manque
                                    l&apos;essentiel : l&apos;émotion partagée.
                                    Les jeux de fantasy existants sont souvent
                                    trop complexes ou demandent trop de temps.
                                </p>
                                <p>
                                    PoleWin veut être{" "}
                                    <span className="font-bold text-white">
                                        l’endroit où l’on vit les Grands Prix
                                        ensemble
                                    </span>
                                    , en direct, entre fans.
                                </p>
                            </div>

                            <div className="inline-block relative mt-12">
                                <div className="absolute inset-0 bg-[#FF2B2B] opacity-20 blur-xl" />
                                <div className="relative bg-white/5 backdrop-blur-sm p-6 md:p-8 border border-white/10 rounded-xl">
                                    <p className="font-bold text-white text-xl md:text-2xl italic">
                                        “PoleWin = partir en pole position et
                                        viser la win, ensemble.”
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="relative bg-[#0a0a0a] py-24">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="z-10 relative mx-auto px-6 container">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-bold text-3xl md:text-5xl italic">
                                FONCTIONNALITÉS{" "}
                                <span className="text-white/50">CLÉS</span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-gray-400">
                                Tout ce dont tu as besoin pour vivre la course à
                                100%
                            </p>
                        </div>

                        <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-4">
                            <FeatureCard
                                icon={
                                    <MessageSquare className="w-8 h-8 text-[#FF2B2B]" />
                                }
                                title="Chat en direct"
                                text="Des salons live pour chaque séance, réactions instantanées, sondages et hot takes entre fans."
                            />
                            <FeatureCard
                                icon={
                                    <Gamepad2 className="w-8 h-8 text-[#FF2B2B]" />
                                }
                                title="Prédictions & Mini-Fantasy"
                                text="Avant chaque qualif ou GP, fais tes picks en moins d’une minute : scoring clair, classements entre amis."
                            />
                            <FeatureCard
                                icon={
                                    <Trophy className="w-8 h-8 text-[#FF2B2B]" />
                                }
                                title="Profils, XP & Badges"
                                text="Gagne des points, monte en niveau et débloque des badges exclusifs : Early 50/100, Streak, Perfect Pick…"
                            />
                            <FeatureCard
                                icon={
                                    <Award className="w-8 h-8 text-[#FF2B2B]" />
                                }
                                title="Intégration Discord"
                                text="Rejoins le serveur officiel, récupère ton rôle, discute, donne ton avis et suis la roadmap."
                            />
                        </div>
                    </div>
                </section>

                {/* HOW TO JOIN */}
                <section className="bg-[#050505] py-24">
                    <div className="mx-auto px-6 container">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-bold text-3xl md:text-5xl italic">
                                COMMENT REJOINDRE L&apos;AVENTURE ?
                            </h2>
                        </div>

                        <div className="relative gap-8 grid md:grid-cols-3">
                            <div className="hidden md:block top-12 right-[16%] left-[16%] z-0 absolute bg-gradient-to-r from-[#FF2B2B]/0 via-[#FF2B2B]/50 to-[#FF2B2B]/0 h-0.5" />

                            <StepCard
                                n="01"
                                title="Rejoins le Discord"
                                text="Clique sur le bouton, arrive sur le serveur officiel et découvre la communauté."
                            />
                            <StepCard
                                n="02"
                                title="Entre dans le programme Early"
                                text="Obtiens un rôle spécial, accède aux premières features et donne ton avis."
                            />
                            <StepCard
                                n="03"
                                title="Joue les week-ends de course"
                                text="Chat live, prédictions, points et badges à chaque Grand Prix."
                            />
                        </div>
                    </div>
                </section>

                {/* EARLY ACCESS */}
                <section
                    id="early-access"
                    className="relative py-24 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[#FF2B2B] opacity-5" />
                    <div className="top-20 -right-20 absolute bg-[#FF2B2B] opacity-10 blur-[100px] rounded-full w-96 h-96" />

                    <div className="z-10 relative mx-auto px-6 container">
                        <div className="relative bg-[#111] p-8 md:p-16 border border-white/10 rounded-3xl overflow-hidden">
                            <div className="top-0 left-0 absolute bg-gradient-to-r from-[#FF2B2B] via-red-500 to-[#FF2B2B] w-full h-2" />

                            <div className="items-center gap-12 grid md:grid-cols-2">
                                <div>
                                    <div className="inline-block bg-[#FF2B2B]/20 mb-6 px-4 py-1 rounded-full font-bold text-[#FF2B2B] text-sm uppercase tracking-wider">
                                        Places Limitées
                                    </div>

                                    <h2 className="mb-6 font-bold text-3xl md:text-5xl italic">
                                        PROGRAMME EARLY : <br />
                                        PRENDS LE DÉPART AVEC NOUS
                                    </h2>

                                    <p className="mb-8 text-gray-300 text-xl">
                                        Les premiers inscrits façonnent
                                        l’application. Rejoins-nous maintenant
                                        pour avoir un impact réel.
                                    </p>

                                    <div className="space-y-4 mb-10">
                                        <Bullet text="Accès anticipé au MVP (chat + prédictions + profils)" />
                                        <Bullet text="Rôles spéciaux sur Discord (Early 50, Early 100…)" />
                                        <Bullet text="Votes sur les futures fonctionnalités et la roadmap" />
                                        <Bullet text="Badges collectors non disponibles plus tard" />
                                    </div>

                                    <Link
                                        href="/#discord"
                                        className="flex justify-center items-center gap-2 bg-white hover:bg-gray-200 px-8 py-4 rounded-lg w-full md:w-auto font-bold text-black text-lg transition-colors"
                                    >
                                        Je veux faire partie des Early{" "}
                                        <ArrowRight size={20} />
                                    </Link>
                                </div>

                                <div className="relative">
                                    <div className="group relative flex flex-col justify-center items-center bg-gradient-to-br from-[#222] to-[#050505] p-8 border border-white/5 rounded-2xl aspect-square overflow-hidden text-center">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                                        <div className="top-1/2 left-1/2 absolute bg-[#FF2B2B] opacity-20 group-hover:opacity-40 blur-[60px] rounded-full w-32 h-32 transition-opacity -translate-x-1/2 -translate-y-1/2" />
                                        <h3 className="z-10 relative bg-clip-text bg-gradient-to-b from-white to-gray-600 mb-2 font-black text-transparent text-6xl italic">
                                            EARLY
                                        </h3>
                                        <div className="z-10 relative font-bold text-[#FF2B2B] text-4xl tracking-[0.5em]">
                                            ACCESS
                                        </div>
                                        <div className="z-10 relative mt-8 px-6 py-2 border border-[#FF2B2B] rounded font-mono text-[#FF2B2B] text-sm">
                                            STATUS: OPEN
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ROADMAP */}
                <section id="roadmap" className="bg-[#0a0a0a] py-24">
                    <div className="mx-auto px-6 container">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-bold text-3xl md:text-5xl italic">
                                DEVLOG & ROADMAP
                            </h2>
                            <p className="text-gray-400">
                                La route est longue, mais la course sera belle.
                            </p>
                        </div>

                        <div className="gap-8 grid md:grid-cols-3">
                            <div className="bg-[#111] shadow-[0_0_20px_rgba(255,43,43,0.1)] p-8 border border-[#FF2B2B] rounded-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-2xl italic">
                                        MVP
                                    </h3>
                                    <span className="bg-[#FF2B2B]/20 px-2 py-1 rounded font-bold text-[#FF2B2B] text-xs uppercase">
                                        En cours
                                    </span>
                                </div>
                                <ul className="space-y-3">
                                    <RoadDot text="Chat live" />
                                    <RoadDot text="Prédictions rapides" />
                                    <RoadDot text="Profils & badges" />
                                </ul>
                            </div>

                            <div className="bg-[#050505] p-8 border border-white/10 rounded-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-2xl italic">
                                        Prochaines étapes
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    <RoadDot text="Stats avancées" gray />
                                    <RoadDot text="Meilleurs moments" gray />
                                    <RoadDot
                                        text="Amélioration des ligues"
                                        gray
                                    />
                                </ul>
                            </div>

                            <div className="bg-[#050505] p-8 border border-white/10 rounded-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-2xl italic">
                                        Vision long terme
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    <RoadDot text="Replays synchronisés" gray />
                                    <RoadDot text="Tournois saisonniers" gray />
                                    <RoadDot text="Contenu communauté" gray />
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 bg-[#111] mx-auto mt-16 p-6 border border-white/10 rounded-xl max-w-2xl">
                            <div className="flex justify-center items-center bg-[#FF2B2B] rounded-full w-10 h-10 font-bold shrink-0">
                                P
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-white">
                                        PoleWin Dev
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        @polewin_dev
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    <span className="font-bold text-[#FF2B2B]">
                                        v0.1 UPDATE:
                                    </span>{" "}
                                    Lancement du chat live et des salons GP.
                                    Merci aux Early 50 pour les retours ! On
                                    bosse sur le fix des notifs pour la Q3. 🏎️💨
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* COMMUNITY */}
                <section
                    id="community"
                    className="relative bg-[#050505] py-24 overflow-hidden"
                >
                    <div className="z-10 relative mx-auto px-6 container">
                        <div className="items-center gap-12 grid md:grid-cols-2">
                            <div>
                                <h2 className="mb-6 font-bold text-3xl md:text-5xl italic">
                                    UNE COMMUNAUTÉ F1, <br />
                                    <span className="text-[#FF2B2B]">
                                        PAS JUSTE UNE APP
                                    </span>
                                </h2>

                                <p className="mb-8 text-gray-300 text-lg leading-relaxed">
                                    PoleWin, c’est un serveur Discord actif, des
                                    rôles spéciaux, des sondages, des
                                    discussions à chaud et des suggestions
                                    prises en compte dans le développement.
                                </p>

                                <div className="flex flex-wrap gap-3 mb-8">
                                    {[
                                        "#annonces",
                                        "#général",
                                        "#suggestions",
                                        "#sneak-peeks",
                                        "#gp-weekend",
                                    ].map((t) => (
                                        <span
                                            key={t}
                                            className="bg-white/5 px-3 py-1 border border-white/10 rounded font-mono text-gray-400 text-sm"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                <Link
                                    href="/#discord"
                                    className="inline-block bg-[#5865F2] hover:bg-[#4752C4] shadow-[#5865F2]/20 shadow-lg px-8 py-4 rounded-lg font-bold text-white text-lg transition-colors"
                                >
                                    Rejoindre le Discord maintenant
                                </Link>
                            </div>

                            <div className="relative">
                                <div className="z-10 relative shadow-2xl border border-white/10 rounded-2xl overflow-hidden">
                                    <img
                                        src="https://static.lumi.new/e6/e689840010f790f7abb65187a700f5a3.png"
                                        alt="Community Visualization"
                                        className="w-full h-auto"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                                    <div className="right-0 bottom-0 left-0 absolute p-6">
                                        <div className="flex items-center gap-2 mb-2 text-white/80">
                                            <div className="bg-green-500 rounded-full w-2 h-2 animate-pulse" />
                                            <span className="font-mono text-sm">
                                                142 members online
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LEGAL */}
                <section className="bg-[#0a0a0a] py-16 border-white/5 border-t">
                    <div className="mx-auto px-6 max-w-4xl text-center container">
                        <h2 className="mb-4 font-bold text-2xl">
                            Un projet sérieux, une base légale à clarifier
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            PoleWin est en phase de conception. Avant
                            d’introduire des gains réels ou des récompenses
                            monétisées, nous travaillons à clarifier tous les
                            aspects juridiques : gestion des mineurs,
                            législation FR/UE, et relations avec l’organisme
                            officiel de la F1. Pour l’instant : communauté,
                            prédictions amicales et badges virtuels.
                        </p>
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="bg-[#050505] py-24">
                    <div className="mx-auto px-6 max-w-3xl container">
                        <h2 className="mb-12 font-bold text-3xl md:text-5xl text-center italic">
                            FAQ
                        </h2>

                        <div className="space-y-4">
                            {[
                                "Est-ce déjà disponible ?",
                                "Est-ce payant ?",
                                "Comment rejoindre le programme Early ?",
                                "Est-ce un produit officiel de la F1 ?",
                                "Où donner mes idées de fonctionnalités ?",
                            ].map((q) => (
                                <div
                                    key={q}
                                    className="bg-[#111] border border-white/10 rounded-lg overflow-hidden"
                                >
                                    <button className="flex justify-between items-center hover:bg-white/5 p-6 w-full text-left transition-colors">
                                        <span className="font-bold text-lg">
                                            {q}
                                        </span>
                                        <Plus className="text-gray-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="group bg-[#111] p-8 border border-white/5 hover:border-[#FF2B2B]/50 rounded-2xl transition-all hover:-translate-y-2">
            <div className="flex justify-center items-center bg-white/5 group-hover:bg-[#FF2B2B]/10 mb-6 rounded-xl w-16 h-16 transition-colors">
                {icon}
            </div>
            <h3 className="mb-3 font-bold text-xl">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
        </div>
    );
}

function StepCard({
    n,
    title,
    text,
}: {
    n: string;
    title: string;
    text: string;
}) {
    return (
        <div className="z-10 relative flex flex-col items-center text-center">
            <div className="flex justify-center items-center bg-[#111] shadow-[0_0_20px_rgba(255,43,43,0.2)] mb-6 border-[#FF2B2B] border-2 rounded-full w-24 h-24 font-bold text-3xl italic">
                {n}
            </div>
            <h3 className="mb-3 font-bold text-2xl">{title}</h3>
            <p className="max-w-xs text-gray-400">{text}</p>
        </div>
    );
}

function Bullet({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-3">
            <CircleCheckBig
                className="mt-1 text-[#FF2B2B] shrink-0"
                size={20}
            />
            <span className="text-gray-300">{text}</span>
        </div>
    );
}

function RoadDot({ text, gray }: { text: string; gray?: boolean }) {
    return (
        <li className="flex items-center gap-3 text-gray-400">
            <div
                className={`w-1.5 h-1.5 rounded-full ${
                    gray ? "bg-gray-600" : "bg-[#FF2B2B]"
                }`}
            />
            {text}
        </li>
    );
}
