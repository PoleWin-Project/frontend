// Tracés vectoriels des circuits, issus du repo bacinger/f1-circuits (GeoJSON).
// Le fichier consolidé est bundlé en asset statique : aucune dépendance réseau.
import rawData from '@/assets/circuits/f1-circuits.json';

interface CircuitFeature {
    type: 'Feature';
    properties: {
        id: string;
        Location: string;
        Name: string;
        length: number;
        opened: number;
        firstgp: number;
        altitude: number;
    };
    geometry: {
        type: 'LineString';
        coordinates: [number, number][]; // [lng, lat]
    };
}

interface CircuitCollection {
    type: 'FeatureCollection';
    features: CircuitFeature[];
}

const collection = rawData as unknown as CircuitCollection;

export interface CircuitTrack {
    id: string;
    name: string;
    location: string;
    length: number;
    /** Points projetés en plan (équirectangulaire), prêts à être normalisés/dessinés. */
    points: { x: number; y: number }[];
}

/** Normalise une chaîne pour le matching : minuscule, sans accents/espaces/tirets. */
function normalize(s: string): string {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Table de correspondance explicite : nom OpenF1 (circuit_short_name ou location)
 * → id f1-circuits. Clés normalisées. Couvre le calendrier moderne + circuits récents.
 */
const ALIAS_TO_ID: Record<string, string> = {
    // --- Calendrier courant ---
    sakhir: 'bh-2002', bahrain: 'bh-2002',
    jeddah: 'sa-2021', jiddah: 'sa-2021',
    melbourne: 'au-1953', albertpark: 'au-1953',
    suzuka: 'jp-1962',
    shanghai: 'cn-2004',
    miami: 'us-2022',
    imola: 'it-1953',
    monaco: 'mc-1929', montecarlo: 'mc-1929',
    catalunya: 'es-1991', barcelona: 'es-1991', montmelo: 'es-1991',
    madrid: 'es-2026', madring: 'es-2026',
    montreal: 'ca-1978', gillesvilleneuve: 'ca-1978',
    spielberg: 'at-1969', redbullring: 'at-1969',
    silverstone: 'gb-1948',
    hungaroring: 'hu-1986', budapest: 'hu-1986',
    spafrancorchamps: 'be-1925', spa: 'be-1925',
    zandvoort: 'nl-1948',
    monza: 'it-1922',
    baku: 'az-2016',
    singapore: 'sg-2008', marinabay: 'sg-2008',
    austin: 'us-2012', cota: 'us-2012',
    mexicocity: 'mx-1962', mexico: 'mx-1962',
    interlagos: 'br-1940', saopaulo: 'br-1940',
    lasvegas: 'us-2023',
    lusail: 'qa-2004', losail: 'qa-2004', qatar: 'qa-2004',
    yasmarina: 'ae-2009', abudhabi: 'ae-2009',
    // --- Circuits récents / historiques ---
    paulricard: 'fr-1969', lecastellet: 'fr-1969',
    portimao: 'pt-2008',
    istanbul: 'tr-2005',
    sochi: 'ru-2014',
    nurburgring: 'de-1927', nurburg: 'de-1927',
    hockenheim: 'de-1932',
    sepang: 'my-1999', kualalumpur: 'my-1999',
    mugello: 'it-1914',
    magnycours: 'fr-1960',
    indianapolis: 'us-1909',
    estoril: 'pt-1972',
};

// Index par id, et projection lazy mémoïsée.
const byId = new Map<string, CircuitFeature>();
for (const f of collection.features) byId.set(f.properties.id, f);

const trackCache = new Map<string, CircuitTrack>();

function buildTrack(feature: CircuitFeature): CircuitTrack {
    const cached = trackCache.get(feature.properties.id);
    if (cached) return cached;

    const coords = feature.geometry.coordinates;
    // Projection équirectangulaire : on corrige x par cos(latitude moyenne)
    // pour conserver des proportions correctes sur l'emprise (petite) du circuit.
    const latMean = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
    const k = Math.cos((latMean * Math.PI) / 180);
    const points = coords.map(([lng, lat]) => ({ x: lng * k, y: lat }));

    const track: CircuitTrack = {
        id: feature.properties.id,
        name: feature.properties.Name,
        location: feature.properties.Location,
        length: feature.properties.length,
        points,
    };
    trackCache.set(feature.properties.id, track);
    return track;
}

/**
 * Retourne le tracé d'un circuit pour un meeting OpenF1, ou null si non trouvé.
 * Stratégie : table de correspondance (circuit_short_name puis location),
 * avec repli sur un matching direct contre le champ Location du GeoJSON.
 */
export function getCircuitTrack(meeting: {
    circuit_short_name?: string | null;
    location?: string | null;
}): CircuitTrack | null {
    const candidates = [meeting.circuit_short_name, meeting.location]
        .filter((s): s is string => !!s)
        .map(normalize);

    for (const key of candidates) {
        const id = ALIAS_TO_ID[key];
        if (id && byId.has(id)) return buildTrack(byId.get(id)!);
    }

    // Repli : match direct sur le champ Location du GeoJSON.
    for (const key of candidates) {
        for (const f of collection.features) {
            if (normalize(f.properties.Location) === key) return buildTrack(f);
        }
    }

    return null;
}
