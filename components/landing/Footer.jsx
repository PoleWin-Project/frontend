import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-black py-12 border-white/10 border-t">
            <div className="mx-auto px-6 container">
                <div className="flex md:flex-row flex-col justify-between items-center mb-8">
                    <div className="mb-4 md:mb-0 font-bold text-2xl italic tracking-tighter">
                        POLE<span className="text-[#FF2B2B]">WIN</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <Link
                            href="/#discord"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Discord
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Contact
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Mentions légales
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Politique de confidentialité
                        </Link>
                    </div>
                </div>

                <div className="max-w-2xl text-gray-600 text-xs md:text-left text-center">
                    <p>
                        PoleWin est un projet communautaire indépendant, non
                        affilié à la Formule 1 ni à ses organisations
                        officielles. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE
                        WORLD CHAMPIONSHIP, GRAND PRIX et les marques associées
                        sont des marques déposées de Formula One Licensing B.V.
                    </p>
                    <p className="mt-2">© 2025 PoleWin. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
