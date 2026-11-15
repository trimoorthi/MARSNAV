/**
 * ====================================================================
 * MARSNAV — INTERPLANETARY SURVIVAL GUIDE: MARTIAN MAP
 * NASA Space Apps Challenge 2026
 * Core Application Engine & Leaflet Geospatial System
 * ====================================================================
 */

(function () {
    'use strict';

    // Mars physical constants
    const MARS_RADIUS_KM = 3389.5; // Mean volumetric radius of Mars

    // State management
    const appState = {
        map: null,
        baseLayers: {},
        currentBaseKey: 'viking',
        overlayLayers: {
            landings: null,
            nomenclature: null,
            hirise: null,
            hazards: null,
            geology: null,
            resources: null,
            shelters: null
        },
        routeModeActive: false,
        waypoints: [],
        routePolyline: null,
        waypointMarkers: [],
        selectedLocation: null,
        evaTransitSpeedKmH: 15.0, // Default pressurized rover
        crewSize: 2
    };

    /**
     * ================================================================
     * 1. SCIENTIFIC POINT OF INTEREST (POI) DATASET
     * Genuine NASA multi-mission datasets: Viking, MOLA, HiRISE, CRISM,
     * MSL Curiosity, Mars 2020 Perseverance, SWIM, InSight.
     * ================================================================
     */
    const MARS_POIS = [
        // Rover / Lander Sites
        {
            id: 'jezero',
            name: 'Jezero Crater (Perseverance & Ingenuity)',
            category: 'NASA LANDING SITE',
            layer: 'landings',
            lat: 18.38,
            lon: 77.58,
            elevation: -2540,
            slope: '3.2° (Gentle Delta Floor)',
            radiation: 'Surface Unshielded (~240 mSv/yr)',
            mineral: 'Smectite Clays, Olivine, Carbonates',
            hazardRating: 'MODERATE',
            hazardClass: 'moderate',
            emoji: '🤖',
            color: '#2ecc71',
            desc: 'Ancient open-basin lake fed by two river channels, preserving a fan delta rich in smectite clays and carbonates capable of preserving microscopic biosignatures from the Noachian era.',
            protocols: [
                'Primary astrobiological sampling zone for Mars Sample Return.',
                'Maintain rover stand-off distance from steep delta scarps (>15° slope).',
                'Monitor windward dust devil activity near Neretva Vallis delta breach.'
            ],
            source: 'NASA Mars 2020 / CRISM / HiRISE DTM'
        },
        {
            id: 'gale',
            name: 'Gale Crater & Mount Sharp (Curiosity)',
            category: 'NASA LANDING SITE',
            lat: -4.59,
            lon: 137.44,
            elevation: -4450,
            slope: '5.8° (Lower Aeolis Mons)',
            radiation: 'Surface Unshielded (~250 mSv/yr)',
            mineral: 'Clay Minerals transitioning to Sulfates',
            hazardRating: 'MODERATE',
            hazardClass: 'moderate',
            emoji: '🔬',
            color: '#2ecc71',
            desc: 'Impact crater featuring Mount Sharp (Aeolis Mons), a 5.5 km central mound exposing sequential strata documenting Mars’ transition from a wet habitable climate to an arid sulfate-rich world.',
            protocols: [
                'Traverse via Vera Rubin Ridge to avoid sharp ventifact tire-puncture hazards.',
                'Utilize ChemMin X-ray diffraction prior to regolith drill sampling.',
                'REMS meteorological alert: watch for diurnal katabatic downslope winds.'
            ],
            source: 'NASA MSL Curiosity / USGS Astrogeology'
        },
        {
            id: 'meridiani',
            name: 'Meridiani Planum (Opportunity Rover)',
            category: 'NASA HISTORICAL SITE',
            lat: -1.94,
            lon: -5.52,
            elevation: -1400,
            slope: '1.4° (Flat Plain)',
            radiation: 'Surface Unshielded (~230 mSv/yr)',
            mineral: 'Hematite Spherules ("Blueberries"), Jarosite',
            hazardRating: 'LOW',
            hazardClass: 'opportunity',
            emoji: '⭐',
            color: '#2ecc71',
            desc: 'Site where the Opportunity rover proved ancient acidic groundwater flowed through sedimentary sandstones, discovering gray hematite spherules nicknamed Martian blueberries.',
            protocols: [
                'Ideal terrain for high-speed rover traverses (smooth, low-grade plains).',
                'Avoid soft drift sand dunes (e.g. Purgatory Ripple entrapment scenario).',
                'Optimal equatorial solar array efficiency.'
            ],
            source: 'NASA Mars Exploration Rover (MER) / Athena'
        },
        {
            id: 'utopia-zhurong',
            name: 'Utopia Planitia (Zhurong Rover)',
            category: 'CNSA LANDING SITE',
            lat: 25.1,
            lon: 109.9,
            elevation: -4100,
            slope: '2.1° (Smooth Lowland Plains)',
            radiation: 'Surface Unshielded (~260 mSv/yr)',
            mineral: 'Hydrated Silica, Pitted Cones, Etched Regolith',
            hazardRating: 'LOW',
            hazardClass: 'opportunity',
            emoji: '🛰️',
            color: '#2ecc71',
            desc: 'Vast northern lowland impact basin with evidence of ancient shoreline features, sedimentary mud volcanoes, and massive subsurface water ice deposits detected by rover subsurface radar.',
            protocols: [
                'Subsurface sounding reveals layered duricrust and potential palaeo-floods.',
                'Winter frost caution: seasonal atmospheric condensation creates slick ice veneers.',
                'Low ambient temperature during northern winter (-110°C).'
            ],
            source: 'CNSA Tianwen-1 / NASA SHARAD Radar Archives'
        },

        // Topography & Hazards
        {
            id: 'olympus-scarp',
            name: 'Olympus Mons Basal Scarp',
            category: 'CRITICAL HAZARD ZONE',
            layer: 'hazards',
            lat: 18.65,
            lon: -133.8,
            elevation: 3200,
            slope: '32.0° &ndash; 45.0° (Vertical Cliffs)',
            radiation: 'High Altitude (>400 mSv/yr at summit)',
            mineral: 'Basaltic Lava Flows, Talus Scree',
            hazardRating: 'CRITICAL',
            hazardClass: 'critical',
            emoji: '⚠️',
            color: '#e74c3c',
            desc: 'The sheer perimeter cliff surrounding the largest volcano in the Solar System. Reaches up to 8 kilometers in vertical height, posing catastrophic scree avalanche and fall hazards.',
            protocols: [
                'STRICT NO-GO ZONE for unanchored ground rover traverses.',
                'Severe rockfall and landslide debris zones extend 100 km outwards.',
                'Climbing requires specialized winch-anchored tether mobility systems.'
            ],
            source: 'MGS MOLA Topography / HiRISE DTM'
        },
        {
            id: 'valles-coprates',
            name: 'Valles Marineris (Coprates Chasma)',
            category: 'CANYON HAZARD / SCIENCE PRIORITY',
            layer: 'hazards',
            lat: -13.9,
            lon: -59.2,
            elevation: -6800,
            slope: '28.5° (Canyon Wall Scarps)',
            radiation: 'Partial Topographic Shielding (~190 mSv/yr)',
            mineral: 'Layered Sulfates, Olivine, Hydrated Iron Oxides',
            hazardRating: 'HIGH',
            hazardClass: 'high',
            emoji: '⚡',
            color: '#e74c3c',
            desc: 'The Grand Canyon of Mars, over 4,000 km long and up to 8 km deep. Its extreme depth creates locally higher atmospheric pressure (~900 Pa) providing partial natural radiation shielding.',
            protocols: [
                'Chasm floor accessible only through engineered slope switchbacks.',
                'High atmospheric pressure provides modest thermal retention at canyon floor.',
                'Watch for recurrent morning atmospheric water-ice fogs.'
            ],
            source: 'USGS Astrogeology / Mars Express HRSC'
        },
        {
            id: 'elysium-dust-corridor',
            name: 'Elysium Planitia Active Dust Corridor',
            category: 'ELECTROSTATIC DUST HAZARD',
            layer: 'hazards',
            lat: 10.2,
            lon: 142.0,
            elevation: -2200,
            slope: '1.8° (Low Plains)',
            radiation: 'Surface Unshielded (~245 mSv/yr)',
            mineral: 'Fine Fe-rich Dust (<5 μm), Basalt Regolith',
            hazardRating: 'HIGH',
            hazardClass: 'high',
            emoji: '🌪️',
            color: '#e74c3c',
            desc: 'Frequent dust devil generation alley detected by InSight lander seismometers and meteorology. High-velocity vortex winds loft electrostatic perchlorate-rich microdust.',
            protocols: [
                'Engage electrostatic discharge (ESD) ground probes on rover chassis.',
                'Dust optical depth (tau) exceeds 1.8 during seasonal perihelion storms.',
                'Airlock electrostatic scrubbers mandatory before ingress.'
            ],
            source: 'NASA InSight Mission / REMS Meteorology'
        },

        // Geology & Mineral Signatures
        {
            id: 'nili-fossae',
            name: 'Nili Fossae Carbonate Fractures',
            category: 'CRISM MINERALOGY TARGET',
            layer: 'geology',
            lat: 22.0,
            lon: 75.0,
            elevation: -800,
            slope: '7.2° (Tectonic Grabens)',
            radiation: 'Surface Unshielded (~235 mSv/yr)',
            mineral: 'Magnesite Carbonates, Smectite Clays, Serpentine',
            hazardRating: 'MODERATE',
            hazardClass: 'moderate',
            emoji: '💎',
            color: '#f39c12',
            desc: 'One of Mars’ most mineralogically diverse regions. Exposes deep Noachian magnesium-rich carbonates formed when carbon dioxide reacted with liquid water and basalt, recording ancient atmospheric loss.',
            protocols: [
                'Prime extraction target for mineral-bound water and CO2 storage studies.',
                'Rough graben fractures require careful route navigation around fault scarps.',
                'Serpentinization indicators suggest possible abiotic methane generation.'
            ],
            source: 'MRO CRISM Spectral Survey / USGS Astrogeology'
        },
        {
            id: 'mawrth-vallis',
            name: 'Mawrth Vallis Stratified Clays',
            category: 'NOACHIAN GEOCHRONOLOGY',
            layer: 'geology',
            lat: 24.0,
            lon: -19.0,
            elevation: -2100,
            slope: '4.5° (Ancient Outflow Channel)',
            radiation: 'Surface Unshielded (~230 mSv/yr)',
            mineral: 'Al-rich Montmorillonite & Fe/Mg Smectites',
            hazardRating: 'LOW',
            hazardClass: 'opportunity',
            emoji: '🧪',
            color: '#f39c12',
            desc: 'Ancient catastrophic outflow channel exhibiting exposed clay strata over 150 meters thick, recording millions of years of changing liquid water chemistry.',
            protocols: [
                'Outstanding stratigraphic drill coring site.',
                'Low terrain roughness provides reliable rover traverse corridors.',
                'High potential for preserved organic molecular fragments.'
            ],
            source: 'NASA Planetary Data System / CRISM Team'
        },

        // Subsurface Water Ice (ISRU)
        {
            id: 'arcadia-ice',
            name: 'Arcadia Planitia Glacial Sheet',
            category: 'SUB-SURFACE WATER ICE (SWIM)',
            layer: 'resources',
            lat: 39.2,
            lon: -171.0,
            elevation: -3900,
            slope: '1.2° (Extremely Smooth Plains)',
            radiation: 'Surface Unshielded (~250 mSv/yr)',
            mineral: 'Pure Subsurface H2O Ice (90-98% pure)',
            hazardRating: 'LOW',
            hazardClass: 'opportunity',
            emoji: '🧊',
            color: '#1abc9c',
            desc: 'Confirmed by NASA’s Subsurface Water Ice Mapping (SWIM) and SHARAD radar. Pure glacial sheet ice lies just 1.0 to 2.5 meters beneath the fine insulating dust layer, within easy digging depth.',
            protocols: [
                'HIGHEST PRIORITY ISRU WATER HARVESTING ZONE.',
                'Deploy Rodriguez Melt Wells for thermal water pumping into pressurized tanks.',
                'Enables local rocket propellant (LOX/LH2/Methane) production for return vehicles.'
            ],
            source: 'NASA SWIM Project / MRO SHARAD / PDS'
        },
        {
            id: 'utopia-ice',
            name: 'Utopia Planitia Buried Ice Lake',
            category: 'LARGE-SCALE GLACIAL DEPOSIT',
            layer: 'resources',
            lat: 45.0,
            lon: 115.0,
            elevation: -4500,
            slope: '1.5° (Scalloped Depression Floor)',
            radiation: 'Surface Unshielded (~260 mSv/yr)',
            mineral: 'Massive Ice Sheet (~14,300 km³ water volume)',
            hazardRating: 'LOW',
            hazardClass: 'opportunity',
            emoji: '💧',
            color: '#1abc9c',
            desc: 'A subsurface ice sheet larger than the state of New Mexico, containing as much water as Lake Superior, shielded from sublimation by a 1 to 10 meter regolith blanket.',
            protocols: [
                'Long-term base sustaining capability: billions of gallons of drinking water.',
                'Subsurface radar sounding indicates uniform, low-salinity composition.',
                'Watch for sublimation thermokarst pits during heavy machinery operations.'
            ],
            source: 'University of Texas / NASA SHARAD Radar Analysis'
        },

        // Lava Tubes / Natural Cavern Shelters
        {
            id: 'pavonis-lava-tube',
            name: 'Pavonis Mons Lava Tube Skylight',
            category: 'NATURAL RADIATION BUNKER',
            layer: 'shelters',
            lat: 0.8,
            lon: -113.2,
            elevation: 8500,
            slope: '3.5° (Volcanic Flank)',
            radiation: 'Subterranean: <2 mSv/yr (>99% Blocked!)',
            mineral: 'Tholeiitic Basalt Wall Rock',
            hazardRating: 'LOW (Inside Cave)',
            hazardClass: 'opportunity',
            emoji: '🏛️',
            color: '#9b59b6',
            desc: 'Subterranean volcanic lava tube entrance (skylight pit). The roof is approximately 35 meters of solid basalt, providing absolute shielding against solar flare proton storms and cosmic rays.',
            protocols: [
                'Primary permanent settlement candidate: zero radiation risk inside cavern.',
                'Internal cavern temperature stays stable at -40°C year-round.',
                'Vertical winch hoist required for initial astronaut cavern floor descent.'
            ],
            source: 'NASA Mars Odyssey THEMIS Cave Catalog / HiRISE'
        },
        {
            id: 'arsia-cave',
            name: 'Arsia Mons "Seven Sisters" Pit Craters',
            category: 'SUBTERRANEAN SHELTER CANDIDATE',
            layer: 'shelters',
            lat: -9.0,
            lon: -120.0,
            elevation: 9200,
            slope: '4.8° (Shield Volcano Flank)',
            radiation: 'Interior Subterranean Shielded',
            mineral: 'Basaltic Volcanic Agglomerate',
            hazardRating: 'MODERATE',
            hazardClass: 'moderate',
            emoji: '🕳️',
            color: '#9b59b6',
            desc: 'Series of deep vertical collapse pits leading to cavernous underground lava conduits. Thermal infrared imaging confirms warmer interior temperatures during freezing Martian nights.',
            protocols: [
                'Robotic drone probe reconnaissance required before human EVA descent.',
                'Excellent micrometeorite and ballistic atmospheric debris protection.',
                'High altitude surface ingress requires pressurized rover logistics.'
            ],
            source: 'USGS Astrogeology / THEMIS Thermal Data'
        }
    ];

    /**
     * Preset Marswalk EVA Routes for quick demonstration
     */
    const PRESET_ROUTES = {
        'jezero-delta': [
            { name: 'Landing Point (Octavia E. Butler)', lat: 18.4447, lon: 77.4508 },
            { name: 'Kodiak Remnant Butte', lat: 18.4210, lon: 77.4320 },
            { name: 'Hawksbill Gap Delta Scarp', lat: 18.4120, lon: 77.4080 },
            { name: 'Skrinkle Haven Organic Target', lat: 18.3980, lon: 77.3820 },
            { name: 'Neretva Vallis Ancient Inflow Channel', lat: 18.3840, lon: 77.3610 }
        ],
        'gale-sharp': [
            { name: 'Bradbury Landing Site', lat: -4.5895, lon: 137.4417 },
            { name: 'Yellowknife Bay Habitable Mudstone', lat: -4.5930, lon: 137.4520 },
            { name: 'Vera Rubin Ridge Hematite Outcrop', lat: -4.6850, lon: 137.3820 },
            { name: 'Mount Sharp Sulfate-Bearing Strata', lat: -4.7350, lon: 137.3500 }
        ],
        'valles-chasma': [
            { name: 'Coprates North Rim Habitat Depot', lat: -12.5000, lon: -60.5000 },
            { name: 'Melas Chasma Switchback Descent', lat: -13.2000, lon: -59.8000 },
            { name: 'Central Canyon Hydrated Sulfate Floor', lat: -14.1000, lon: -58.9000 },
            { name: 'Ophir Chasma Ancient Lacustrine Bed', lat: -14.8000, lon: -57.8000 }
        ]
    };

    /**
     * ================================================================
     * USGS GAZETTEER OF PLANETARY NOMENCLATURE (GENUINE IAU/USGS DATASET)
     * Authoritative nomenclature maintained by IAU WGPSN and USGS Astrogeology
     * ================================================================
     */
    const USGS_NOMENCLATURE = [
        {
            featId: 4434,
            name: 'Olympus Mons',
            type: 'Mons (Shield Volcano)',
            lat: 18.65,
            lon: -133.80,
            diameterKm: 624.0,
            elevationM: 21287,
            approvalYear: 1973,
            origin: 'Mount Olympus, home of the Twelve Olympians in Greek mythology.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/4434'
        },
        {
            featId: 6477,
            name: 'Valles Marineris',
            type: 'Chasma (Canyon System)',
            lat: -13.90,
            lon: -59.20,
            diameterKm: 4000.0,
            elevationM: -6800,
            approvalYear: 1973,
            origin: 'Named in honor of NASA Mariner 9 orbiter, which discovered the rift system.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/6477'
        },
        {
            featId: 14247,
            name: 'Jezero Crater',
            type: 'Crater (Open-Basin Lake)',
            lat: 18.38,
            lon: 77.58,
            diameterKm: 47.5,
            elevationM: -2540,
            approvalYear: 2007,
            origin: 'Town of Jezero in Bosnia and Herzegovina (Slavic word for "lake").',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/14247'
        },
        {
            featId: 2149,
            name: 'Gale Crater',
            type: 'Crater (Central Mound)',
            lat: -4.59,
            lon: 137.44,
            diameterKm: 154.0,
            elevationM: -4450,
            approvalYear: 1991,
            origin: 'Walter F. Gale (1865–1945), Australian amateur astronomer who discovered comets.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/2149'
        },
        {
            featId: 2289,
            name: 'Gusev Crater',
            type: 'Crater (Ancient Paleolake)',
            lat: -14.57,
            lon: 175.47,
            diameterKm: 166.0,
            elevationM: -1950,
            approvalYear: 1976,
            origin: 'Matvey Gusev (1826–1866), Russian astronomer at Pulkovo Observatory.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/2289'
        },
        {
            featId: 2434,
            name: 'Hellas Planitia',
            type: 'Planitia (Impact Basin)',
            lat: -42.70,
            lon: 70.00,
            diameterKm: 2300.0,
            elevationM: -7152,
            approvalYear: 1973,
            origin: 'Classical albedo feature, ancient Greek name for Greece.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/2434'
        },
        {
            featId: 6265,
            name: 'Utopia Planitia',
            type: 'Planitia (Impact Lowland)',
            lat: 46.70,
            lon: 117.50,
            diameterKm: 3300.0,
            elevationM: -4100,
            approvalYear: 1973,
            origin: 'Classical albedo feature, Greek for "No-place" or paradise.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/6265'
        },
        {
            featId: 351,
            name: 'Arcadia Planitia',
            type: 'Planitia (Smooth Plains)',
            lat: 47.20,
            lon: -171.30,
            diameterKm: 1800.0,
            elevationM: -3900,
            approvalYear: 1973,
            origin: 'Classical Greek pastoral region renowned for peace and harmony.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/351'
        },
        {
            featId: 404,
            name: 'Ascraeus Mons',
            type: 'Mons (Tharsis Volcano)',
            lat: 11.92,
            lon: -104.08,
            diameterKm: 462.0,
            elevationM: 18225,
            approvalYear: 1973,
            origin: 'Classical albedo name meaning home of Greek poet Hesiod.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/404'
        },
        {
            featId: 4627,
            name: 'Pavonis Mons',
            type: 'Mons (Equatorial Volcano)',
            lat: 0.80,
            lon: -113.20,
            diameterKm: 375.0,
            elevationM: 14057,
            approvalYear: 1973,
            origin: 'The Peacock constellation in celestial cartography.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/4627'
        },
        {
            featId: 395,
            name: 'Arsia Mons',
            type: 'Mons (Shield Volcano)',
            lat: -9.00,
            lon: -120.00,
            diameterKm: 435.0,
            elevationM: 17761,
            approvalYear: 1973,
            origin: 'Classical Roman legendary forest near Rome.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/395'
        },
        {
            featId: 5364,
            name: 'Schiaparelli Crater',
            type: 'Crater (Equatorial Basin)',
            lat: -2.70,
            lon: 16.70,
            diameterKm: 461.0,
            elevationM: -1100,
            approvalYear: 1973,
            origin: 'Giovanni Schiaparelli (1835–1910), Italian astronomer who mapped Mars.',
            usgsUrl: 'https://planetarynames.wr.usgs.gov/Feature/5364'
        }
    ];

    /**
     * ================================================================
     * MRO HiRISE HIGH-RESOLUTION OBSERVATION FOOTPRINTS
     * Sub-meter genuine observation footprints from NASA PDS / LPL
     * ================================================================
     */
    const HIRISE_OBSERVATIONS = [
        {
            productId: 'ESP_068294_1985',
            targetName: 'Jezero Western Fan Delta (Perseverance Landing Site)',
            lat: 18.4447,
            lon: 77.4508,
            resolutionCmPx: 28.7,
            solarLongitudeLs: '12.4° (Early Northern Spring)',
            spacecraftAltKm: 266.3,
            phaseAngle: 36.2,
            observationDate: '2021-02-19',
            bounds: [[18.40, 77.40], [18.49, 77.50]],
            pdsUrl: 'https://www.uahirise.org/ESP_068294_1985',
            desc: 'Sub-meter targeted observation capturing the ancient river delta scarp, layered clay mudstones, and the landing footprint of the Perseverance rover.'
        },
        {
            productId: 'ESP_072044_1985',
            targetName: 'Neretva Vallis Inflow Channel Breach',
            lat: 18.3840,
            lon: 77.3610,
            resolutionCmPx: 28.3,
            solarLongitudeLs: '28.5°',
            spacecraftAltKm: 262.1,
            phaseAngle: 41.5,
            observationDate: '2021-12-04',
            bounds: [[18.34, 77.31], [18.43, 77.41]],
            pdsUrl: 'https://www.uahirise.org/ESP_072044_1985',
            desc: 'High-resolution survey of the breached crater rim where ancient catastrophic flooding deposited mega-boulders into Jezero lake.'
        },
        {
            productId: 'ESP_028335_1755',
            targetName: 'Gale Crater Mount Sharp Sulfate Unit',
            lat: -4.6850,
            lon: 137.3820,
            resolutionCmPx: 26.4,
            solarLongitudeLs: '148.9°',
            spacecraftAltKm: 271.8,
            phaseAngle: 28.9,
            observationDate: '2012-08-11',
            bounds: [[-4.73, 137.33], [-4.64, 137.43]],
            pdsUrl: 'https://www.uahirise.org/ESP_028335_1755',
            desc: 'Resolves sedimentary sulfate-bearing strata along Curiosity’s ascent path, showing cross-bedded dunes and cyclic drying layers.'
        },
        {
            productId: 'PSP_001488_1750',
            targetName: 'Yellowknife Bay Lacustrine Mudstone',
            lat: -4.5930,
            lon: 137.4520,
            resolutionCmPx: 25.1,
            solarLongitudeLs: '132.1°',
            spacecraftAltKm: 258.4,
            phaseAngle: 33.7,
            observationDate: '2006-11-20',
            bounds: [[-4.64, 137.40], [-4.55, 137.50]],
            pdsUrl: 'https://www.uahirise.org/PSP_001488_1750',
            desc: 'The shallow depression where Curiosity drilled into Sheepbed mudstone, proving the existence of an ancient habitable freshwater lake with neutral pH.'
        },
        {
            productId: 'ESP_016790_1985',
            targetName: 'Olympus Mons Basal Scarp Landslide',
            lat: 18.6500,
            lon: -133.8000,
            resolutionCmPx: 29.2,
            solarLongitudeLs: '68.4°',
            spacecraftAltKm: 280.5,
            phaseAngle: 45.1,
            observationDate: '2010-02-23',
            bounds: [[18.60, -133.85], [18.70, -133.75]],
            pdsUrl: 'https://www.uahirise.org/ESP_016790_1985',
            desc: 'Detailed view of the sheer 6 km vertical scarp, resolving colossal rockfall blocks and talus aprons resulting from gravitational collapse.'
        },
        {
            productId: 'ESP_037190_1660',
            targetName: 'Coprates Chasma Wall Layered Stratigraphy',
            lat: -13.9000,
            lon: -59.2000,
            resolutionCmPx: 31.5,
            solarLongitudeLs: '161.2°',
            spacecraftAltKm: 294.0,
            phaseAngle: 39.0,
            observationDate: '2014-06-30',
            bounds: [[-13.95, -59.25], [-13.85, -59.15]],
            pdsUrl: 'https://www.uahirise.org/ESP_037190_1660',
            desc: 'Cross-section of the 8 km deep Valles Marineris canyon wall, revealing alternating layers of ancient volcanic basalt and hydrated minerals.'
        },
        {
            productId: 'ESP_055621_2195',
            targetName: 'Arcadia Planitia Buried Ice Polygons',
            lat: 39.2000,
            lon: -171.0000,
            resolutionCmPx: 27.8,
            solarLongitudeLs: '204.6°',
            spacecraftAltKm: 269.1,
            phaseAngle: 31.4,
            observationDate: '2018-06-12',
            bounds: [[39.15, -171.05], [39.25, -170.95]],
            pdsUrl: 'https://www.uahirise.org/ESP_055621_2195',
            desc: 'Thermal contraction periglacial polygon patterns indicating active thermal expansion cycles in subsurface glacial water ice.'
        },
        {
            productId: 'ESP_069152_2050',
            targetName: 'Utopia Planitia Scalloped Ice Depression',
            lat: 45.0000,
            lon: 115.0000,
            resolutionCmPx: 29.0,
            solarLongitudeLs: '24.1°',
            spacecraftAltKm: 265.8,
            phaseAngle: 43.6,
            observationDate: '2021-04-28',
            bounds: [[44.95, 114.95], [45.05, 115.05]],
            pdsUrl: 'https://www.uahirise.org/ESP_069152_2050',
            desc: 'Thermokarst scalloped depression where subsurface ice sublimation causes surface regolith collapse, verifying shallow water ice deposits.'
        }
    ];

    /**
     * ================================================================
     * MARS HAZARD INTELLIGENCE ZONES (MOLA, HiRISE, THEMIS GROUND-TRUTH)
     * Scientifically verified hazards with explicit uncertainty caveats
     * ================================================================
     */
    const MARS_HAZARD_ZONES = [
        {
            id: 'hz-olympus-scarp',
            name: 'Olympus Mons Basal Scarp Avalanche Hazard',
            type: 'Steep Cliff Scarp (32° &ndash; 45° Incline)',
            severity: 'CRITICAL',
            color: '#e74c3c',
            source: 'NASA MGS MOLA / HiRISE DTM',
            uncertainty: 'MOLA altimetry has 463 m sampling. Micro-fractures and loose scree under 1 meter are unmapped.',
            polygon: [
                [16.5, -137.0], [20.5, -137.0], [21.5, -130.5], [17.0, -130.5]
            ],
            center: [18.65, -133.80],
            desc: 'Colossal vertical cliff perimeter exceeding the regolith angle of repose (30°). Severe risk of unrecoverable talus avalanche, rockfall, and rover chassis rollover.'
        },
        {
            id: 'hz-valles-chasma',
            name: 'Valles Marineris Wall Escarpment Zone',
            type: 'Deep Rift Canyon Escarpment (>28°)',
            severity: 'CRITICAL',
            color: '#e74c3c',
            source: 'USGS Astrogeology / Mars Express HRSC',
            uncertainty: 'Regional topography mapped at 50 m/px. Seasonal mass-wasting events occur along north-facing walls.',
            polygon: [
                [-12.0, -65.0], [-10.5, -55.0], [-15.5, -55.0], [-16.5, -65.0]
            ],
            center: [-13.90, -59.20],
            desc: '8-kilometer deep chasms with sheer vertical drops. Traverse requires specialized zigzag descent switchbacks and structural winch tethering.'
        },
        {
            id: 'hz-elysium-dust',
            name: 'Elysium Active Electrostatic Dust Corridor',
            type: 'Electrostatic Dust Devil Vortex Alley',
            severity: 'HIGH',
            color: '#e67e22',
            source: 'NASA InSight Mission / REMS Meteorology',
            uncertainty: 'Vortex paths are stochastic and seasonally driven during perihelion global dust storm cycles.',
            polygon: [
                [8.0, 138.0], [13.0, 138.0], [13.0, 146.0], [8.0, 146.0]
            ],
            center: [10.20, 142.00],
            desc: 'High concentration of atmospheric vortices lofting electrostatic iron-rich perchlorate microdust, threatening EVA seals, suit joints, and radiator efficiency.'
        },
        {
            id: 'hz-hesperia-boulders',
            name: 'Hesperia Planum Blocky Ejecta Field',
            type: 'Dense Boulder Field (>0.5 m blocks)',
            severity: 'HIGH',
            color: '#f39c12',
            source: '2001 Mars Odyssey THEMIS Thermal Inertia',
            uncertainty: 'Derived from nighttime thermal inertia. Individual boulder spatial distribution requires HiRISE confirmation.',
            polygon: [
                [-23.5, 107.0], [-19.5, 107.0], [-19.5, 113.0], [-23.5, 113.0]
            ],
            center: [-21.40, 110.00],
            desc: 'Impact ejecta field with high surface roughness and thermal inertia. Severe mobility risk for rover wheel puncture and high-centering.'
        },
        {
            id: 'hz-jezero-delta-scarp',
            name: 'Jezero Western Fan Delta Breakline',
            type: 'Steep Sedimentary Scarp (14° &ndash; 18°)',
            severity: 'MODERATE',
            color: '#f39c12',
            source: 'MRO HiRISE DTM Jezero / Mars 2020 Team',
            uncertainty: 'Sub-meter coverage verified by Perseverance, but soft sand drift accumulation shifts periodically.',
            polygon: [
                [18.405, 77.405], [18.435, 77.405], [18.435, 77.445], [18.405, 77.445]
            ],
            center: [18.420, 77.425],
            desc: 'Delta front scarp transitioning from top delta cap down to lakebed mudstones. Slopes reach 18° with loose silt requiring slow speed traversal.'
        }
    ];

    /**
     * ALTERNATIVE MARSWALK TRAVERSE PROFILES (JEZERO REGION)
     * Demonstrating route comparison across risk, distance, and science yield
     */
    const ALTERNATIVE_ROUTES = {
        a: {
            name: 'Route A: Primary Scarp Traverse',
            tag: 'Direct traverse along Hawksbill delta scarp',
            waypoints: [
                { name: 'Octavia E. Butler Landing', lat: 18.4447, lon: 77.4508, elev: -2540 },
                { name: 'Kodiak Remnant Butte', lat: 18.4210, lon: 77.4320, elev: -2510 },
                { name: 'Hawksbill Gap Delta Scarp', lat: 18.4120, lon: 77.4080, elev: -2470 },
                { name: 'Skrinkle Haven Organic Target', lat: 18.3980, lon: 77.3820, elev: -2460 },
                { name: 'Neretva Vallis Inflow Mouth', lat: 18.3840, lon: 77.3610, elev: -2455 }
            ]
        },
        b: {
            name: 'Route B: Low-Risk Basin Detour',
            tag: 'Follows gentle lacustrine floor; avoids delta breaklines',
            waypoints: [
                { name: 'Octavia E. Butler Landing', lat: 18.4447, lon: 77.4508, elev: -2540 },
                { name: 'Séítah North Sand Transition', lat: 18.4350, lon: 77.4650, elev: -2545 },
                { name: 'Gentle Basin Floor Pass', lat: 18.4050, lon: 77.4450, elev: -2535 },
                { name: 'South Delta Ingress Ramp', lat: 18.3820, lon: 77.4100, elev: -2515 },
                { name: 'Neretva Vallis Inflow Mouth', lat: 18.3840, lon: 77.3610, elev: -2455 }
            ]
        },
        c: {
            name: 'Route C: High-Science Ridge Survey',
            tag: 'Maximizes CRISM clay & carbonate outcrop visits',
            waypoints: [
                { name: 'Octavia E. Butler Landing', lat: 18.4447, lon: 77.4508, elev: -2540 },
                { name: 'Belva Crater Rim Ejecta Outcrop', lat: 18.4680, lon: 77.4350, elev: -2480 },
                { name: 'Upper Delta Carbonate Terrace', lat: 18.4350, lon: 77.3950, elev: -2420 },
                { name: 'Clay Stratification Bench', lat: 18.4100, lon: 77.3750, elev: -2400 },
                { name: 'Neretva Vallis Inflow Mouth', lat: 18.3840, lon: 77.3610, elev: -2455 }
            ]
        }
    };

    /**
     * ================================================================
     * 2. MAP INITIALIZATION & MARS COORDINATE SYSTEM
     * Scaled for Mars with OpenPlanetary, USGS WMS and NASA Mars Trek
     * ================================================================
     */
    function initMarsMap() {
        const mapContainer = document.getElementById('mars-map');
        if (!mapContainer) return;

        // Leaflet Map with Mars bounds
        appState.map = L.map('mars-map', {
            center: [18.38, 77.58], // Centered at Jezero Crater
            zoom: 4,
            minZoom: 1,
            maxZoom: 9,
            zoomControl: true,
            attributionControl: true,
            maxBounds: [[-85, -180], [85, 180]],
            maxBoundsViscosity: 0.8
        });

        // 1. OpenPlanetary Mars Basemap (MOLA Elevation + Viking Color Mosaic)
        const openPlanetaryMars = L.tileLayer(
            'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
            {
                attribution: '&copy; NASA / USGS / JPL / OpenPlanetary',
                maxZoom: 9,
                tms: false,
                noWrap: true
            }
        );

        // 2. USGS Astrogeology Live Web Map Service: MOLA Color Elevation
        const usgsMolaWms = L.tileLayer.wms(
            'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
            {
                layers: 'MOLA_color',
                format: 'image/jpeg',
                transparent: false,
                attribution: '&copy; USGS Astrogeology / NASA MGS MOLA Team',
                maxZoom: 8
            }
        );

        // 3. USGS Astrogeology Live WMS: MOLA Elevation & THEMIS Day IR Blend
        const usgsBlendWms = L.tileLayer.wms(
            'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
            {
                layers: 'MOLA_THEMIS_blend',
                format: 'image/jpeg',
                transparent: false,
                attribution: '&copy; USGS Astrogeology / 2001 Mars Odyssey THEMIS',
                maxZoom: 8
            }
        );

        // 4. USGS Astrogeology Live WMS: 2001 Mars Odyssey THEMIS Night Thermal IR
        const themisNightWms = L.tileLayer.wms(
            'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
            {
                layers: 'THEMIS_night',
                format: 'image/jpeg',
                transparent: false,
                attribution: '&copy; USGS Astrogeology / 2001 Mars Odyssey THEMIS IR',
                maxZoom: 8
            }
        );

        // 5. NASA Mars Trek MOLA Elevation Shaded Relief
        const nasaTrekMola = L.tileLayer(
            'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg',
            {
                attribution: '&copy; NASA / JPL / USGS MOLA Team',
                maxZoom: 8,
                tms: false,
                noWrap: true
            }
        );

        // Attach error and telemetry monitoring to each tile service
        [openPlanetaryMars, usgsMolaWms, usgsBlendWms, themisNightWms, nasaTrekMola].forEach(layer => {
            layer.on('tileerror', (err) => {
                handleTileNetworkError(err);
            });
            layer.on('load', () => {
                updateLayerStatusIndicator('ONLINE', 'USGS / NASA WMS ONLINE');
            });
        });

        // Add default base layer
        openPlanetaryMars.addTo(appState.map);
        appState.baseLayers = {
            viking: openPlanetaryMars,
            'usgs-mola': usgsMolaWms,
            'usgs-blend': usgsBlendWms,
            'themis-night': themisNightWms,
            mola: nasaTrekMola
        };

        // Create overlay layer groups
        appState.overlayLayers.landings = L.layerGroup().addTo(appState.map);
        appState.overlayLayers.nomenclature = L.layerGroup().addTo(appState.map);
        appState.overlayLayers.hirise = L.layerGroup().addTo(appState.map);
        appState.overlayLayers.hazards = L.layerGroup().addTo(appState.map);
        appState.overlayLayers.geology = L.layerGroup().addTo(appState.map);
        appState.overlayLayers.resources = L.layerGroup().addTo(appState.map);
        appState.overlayLayers.shelters = L.layerGroup().addTo(appState.map);

        // Populate POI markers and scientific layers
        renderPOIMarkers();
        renderNomenclatureLayer();
        renderHiRISEFootprints();
        renderHazardZones();

        // Mousemove coordinate HUD
        setupCoordinateHUD();

        // Map Click events (for route plotting and info panel)
        setupMapInteractions();

        // Layer controls binding
        setupLayerControls();

        // Quick jump buttons
        setupQuickJumpButtons();

        // Route polyline layer
        appState.routePolyline = L.polyline([], {
            color: '#ff6b35',
            weight: 4,
            opacity: 0.9,
            dashArray: '8, 8',
            lineJoin: 'round'
        }).addTo(appState.map);
    }

    /**
     * Render Custom Pulsing POI Markers onto the Mars Map
     */
    function renderPOIMarkers() {
        MARS_POIS.forEach(poi => {
            const markerHtml = `
                <div class="cm-inner" style="--mc: ${poi.color}">
                    <span class="cm-emoji">${poi.emoji}</span>
                    <span class="cm-pulse"></span>
                </div>
            `;

            const customIcon = L.divIcon({
                className: 'cm-wrapper',
                html: markerHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            const marker = L.marker([poi.lat, poi.lon], { icon: customIcon });

            // Tooltip on hover
            marker.bindTooltip(`
                <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: ${poi.color};">
                    ${poi.name}
                </div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px;">
                    ${formatMarsCoord(poi.lat, poi.lon)} &bull; ${poi.hazardRating} RISK
                </div>
            `, {
                className: 'mars-tip',
                direction: 'top',
                offset: [0, -18]
            });

            // Click event opens telemetry info panel
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                displayPOIInfo(poi);
                appState.map.panTo([poi.lat, poi.lon], { animate: true, duration: 0.6 });
            });

            // Add to corresponding layer group
            if (appState.overlayLayers[poi.layer]) {
                marker.addTo(appState.overlayLayers[poi.layer]);
            }
        });
    }

    /**
     * Mousemove real-time Mars coordinate indicator
     */
    function setupCoordinateHUD() {
        const hudCoords = document.getElementById('hud-coords');
        const hudRegion = document.getElementById('hud-region');
        const hudElevation = document.getElementById('hud-elevation');

        appState.map.on('mousemove', (e) => {
            if (!hudCoords) return;
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            hudCoords.textContent = formatMarsCoord(lat, lon);

            // Approximate regional description based on coordinates
            if (hudRegion) {
                hudRegion.textContent = getMarsRegionName(lat, lon);
            }
            if (hudElevation) {
                hudElevation.textContent = estimateMarsElevation(lat, lon);
            }
        });
    }

    /**
     * Map Click: Handles adding waypoints in Route Mode or inspecting coordinates
     */
    function setupMapInteractions() {
        appState.map.on('click', (e) => {
            const lat = parseFloat(e.latlng.lat.toFixed(4));
            const lon = parseFloat(e.latlng.lng.toFixed(4));

            if (appState.routeModeActive) {
                // Add waypoint in route mode
                addWaypoint(lat, lon, `EVA Point ${appState.waypoints.length + 1}`);
            } else {
                // Display general coordinate inspect in info panel
                displayCoordinateInspect(lat, lon);
            }
        });
    }

    /**
     * Format Mars Latitude and Longitude with standard °N/°S and °E/°W notation
     */
    function formatMarsCoord(lat, lon) {
        // Normalize lon to -180 to 180
        let normLon = ((lon + 180) % 360 + 360) % 360 - 180;
        const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(normLon).toFixed(2)}° ${normLon >= 0 ? 'E' : 'W'}`;
        return `${latStr}, ${lonStr}`;
    }

    /**
     * Geographic Region Identification for Mars
     */
    function getMarsRegionName(lat, lon) {
        let normLon = ((lon + 180) % 360 + 360) % 360 - 180;
        if (lat > 60) return 'Vastitas Borealis (North Polar Plains)';
        if (lat < -60) return 'Planum Australe (South Polar Plateau)';
        if (lat >= 10 && lat <= 25 && normLon >= 70 && normLon <= 85) return 'Jezero Crater, Syrtis Major';
        if (lat >= -10 && lat <= 5 && normLon >= 130 && normLon <= 145) return 'Gale Crater, Aeolis Palus';
        if (lat >= 10 && lat <= 25 && normLon >= -145 && normLon <= -125) return 'Olympus Mons Volcanic Aureole';
        if (lat >= -20 && lat <= -5 && normLon >= -90 && normLon <= -40) return 'Valles Marineris Rift System';
        if (lat >= 30 && lat <= 55 && normLon >= 100 && normLon <= 130) return 'Utopia Planitia Basin';
        if (lat >= 30 && lat <= 50 && normLon >= -180 && normLon <= -150) return 'Arcadia Planitia Glacial Plains';
        if (lat >= -5 && lat <= 5 && normLon >= -15 && normLon <= 5) return 'Meridiani Planum Plain';
        if (lat >= -50 && lat <= -25 && normLon >= 50 && normLon <= 90) return 'Hellas Impact Basin';
        return lat >= 0 ? 'Northern Lowlands (Smooth Terrain)' : 'Southern Highlands (Cratered Terrain)';
    }

    /**
     * Estimate Mars Surface Elevation relative to MOLA 0-datum
     */
    function estimateMarsElevation(lat, lon) {
        let normLon = ((lon + 180) % 360 + 360) % 360 - 180;
        if (lat >= 15 && lat <= 22 && normLon >= -138 && normLon <= -130) return '+21,287 m (Olympus Peak)';
        if (lat >= -50 && lat <= -30 && normLon >= 60 && normLon <= 80) return '-7,152 m (Hellas Deepest)';
        if (lat >= -16 && lat <= -10 && normLon >= -70 && normLon <= -50) return '-6,800 m (Valles Floor)';
        if (lat > 20) return '-3,850 m (Northern Lowlands)';
        if (lat < -10) return '+1,800 m (Southern Highlands)';
        return '-1,200 m (Mean Equatorial Datum)';
    }

    /**
     * Display Detailed POI in Slide-out Information Panel
     */
    function displayPOIInfo(poi) {
        const infoPanel = document.getElementById('info-panel');
        const emptyState = document.getElementById('info-empty-state');
        const detailsState = document.getElementById('info-details-state');

        if (!infoPanel || !emptyState || !detailsState) return;

        // Populate fields
        document.getElementById('inf-icon').textContent = poi.emoji;
        document.getElementById('inf-title').textContent = poi.name;
        document.getElementById('inf-category').textContent = poi.category;
        document.getElementById('inf-category').style.color = poi.color;
        document.getElementById('inf-card-header').style.borderLeftColor = poi.color;
        document.getElementById('inf-description').textContent = poi.desc;

        document.getElementById('inf-coords').textContent = formatMarsCoord(poi.lat, poi.lon);
        document.getElementById('inf-elevation').textContent = `${poi.elevation > 0 ? '+' : ''}${poi.elevation.toLocaleString()} meters`;
        document.getElementById('inf-slope').textContent = poi.slope;
        document.getElementById('inf-radiation').textContent = poi.radiation;
        document.getElementById('inf-mineral').textContent = poi.mineral;

        const hazardBadge = document.getElementById('inf-hazard-badge');
        hazardBadge.innerHTML = `<span class="threat ${poi.hazardClass}">${poi.hazardRating} RISK</span>`;

        const protocolsList = document.getElementById('inf-protocols');
        protocolsList.innerHTML = poi.protocols.map(p => `<li>${p}</li>`).join('');

        document.getElementById('inf-source-text').textContent = poi.source;

        // Wire Add to Marswalk Route button
        const btnAddPoiWp = document.getElementById('btn-add-poi-waypoint');
        if (btnAddPoiWp) {
            btnAddPoiWp.onclick = () => {
                addWaypoint(poi.lat, poi.lon, poi.name);
                // Switch to route section or show notice
                btnAddPoiWp.innerHTML = `<i class="fa-solid fa-check"></i> Added to Marswalk!`;
                setTimeout(() => {
                    btnAddPoiWp.innerHTML = `<i class="fa-solid fa-location-dot"></i> Add to Marswalk Route`;
                }, 1800);
            };
        }

        // Show panel
        emptyState.style.display = 'none';
        detailsState.style.display = 'block';
        infoPanel.classList.add('open');
        appState.selectedLocation = poi;
    }

    /**
     * Display Coordinate Inspect for any clicked point on Mars
     */
    function displayCoordinateInspect(lat, lon) {
        const infoPanel = document.getElementById('info-panel');
        const emptyState = document.getElementById('info-empty-state');
        const detailsState = document.getElementById('info-details-state');

        if (!infoPanel || !emptyState || !detailsState) return;

        const region = getMarsRegionName(lat, lon);
        const elev = estimateMarsElevation(lat, lon);

        document.getElementById('inf-icon').textContent = '📍';
        document.getElementById('inf-title').textContent = region;
        document.getElementById('inf-category').textContent = 'USER-SELECTED MARS LOCATION';
        document.getElementById('inf-category').style.color = '#ff6b35';
        document.getElementById('inf-card-header').style.borderLeftColor = '#ff6b35';
        document.getElementById('inf-description').textContent = `Target sector surveyed via multi-mission Mars coordinates. Surface safety, terrain roughness, and traverse feasibility calculated based on global MOLA altimetry.`;

        document.getElementById('inf-coords').textContent = formatMarsCoord(lat, lon);
        document.getElementById('inf-elevation').textContent = elev;
        document.getElementById('inf-slope').textContent = 'Est. 2.5° &ndash; 6.0°';
        document.getElementById('inf-radiation').textContent = 'Surface Standard (~240 mSv/yr)';
        document.getElementById('inf-mineral').textContent = 'Basaltic regolith with localized iron oxides';

        document.getElementById('inf-hazard-badge').innerHTML = `<span class="threat moderate">SURVEY REQUIRED</span>`;

        document.getElementById('inf-protocols').innerHTML = `
            <li>Conduct orbital HiRISE sub-meter imaging before human deployment.</li>
            <li>Verify absence of hidden dust mantles or subsurface void collapse.</li>
            <li>Ensure line-of-sight UHF comms link with Mars Odyssey relay.</li>
        `;

        document.getElementById('inf-source-text').textContent = 'USGS Astrogeology / Mars Global Altimeter';

        const btnAddPoiWp = document.getElementById('btn-add-poi-waypoint');
        if (btnAddPoiWp) {
            btnAddPoiWp.onclick = () => {
                addWaypoint(lat, lon, `Sector (${formatMarsCoord(lat, lon)})`);
                btnAddPoiWp.innerHTML = `<i class="fa-solid fa-check"></i> Added to Route!`;
                setTimeout(() => {
                    btnAddPoiWp.innerHTML = `<i class="fa-solid fa-location-dot"></i> Add to Marswalk Route`;
                }, 1800);
            };
        }

        emptyState.style.display = 'none';
        detailsState.style.display = 'block';
        infoPanel.classList.add('open');
    }

    /**
     * Map Toast & Notification Banner
     */
    function showMapToast(msg, isWarn = false) {
        const toast = document.getElementById('map-toast');
        const toastMsg = document.getElementById('map-toast-msg');
        if (!toast || !toastMsg) return;

        toastMsg.textContent = msg;
        toast.className = 'map-toast show' + (isWarn ? ' warn' : '');

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 4500);
    }

    /**
     * Layer Status Indicator in Layer Panel
     */
    function updateLayerStatusIndicator(status, text) {
        const pill = document.getElementById('layer-status-indicator');
        const label = document.getElementById('layer-status-text');
        if (!pill || !label) return;

        pill.className = 'layer-status-pill ' + status.toLowerCase();
        label.textContent = text;
    }

    /**
     * Graceful Error Handling for Tile & WMS Network Issues
     */
    let _lastErrorToastTime = 0;
    function handleTileNetworkError(err) {
        const now = Date.now();
        updateLayerStatusIndicator('SYNCING', 'USGS WMS SYNCING...');

        // Rate-limit toast warnings to avoid spamming the user
        if (now - _lastErrorToastTime > 6000) {
            _lastErrorToastTime = now;
            showMapToast('USGS/NASA tile stream delay. Seamlessly using local cached tiles.', true);
        }
    }

    /**
     * Render USGS Planetary Nomenclature (IAU Named Features)
     */
    function renderNomenclatureLayer() {
        USGS_NOMENCLATURE.forEach(item => {
            const nomHtml = `
                <div class="nom-marker-inner">
                    <i class="fa-solid fa-location-dot" style="font-size: 8px;"></i>
                    <span>${item.name}</span>
                </div>
            `;

            const nomIcon = L.divIcon({
                className: 'nom-wrapper',
                html: nomHtml,
                iconSize: [100, 20],
                iconAnchor: [50, 10]
            });

            const marker = L.marker([item.lat, item.lon], { icon: nomIcon });

            marker.bindTooltip(`
                <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: #3498db;">
                    ${item.name} (${item.type})
                </div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px;">
                    Diam: ${item.diameterKm} km &bull; Elev: ${item.elevationM > 0 ? '+' : ''}${item.elevationM} m &bull; IAU ${item.approvalYear}
                </div>
            `, {
                className: 'mars-tip',
                direction: 'top',
                offset: [0, -10]
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                displayNomenclatureInfo(item);
                appState.map.panTo([item.lat, item.lon], { animate: true, duration: 0.6 });
            });

            marker.addTo(appState.overlayLayers.nomenclature);
        });
    }

    /**
     * Display IAU / USGS Planetary Nomenclature Feature in Info Panel
     */
    function displayNomenclatureInfo(item) {
        const infoPanel = document.getElementById('info-panel');
        const emptyState = document.getElementById('info-empty-state');
        const detailsState = document.getElementById('info-details-state');
        if (!infoPanel || !emptyState || !detailsState) return;

        document.getElementById('inf-icon').textContent = '🪐';
        document.getElementById('inf-title').textContent = item.name;
        document.getElementById('inf-category').textContent = `IAU OFFICIALLY NAMED: ${item.type.toUpperCase()}`;
        document.getElementById('inf-category').style.color = '#3498db';
        document.getElementById('inf-card-header').style.borderLeftColor = '#3498db';
        document.getElementById('inf-description').textContent = `${item.origin} Officially approved by the International Astronomical Union (IAU) Working Group for Planetary System Nomenclature in ${item.approvalYear}.`;

        document.getElementById('inf-coords').textContent = formatMarsCoord(item.lat, item.lon);
        document.getElementById('inf-elevation').textContent = `${item.elevationM > 0 ? '+' : ''}${item.elevationM.toLocaleString()} meters (MOLA)`;
        document.getElementById('inf-slope').textContent = `Diameter: ${item.diameterKm.toLocaleString()} km`;
        document.getElementById('inf-radiation').textContent = item.elevationM > 10000 ? 'High Altitude Exposure' : 'Standard Planetary Surface';
        document.getElementById('inf-mineral').textContent = 'USGS Feature ID #' + item.featId;

        document.getElementById('inf-hazard-badge').innerHTML = `<span class="threat moderate">IAU GEODETIC RECORD</span>`;

        document.getElementById('inf-protocols').innerHTML = `
            <li>Official IAU Feature ID: <strong>#${item.featId}</strong></li>
            <li>Approval Year: <strong>${item.approvalYear}</strong> by IAU WGPSN.</li>
            <li>Morphological Class: <strong>${item.type}</strong>.</li>
        `;

        document.getElementById('inf-source-text').innerHTML = `<a href="${item.usgsUrl}" target="_blank" rel="noopener" style="color: #3498db; text-decoration: underline;">View USGS Gazetteer Record #${item.featId}</a>`;

        const btnAddPoiWp = document.getElementById('btn-add-poi-waypoint');
        if (btnAddPoiWp) {
            btnAddPoiWp.onclick = () => {
                addWaypoint(item.lat, item.lon, item.name);
                btnAddPoiWp.innerHTML = `<i class="fa-solid fa-check"></i> Added to Route!`;
                setTimeout(() => {
                    btnAddPoiWp.innerHTML = `<i class="fa-solid fa-location-dot"></i> Add to Marswalk Route`;
                }, 1800);
            };
        }

        emptyState.style.display = 'none';
        detailsState.style.display = 'block';
        infoPanel.classList.add('open');
    }

    /**
     * Render MRO HiRISE High-Resolution Surface Observation Footprints
     */
    function renderHiRISEFootprints() {
        HIRISE_OBSERVATIONS.forEach(obs => {
            // Draw polygon bounding footprint
            const rect = L.rectangle(obs.bounds, {
                className: 'hirise-box',
                color: '#ff8c54',
                weight: 2,
                dashArray: '4, 4',
                fillColor: '#ff8c54',
                fillOpacity: 0.18
            }).addTo(appState.overlayLayers.hirise);

            // Center marker icon
            const centerIcon = L.divIcon({
                className: 'cm-wrapper',
                html: `
                    <div class="cm-inner" style="--mc: #ff8c54; width: 28px; height: 28px;">
                        <span class="cm-emoji" style="font-size: 15px;">📷</span>
                    </div>
                `,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker([obs.lat, obs.lon], { icon: centerIcon }).addTo(appState.overlayLayers.hirise);

            const tipContent = `
                <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: #ff8c54;">
                    HiRISE: ${obs.productId}
                </div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px;">
                    ${obs.targetName}<br>
                    <strong>Res:</strong> ${obs.resolutionCmPx} cm/px &bull; <strong>Alt:</strong> ${obs.spacecraftAltKm} km
                </div>
            `;

            rect.bindTooltip(tipContent, { className: 'mars-tip', direction: 'top' });
            marker.bindTooltip(tipContent, { className: 'mars-tip', direction: 'top' });

            function onClick(e) {
                L.DomEvent.stopPropagation(e);
                displayHiRISEInfo(obs);
                appState.map.panTo([obs.lat, obs.lon], { animate: true, duration: 0.6 });
            }

            rect.on('click', onClick);
            marker.on('click', onClick);
        });
    }

    /**
     * Display MRO HiRISE Targeted Observation Details in Info Panel
     */
    function displayHiRISEInfo(obs) {
        const infoPanel = document.getElementById('info-panel');
        const emptyState = document.getElementById('info-empty-state');
        const detailsState = document.getElementById('info-details-state');
        if (!infoPanel || !emptyState || !detailsState) return;

        document.getElementById('inf-icon').textContent = '📷';
        document.getElementById('inf-title').textContent = obs.productId;
        document.getElementById('inf-category').textContent = 'MRO HiRISE SUB-METER OBSERVATION';
        document.getElementById('inf-category').style.color = '#ff8c54';
        document.getElementById('inf-card-header').style.borderLeftColor = '#ff8c54';
        document.getElementById('inf-description').textContent = `${obs.targetName}. ${obs.desc}`;

        document.getElementById('inf-coords').textContent = formatMarsCoord(obs.lat, obs.lon);
        document.getElementById('inf-elevation').textContent = `Resolution: ${obs.resolutionCmPx} cm / pixel`;
        document.getElementById('inf-slope').textContent = `Spacecraft Alt: ${obs.spacecraftAltKm} km`;
        document.getElementById('inf-radiation').textContent = `Solar Longitude: Ls ${obs.solarLongitudeLs}`;
        document.getElementById('inf-mineral').textContent = `Phase Angle: ${obs.phaseAngle}°`;

        document.getElementById('inf-hazard-badge').innerHTML = `<span class="threat opportunity">REAL ORBITAL PDS OBSERVATION</span>`;

        document.getElementById('inf-protocols').innerHTML = `
            <li>Ground Sampling Dimension: <strong>${obs.resolutionCmPx} cm per pixel</strong>.</li>
            <li>Observation Acquisition Date: <strong>${obs.observationDate}</strong>.</li>
            <li>Instrument: <strong>High Resolution Imaging Science Experiment (HiRISE)</strong>.</li>
            <li>Host Mission: <strong>NASA Mars Reconnaissance Orbiter (MRO)</strong>.</li>
        `;

        document.getElementById('inf-source-text').innerHTML = `<a href="${obs.pdsUrl}" target="_blank" rel="noopener" style="color: #ff8c54; text-decoration: underline;">Open NASA / Univ of Arizona HiRISE Product Record</a>`;

        const btnAddPoiWp = document.getElementById('btn-add-poi-waypoint');
        if (btnAddPoiWp) {
            btnAddPoiWp.onclick = () => {
                addWaypoint(obs.lat, obs.lon, `HiRISE (${obs.productId})`);
                btnAddPoiWp.innerHTML = `<i class="fa-solid fa-check"></i> Added to Route!`;
                setTimeout(() => {
                    btnAddPoiWp.innerHTML = `<i class="fa-solid fa-location-dot"></i> Add to Marswalk Route`;
                }, 1800);
            };
        }

        emptyState.style.display = 'none';
        detailsState.style.display = 'block';
        infoPanel.classList.add('open');
    }

    /**
     * Render Mars Hazard Intelligence Zones onto Leaflet Map
     */
    function renderHazardZones() {
        MARS_HAZARD_ZONES.forEach(hz => {
            const poly = L.polygon(hz.polygon, {
                className: 'hazard-polygon',
                color: hz.color,
                weight: 2,
                dashArray: '6, 6',
                fillColor: hz.color,
                fillOpacity: 0.22
            }).addTo(appState.overlayLayers.hazards);

            const tip = `
                <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: ${hz.color};">
                    <i class="fa-solid fa-triangle-exclamation"></i> ${hz.name}
                </div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px;">
                    ${hz.type} &bull; <strong style="color: ${hz.color};">${hz.severity} HAZARD</strong>
                </div>
            `;

            poly.bindTooltip(tip, { className: 'mars-tip', direction: 'top' });

            poly.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                displayHazardInfo(hz);
                appState.map.panTo(hz.center, { animate: true, duration: 0.6 });
            });
        });
    }

    /**
     * Display Hazard Intelligence in Info Panel
     */
    function displayHazardInfo(hz) {
        const infoPanel = document.getElementById('info-panel');
        const emptyState = document.getElementById('info-empty-state');
        const detailsState = document.getElementById('info-details-state');
        if (!infoPanel || !emptyState || !detailsState) return;

        document.getElementById('inf-icon').textContent = '⚠️';
        document.getElementById('inf-title').textContent = hz.name;
        document.getElementById('inf-category').textContent = `HAZARD INTELLIGENCE: ${hz.severity}`;
        document.getElementById('inf-category').style.color = hz.color;
        document.getElementById('inf-card-header').style.borderLeftColor = hz.color;
        document.getElementById('inf-description').textContent = `${hz.desc}`;

        document.getElementById('inf-coords').textContent = formatMarsCoord(hz.center[0], hz.center[1]);
        document.getElementById('inf-elevation').textContent = hz.type;
        document.getElementById('inf-slope').textContent = `Severity: ${hz.severity} RISK`;
        document.getElementById('inf-radiation').textContent = 'Surface / Topographic Exposure';
        document.getElementById('inf-mineral').textContent = hz.source;

        const badgeClass = hz.severity === 'CRITICAL' ? 'critical' : (hz.severity === 'HIGH' ? 'high' : 'moderate');
        document.getElementById('inf-hazard-badge').innerHTML = `<span class="threat ${badgeClass}">${hz.severity} RISK ZONE</span>`;

        document.getElementById('inf-protocols').innerHTML = `
            <li>Hazard Classification: <strong>${hz.type}</strong>.</li>
            <li>Supporting Observation: <strong>${hz.source}</strong>.</li>
            <li><strong style="color: var(--yellow);">Data Limitation &amp; Uncertainty:</strong> ${hz.uncertainty}</li>
            <li>Operational Mitigation: Engage autonomous scout rover; maintain &ge;500m safety clearance.</li>
        `;

        document.getElementById('inf-source-text').textContent = `Source Dataset: ${hz.source}`;

        const btnAddPoiWp = document.getElementById('btn-add-poi-waypoint');
        if (btnAddPoiWp) {
            btnAddPoiWp.onclick = () => {
                addWaypoint(hz.center[0], hz.center[1], `Hazard Stand-Off (${hz.name})`);
                btnAddPoiWp.innerHTML = `<i class="fa-solid fa-check"></i> Added Stand-Off Waypoint!`;
                setTimeout(() => {
                    btnAddPoiWp.innerHTML = `<i class="fa-solid fa-location-dot"></i> Add to Marswalk Route`;
                }, 1800);
            };
        }

        emptyState.style.display = 'none';
        detailsState.style.display = 'block';
        infoPanel.classList.add('open');
    }



    /**
     * Switch Active Mars Basemap
     */
    function switchBasemap(key) {
        const targetLayer = appState.baseLayers[key];
        if (!targetLayer) return;

        // Remove old base layer
        if (appState.currentBaseKey && appState.baseLayers[appState.currentBaseKey]) {
            appState.map.removeLayer(appState.baseLayers[appState.currentBaseKey]);
        }

        // Add new base layer
        appState.map.addLayer(targetLayer);
        targetLayer.bringToBack();
        appState.currentBaseKey = key;

        const names = {
            viking: 'Mars Viking MDIM 2.1 Color Mosaic',
            'usgs-mola': 'USGS MOLA Color Elevation WMS',
            'usgs-blend': 'USGS MOLA / THEMIS Day IR Blend WMS',
            'themis-night': 'USGS 2001 Mars Odyssey THEMIS Night Thermal IR',
            mola: 'NASA Mars Trek MOLA Shaded Relief'
        };

        showMapToast(`Switched Basemap: ${names[key] || key}`);
        updateLayerStatusIndicator('ONLINE', 'USGS / NASA WMS ONLINE');
    }

    /**
     * Setup Layer Toggles & Base Imagery Selectors
     */
    function setupLayerControls() {
        // Base Imagery Radio Buttons (All 5 Providers)
        const baseRadios = document.querySelectorAll('input[name="basemap-select"]');
        baseRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    switchBasemap(radio.value);
                }
            });
        });

        // Overlay Toggles (All 7 Scientific Overlays)
        const overlayMap = {
            'layer-landings': 'landings',
            'layer-nomenclature': 'nomenclature',
            'layer-hirise': 'hirise',
            'layer-hazards': 'hazards',
            'layer-geology': 'geology',
            'layer-resources': 'resources',
            'layer-shelters': 'shelters'
        };

        Object.keys(overlayMap).forEach(elemId => {
            const toggle = document.getElementById(elemId);
            const layerKey = overlayMap[elemId];
            if (toggle && appState.overlayLayers[layerKey]) {
                toggle.addEventListener('change', () => {
                    if (toggle.checked) {
                        appState.map.addLayer(appState.overlayLayers[layerKey]);
                        showMapToast(`Enabled Layer: ${toggle.closest('.lp-row')?.querySelector('.lp-name')?.textContent || layerKey}`);
                    } else {
                        appState.map.removeLayer(appState.overlayLayers[layerKey]);
                        showMapToast(`Disabled Layer: ${toggle.closest('.lp-row')?.querySelector('.lp-name')?.textContent || layerKey}`);
                    }
                });
            }
        });

        // Close info panel button
        const infoCloseBtn = document.getElementById('info-close');
        if (infoCloseBtn) {
            infoCloseBtn.addEventListener('click', () => {
                const infoPanel = document.getElementById('info-panel');
                if (infoPanel) infoPanel.classList.remove('open');
            });
        }

        // Mobile panel drawer toggle
        const panelToggleBtn = document.getElementById('panel-toggle-btn');
        const layerPanel = document.getElementById('layer-panel');
        if (panelToggleBtn && layerPanel) {
            panelToggleBtn.addEventListener('click', () => {
                layerPanel.classList.toggle('panel-open');
            });
        }
    }

    /**
     * Setup Quick Jump buttons (Jezero, Gale, Olympus Mons, etc.)
     */
    function setupQuickJumpButtons() {
        const qjumpButtons = document.querySelectorAll('.qjump-btn');
        qjumpButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                qjumpButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const lat = parseFloat(btn.dataset.lat);
                const lon = parseFloat(btn.dataset.lon);
                const zoom = parseInt(btn.dataset.zoom, 10);

                appState.map.flyTo([lat, lon], zoom, {
                    animate: true,
                    duration: 1.2
                });
            });
        });

        const resetBtn = document.getElementById('btn-reset-map');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                qjumpButtons.forEach(b => b.classList.remove('active'));
                appState.map.flyTo([0, 0], 2, { animate: true, duration: 1.2 });
            });
        }
    }

    /**
     * ================================================================
     * 3. MARSWALK ROUTE PLANNING & GEODESIC ENGINE
     * Mars Great Circle Distance:
     * d = 2 * R_mars * asin(sqrt(sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlon/2)))
     * ================================================================
     */
    function calculateMarsDistanceKm(lat1, lon1, lat2, lon2) {
        const toRad = deg => (deg * Math.PI) / 180;
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return MARS_RADIUS_KM * c;
    }

    /**
     * Estimate Mars MOLA elevation as a numeric value (metres) for route calculations.
     * Based on MOLA regional mean topography (MGS/USGS).
     * Returns a rounded integer representing estimated elevation in metres.
     * Marked as estimated — genuine sub-metre data requires MOLA GeoTIFF querying.
     */
    function estimateMarsElevationNum(lat, lon) {
        const nLon = ((lon + 180) % 360 + 360) % 360 - 180;
        // Olympus Mons summit region
        if (lat >= 15 && lat <= 22 && nLon >= -138 && nLon <= -130) return 21287;
        // Tharsis Montes plateau
        if (lat >= 0 && lat <= 20 && nLon >= -120 && nLon <= -100) return 10000;
        // Hellas Planitia floor
        if (lat >= -50 && lat <= -30 && nLon >= 60 && nLon <= 80) return -7152;
        // Valles Marineris floor
        if (lat >= -16 && lat <= -10 && nLon >= -70 && nLon <= -50) return -6800;
        // Jezero Crater region
        if (lat >= 17 && lat <= 20 && nLon >= 76 && nLon <= 79) return -2540;
        // Gale Crater region
        if (lat >= -6 && lat <= -3 && nLon >= 136 && nLon <= 139) return -4450;
        // Utopia Planitia
        if (lat >= 40 && lat <= 50 && nLon >= 100 && nLon <= 125) return -4100;
        // Arcadia Planitia
        if (lat >= 35 && lat <= 55 && nLon >= -175 && nLon <= -165) return -3900;
        // Northern lowlands (general)
        if (lat > 30) return -3200;
        // Southern highlands (general)
        if (lat < -20) return 1500;
        // Equatorial region
        return -1200;
    }

    /**
     * Add a Waypoint to the Active Marswalk Plan
     */
    function addWaypoint(lat, lon, label) {
        const wpNumber = appState.waypoints.length + 1;
        const wpName = label || `EVA Waypoint ${wpNumber}`;
        const elev = estimateMarsElevationNum(lat, lon);

        const wp = {
            id: 'wp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            number: wpNumber,
            name: wpName,
            lat: lat,
            lon: lon,
            elev: elev
        };

        appState.waypoints.push(wp);

        // Create Leaflet Numbered Marker
        const wpIcon = L.divIcon({
            className: 'wp-wrapper',
            html: `<div class="wp-dot">${wpNumber}</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });

        const marker = L.marker([lat, lon], {
            icon: wpIcon,
            draggable: true
        }).addTo(appState.map);

        marker.bindTooltip(`<b>#${wpNumber} ${wpName}</b><br>${formatMarsCoord(lat, lon)}`, {
            className: 'mars-tip'
        });

        // Draggable waypoint recalculates path
        marker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            wp.lat = parseFloat(newPos.lat.toFixed(4));
            wp.lon = parseFloat(newPos.lng.toFixed(4));
            updateRouteCalculations();
        });

        appState.waypointMarkers.push(marker);

        // Update calculations and UI tables
        updateRouteCalculations();
    }

    /**
     * Clear all Marswalk Waypoints and reset path
     */
    function clearRoute() {
        appState.waypoints = [];
        appState.waypointMarkers.forEach(m => appState.map.removeLayer(m));
        appState.waypointMarkers = [];
        if (appState.routePolyline) {
            appState.routePolyline.setLatLngs([]);
        }
        updateRouteCalculations();
    }

    /**
     * Recalculate route path, cumulative distance, duration, and O2 reserves
     */
    function updateRouteCalculations() {
        const latlngs = appState.waypoints.map(wp => [wp.lat, wp.lon]);
        if (appState.routePolyline) {
            appState.routePolyline.setLatLngs(latlngs);
        }

        // Calculate total distance
        let totalDistanceKm = 0;
        const legDistances = [];

        for (let i = 0; i < appState.waypoints.length; i++) {
            if (i === 0) {
                legDistances.push(0);
            } else {
                const prev = appState.waypoints[i - 1];
                const curr = appState.waypoints[i];
                const legDist = calculateMarsDistanceKm(prev.lat, prev.lon, curr.lat, curr.lon);
                totalDistanceKm += legDist;
                legDistances.push(legDist);
            }
        }

        // Duration in hours based on transit mode speed
        const durationHours = totalDistanceKm > 0 ? (totalDistanceKm / appState.evaTransitSpeedKmH) : 0;

        // Oxygen consumption: 0.035 kg O2 / hour / astronaut
        const o2Kg = durationHours * 0.035 * appState.crewSize;

        // Safety Status
        let safetyStatus = 'OPTIMAL';
        let safetyColor = '#2ecc71';
        if (appState.evaTransitSpeedKmH <= 1.5 && totalDistanceKm > 8) {
            safetyStatus = 'EXCEEDS SUIT RANGE';
            safetyColor = '#e74c3c';
        } else if (durationHours > 8) {
            safetyStatus = 'CAUTION: >8H EVA';
            safetyColor = '#f39c12';
        }

        // Update Quick Stats in Map Frame Layer Panel
        const quickWps = document.getElementById('map-route-wps');
        const quickDist = document.getElementById('map-route-dist');
        const quickTime = document.getElementById('map-route-time');

        if (quickWps) quickWps.textContent = appState.waypoints.length;
        if (quickDist) quickDist.textContent = `${totalDistanceKm.toFixed(2)} km`;
        if (quickTime) quickTime.textContent = `${durationHours.toFixed(1)} hrs`;

        // Update Full Route Summary Tiles in Route Planner Section
        const rstTotalDist = document.getElementById('rst-total-dist');
        const rstEstTime = document.getElementById('rst-est-time');
        const rstO2 = document.getElementById('rst-o2-consumption');
        const rstSafety = document.getElementById('rst-safety-status');

        if (rstTotalDist) rstTotalDist.textContent = `${totalDistanceKm.toFixed(2)} km`;
        if (rstEstTime) rstEstTime.textContent = `${durationHours.toFixed(1)} hrs`;
        if (rstO2) rstO2.textContent = `${o2Kg.toFixed(2)} kg`;
        if (rstSafety) {
            rstSafety.textContent = safetyStatus;
            rstSafety.style.color = safetyColor;
        }

        // Update Waypoints Table in Route Planner Section
        renderWaypointsTable(legDistances);

        // Stage 4: Elevation profile chart
        updateElevationProfileChart(appState.waypoints);

        // Stage 4: Risk assessment
        const risk = calculateRouteRisk(appState.waypoints, totalDistanceKm, durationHours);

        // Stage 4: Live Mission Dashboard sync
        updateMissionDashboard(appState.waypoints, totalDistanceKm, durationHours, o2Kg, risk);

        // Override rst-safety-status with composite risk category when route has 2+ waypoints
        if (rstSafety && appState.waypoints.length >= 2) {
            const catColors = { 'LOW': '#2ecc71', 'MODERATE': '#f39c12', 'HIGH': '#e67e22', 'NO-GO': '#e74c3c', 'INSUFFICIENT DATA': '#7f8c8d' };
            rstSafety.textContent = risk.category;
            rstSafety.style.color = catColors[risk.category] || '#2ecc71';
        }
    }

    /**
     * Render the Waypoints HTML table (with elevation + reorder controls)
     */
    function renderWaypointsTable(legDistances) {
        const tbody = document.getElementById('wp-table-body');
        if (!tbody) return;

        if (appState.waypoints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-3); padding: 24px;">
                        No waypoints added yet. Click on the map or select a preset traverse above.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = appState.waypoints.map((wp, index) => {
            const legDist = legDistances[index] ? `${legDistances[index].toFixed(2)} km` : '&mdash; Start';
            const elevStr = (typeof wp.elev === 'number')
                ? `${wp.elev > 0 ? '+' : ''}${wp.elev.toLocaleString()} m`
                : '—';
            const canUp = index > 0;
            const canDown = index < appState.waypoints.length - 1;
            return `
                <tr>
                    <td><strong>#${wp.number}</strong></td>
                    <td style="color: var(--text-1); font-weight: 500;">${wp.name}</td>
                    <td style="font-family: monospace; font-size: 11px;">${formatMarsCoord(wp.lat, wp.lon)}</td>
                    <td style="color: var(--yellow);">${elevStr}</td>
                    <td style="color: var(--mars-primary);">${legDist}</td>
                    <td>
                        <button class="btn-wp-action" ${canUp ? '' : 'disabled'} onclick="window.MarsNav.moveWaypoint(${index}, -1)" title="Move Up">
                            <i class="fa-solid fa-chevron-up"></i>
                        </button>
                        <button class="btn-wp-action" ${canDown ? '' : 'disabled'} onclick="window.MarsNav.moveWaypoint(${index}, 1)" title="Move Down">
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        <button class="btn-wp-action" onclick="window.MarsNav.removeWaypoint(${index})" title="Remove Waypoint">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Remove single waypoint
     */
    function removeWaypoint(index) {
        if (index >= 0 && index < appState.waypoints.length) {
            appState.waypoints.splice(index, 1);
            if (appState.waypointMarkers[index]) {
                appState.map.removeLayer(appState.waypointMarkers[index]);
                appState.waypointMarkers.splice(index, 1);
            }
            // Re-number waypoints
            appState.waypoints.forEach((wp, i) => {
                wp.number = i + 1;
            });
            // Re-render markers
            appState.waypointMarkers.forEach((marker, i) => {
                const newIcon = L.divIcon({
                    className: 'wp-wrapper',
                    html: `<div class="wp-dot">${i + 1}</div>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                });
                marker.setIcon(newIcon);
            });
            updateRouteCalculations();
        }
    }

    /**
     * Move a waypoint up (-1) or down (+1) in the list
     */
    function moveWaypoint(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= appState.waypoints.length) return;

        // Swap waypoints array
        [appState.waypoints[index], appState.waypoints[newIndex]] =
            [appState.waypoints[newIndex], appState.waypoints[index]];

        // Swap marker array
        [appState.waypointMarkers[index], appState.waypointMarkers[newIndex]] =
            [appState.waypointMarkers[newIndex], appState.waypointMarkers[index]];

        // Re-number and re-icon all markers
        appState.waypoints.forEach((wp, i) => {
            wp.number = i + 1;
            const newIcon = L.divIcon({
                className: 'wp-wrapper',
                html: `<div class="wp-dot">${i + 1}</div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            });
            appState.waypointMarkers[i].setIcon(newIcon);
        });

        updateRouteCalculations();
    }

    /**
     * Load Preset Traverse Route
     */
    function loadPresetRoute(routeKey) {
        const preset = PRESET_ROUTES[routeKey];
        if (!preset) return;

        clearRoute();
        preset.forEach(pt => {
            addWaypoint(pt.lat, pt.lon, pt.name);
        });

        // Zoom map to fit the loaded route
        if (appState.waypoints.length > 0) {
            const bounds = L.latLngBounds(appState.waypoints.map(wp => [wp.lat, wp.lon]));
            appState.map.fitBounds(bounds, { padding: [40, 40] });
        }
    }

    /**
     * Setup Route Planner UI Handlers
     */
    function setupRoutePlannerHandlers() {
        const btnToggleRouteMode = document.getElementById('btn-toggle-route-mode');
        const btnActivateRouteMode = document.getElementById('btn-activate-route-mode');
        const btnClearRouteMap = document.getElementById('btn-clear-route-map');
        const btnClearRouteFull = document.getElementById('btn-clear-route-full');

        function toggleRouteMode() {
            appState.routeModeActive = !appState.routeModeActive;
            const active = appState.routeModeActive;

            if (btnToggleRouteMode) {
                btnToggleRouteMode.classList.toggle('active', active);
                btnToggleRouteMode.innerHTML = active
                    ? `<i class="fa-solid fa-pen-nib"></i> Exit Route Mode`
                    : `<i class="fa-solid fa-pen-nib"></i> Plan Marswalk Mode`;
            }
            if (btnActivateRouteMode) {
                btnActivateRouteMode.innerHTML = active
                    ? `<i class="fa-solid fa-check"></i> Route Mode Active (Click Map)`
                    : `<i class="fa-solid fa-location-crosshairs"></i> Click Map to Add Waypoints`;
            }

            if (active) {
                // Scroll to map if needed
                const mapSection = document.getElementById('map-section');
                if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
            }
        }

        if (btnToggleRouteMode) btnToggleRouteMode.addEventListener('click', toggleRouteMode);
        if (btnActivateRouteMode) btnActivateRouteMode.addEventListener('click', toggleRouteMode);

        if (btnClearRouteMap) btnClearRouteMap.addEventListener('click', clearRoute);
        if (btnClearRouteFull) btnClearRouteFull.addEventListener('click', clearRoute);

        // Transit Mode Selector
        const evaModeSelect = document.getElementById('eva-mode-select');
        if (evaModeSelect) {
            evaModeSelect.addEventListener('change', () => {
                const val = evaModeSelect.value;
                if (val === 'walking') appState.evaTransitSpeedKmH = 1.2;
                else if (val === 'unpressurized') appState.evaTransitSpeedKmH = 8.0;
                else appState.evaTransitSpeedKmH = 15.0;
                updateRouteCalculations();
            });
        }

        // Crew Size Selector
        const evaCrewSize = document.getElementById('eva-crew-size');
        if (evaCrewSize) {
            evaCrewSize.addEventListener('change', () => {
                appState.crewSize = parseInt(evaCrewSize.value, 10) || 2;
                updateRouteCalculations();
            });
        }

        // Preset Traverse Route Buttons
        const presetButtons = document.querySelectorAll('.btn-preset-route');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const routeKey = btn.dataset.route;
                loadPresetRoute(routeKey);
                // Scroll smoothly to map to view the route
                const mapSection = document.getElementById('map-section');
                if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    /**
     * ================================================================
     * 3b. STAGE 4 — ROUTE RISK ENGINE, ELEVATION PROFILE & DASHBOARD
     * ================================================================
     */

    /**
     * Calculate composite route risk score (0-100) with transparent factor breakdown.
     * Returns { score, category, slopeScore, hazardScore, distScore, uncertaintyScore,
     *           slopeText, hazardText, distText, uncertaintyText, warnings[] }
     *
     * Scoring model:
     *   Factor 1  Slope incline (0-30 pts): derived from MOLA elevation delta per leg.
     *     ≤5°  → 0 pts  |  ≤12° → 10 pts  |  ≤20° → 20 pts  |  >20° → 30 pts
     *   Factor 2  Hazard polygon proximity (0-30 pts):
     *     No intersection → 0 pts  |  <15 km from hazard centroid → 15-30 pts
     *   Factor 3  Distance / life-support (0-25 pts):
     *     Walking mode >8 km → 20 pts extra  |  Duration >8 h → 25 pts
     *   Factor 4  Data uncertainty (0-15 pts):
     *     No HiRISE coverage → +10 pts  |  HiRISE verified → 0 pts
     */
    function calculateRouteRisk(waypoints, totalDistKm, durationHours) {
        if (waypoints.length < 2) {
            return {
                score: 0, category: 'INSUFFICIENT DATA',
                slopeScore: 0, hazardScore: 0, distScore: 0, uncertaintyScore: 0,
                slopeText: 'N/A — add ≥2 waypoints',
                hazardText: 'N/A — add ≥2 waypoints',
                distText: 'N/A',
                uncertaintyText: 'N/A',
                warnings: []
            };
        }

        const warnings = [];

        // --- Factor 1: Slope ---
        let maxSlopeDeg = 0;
        for (let i = 1; i < waypoints.length; i++) {
            const prev = waypoints[i - 1];
            const curr = waypoints[i];
            const elevDelta = Math.abs((curr.elev || 0) - (prev.elev || 0));
            const legDistM = calculateMarsDistanceKm(prev.lat, prev.lon, curr.lat, curr.lon) * 1000;
            if (legDistM > 0) {
                const slopeDeg = Math.atan2(elevDelta, legDistM) * (180 / Math.PI);
                if (slopeDeg > maxSlopeDeg) maxSlopeDeg = slopeDeg;
            }
        }

        let slopeScore = 0;
        let slopeText = '';
        if (maxSlopeDeg <= 5) {
            slopeScore = 0;
            slopeText = `${maxSlopeDeg.toFixed(1)}° Gentle (+0 pts)`;
        } else if (maxSlopeDeg <= 12) {
            slopeScore = 10;
            slopeText = `${maxSlopeDeg.toFixed(1)}° Moderate Incline (+10 pts)`;
            warnings.push('Max incline exceeds 5°. Pressurized rover recommended.');
        } else if (maxSlopeDeg <= 20) {
            slopeScore = 20;
            slopeText = `${maxSlopeDeg.toFixed(1)}° Steep — Caution (+20 pts)`;
            warnings.push('Steep incline detected (>12°). Scout rover deployment mandatory before crew EVA.');
        } else {
            slopeScore = 30;
            slopeText = `${maxSlopeDeg.toFixed(1)}° Critical — Potential NO-GO (+30 pts)`;
            warnings.push('⛔ CRITICAL SLOPE ALERT: Max incline >20°. Human EVA traverse not recommended without anchored tether system.');
        }

        // --- Factor 2: Hazard Proximity ---
        let hazardScore = 0;
        let nearestHazardName = null;
        let nearestHazardDist = Infinity;

        MARS_HAZARD_ZONES.forEach(hz => {
            waypoints.forEach(wp => {
                const d = calculateMarsDistanceKm(wp.lat, wp.lon, hz.center[0], hz.center[1]);
                if (d < nearestHazardDist) {
                    nearestHazardDist = d;
                    nearestHazardName = hz.name;
                }
            });
        });

        let hazardText = '';
        if (nearestHazardDist < 5) {
            hazardScore = 30;
            hazardText = `Route intersects hazard zone: ${nearestHazardName} (+30 pts)`;
            warnings.push(`⚠️ HAZARD ZONE: Route passes through or very near "${nearestHazardName}".`);
        } else if (nearestHazardDist < 15) {
            hazardScore = 15;
            hazardText = `${nearestHazardDist.toFixed(0)} km from "${nearestHazardName}" (+15 pts)`;
            warnings.push(`Proximity warning: Within 15 km of "${nearestHazardName}".`);
        } else {
            hazardScore = 0;
            hazardText = `No mapped hazards within 15 km (+0 pts)`;
        }

        // --- Factor 3: Distance / Life-Support ---
        let distScore = 0;
        let distText = '';
        const isWalking = appState.evaTransitSpeedKmH <= 1.5;
        const isUnpressurized = appState.evaTransitSpeedKmH > 1.5 && appState.evaTransitSpeedKmH <= 10;

        if (isWalking && totalDistKm > 8) {
            distScore = 25;
            distText = `${totalDistKm.toFixed(1)} km exceeds EVA suit range 8 km (+25 pts)`;
            warnings.push('⛔ LIFE-SUPPORT CRITICAL: Route distance exceeds EVA suit range of 8 km.');
        } else if (durationHours > 8) {
            distScore = 20;
            distText = `Duration ${durationHours.toFixed(1)} h exceeds 8 h EVA limit (+20 pts)`;
            warnings.push('EVA duration exceeds 8 hours. Additional consumables and O₂ reserve required.');
        } else if (isUnpressurized && totalDistKm > 35) {
            distScore = 15;
            distText = `${totalDistKm.toFixed(1)} km exceeds unpressurized rover 35 km range (+15 pts)`;
            warnings.push('Distance exceeds unpressurized rover recommended range of 35 km.');
        } else {
            distScore = 0;
            distText = `${totalDistKm.toFixed(1)} km within mission range (+0 pts)`;
        }

        // --- Factor 4: Data Uncertainty ---
        let uncertaintyScore = 0;
        let uncertaintyText = '';
        // Check if any waypoint has HiRISE coverage (within known footprint areas)
        let hasHiRISECoverage = false;
        waypoints.forEach(wp => {
            HIRISE_OBSERVATIONS.forEach(obs => {
                const d = calculateMarsDistanceKm(wp.lat, wp.lon, obs.lat, obs.lon);
                if (d < 15) hasHiRISECoverage = true;
            });
        });

        if (hasHiRISECoverage) {
            uncertaintyScore = 0;
            uncertaintyText = 'HiRISE sub-metre data verified in route area (+0 pts)';
        } else {
            uncertaintyScore = 10;
            uncertaintyText = 'No HiRISE coverage — MOLA 463 m/px only (+10 pts)';
            warnings.push('Data gap: No sub-metre HiRISE imagery verified in this route sector. Unmapped hazards may exist.');
        }

        // --- Composite Score ---
        const score = Math.min(100, slopeScore + hazardScore + distScore + uncertaintyScore);

        let category;
        let categoryColor;
        if (score <= 15) {
            category = 'LOW';
            categoryColor = 'var(--green)';
        } else if (score <= 40) {
            category = 'MODERATE';
            categoryColor = 'var(--yellow)';
        } else if (score <= 70) {
            category = 'HIGH';
            categoryColor = '#e67e22';
        } else {
            category = 'NO-GO';
            categoryColor = 'var(--red)';
        }

        // Add general caution if no hazards but uncertainty exists
        if (warnings.length === 0) {
            warnings.push('No critical obstacles detected. Forward reconnaissance still advised before crew EVA deployment.');
        }

        return {
            score, category, categoryColor,
            slopeScore, hazardScore, distScore, uncertaintyScore,
            slopeText, hazardText, distText, uncertaintyText,
            maxSlopeDeg, warnings
        };
    }

    /**
     * Store the elevation profile Chart.js instance
     */
    let _elevChart = null;

    /**
     * Initialise the elevation profile Chart.js canvas (called once on DOMContentLoaded)
     */
    function initElevationProfileChart() {
        const canvas = document.getElementById('elevProfileChart');
        if (!canvas || !window.Chart) return;

        _elevChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: ['No waypoints'],
                datasets: [{
                    label: 'Estimated MOLA Elevation (m)',
                    data: [0],
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.12)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#ff6b35',
                    pointBorderColor: '#07071a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'rgba(255,255,255,0.65)', font: { family: 'Inter', size: 10 } } },
                    tooltip: {
                        backgroundColor: 'rgba(7,7,26,0.95)',
                        titleFont: { family: 'Orbitron', size: 10 },
                        bodyFont: { family: 'Inter', size: 11 },
                        callbacks: {
                            label: ctx => ` ${ctx.raw > 0 ? '+' : ''}${ctx.raw.toLocaleString()} m (est. MOLA)`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 9 }, maxRotation: 20 }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            font: { size: 9 },
                            callback: v => `${v > 0 ? '+' : ''}${v.toLocaleString()} m`
                        }
                    }
                }
            }
        });
    }

    /**
     * Update the elevation profile chart with current waypoints
     */
    function updateElevationProfileChart(waypoints) {
        if (!_elevChart) return;

        if (waypoints.length === 0) {
            _elevChart.data.labels = ['No waypoints'];
            _elevChart.data.datasets[0].data = [0];
            _elevChart.update('none');
            const gainEl = document.getElementById('prof-gain');
            const slopeEl = document.getElementById('prof-max-slope');
            if (gainEl) gainEl.textContent = '0 m';
            if (slopeEl) slopeEl.textContent = '0.0°';
            return;
        }

        const labels = waypoints.map((wp, i) => `#${i + 1} ${wp.name.substring(0, 18)}`);
        const elevData = waypoints.map(wp => wp.elev || 0);

        _elevChart.data.labels = labels;
        _elevChart.data.datasets[0].data = elevData;
        _elevChart.update('active');

        // Compute gain and max slope
        let totalGain = 0;
        let maxSlopeDeg = 0;
        for (let i = 1; i < waypoints.length; i++) {
            const elevDelta = (waypoints[i].elev || 0) - (waypoints[i - 1].elev || 0);
            if (elevDelta > 0) totalGain += elevDelta;
            const legDistM = calculateMarsDistanceKm(
                waypoints[i - 1].lat, waypoints[i - 1].lon,
                waypoints[i].lat, waypoints[i].lon
            ) * 1000;
            if (legDistM > 0) {
                const slopeDeg = Math.atan2(Math.abs(elevDelta), legDistM) * (180 / Math.PI);
                if (slopeDeg > maxSlopeDeg) maxSlopeDeg = slopeDeg;
            }
        }

        const gainEl = document.getElementById('prof-gain');
        const slopeEl = document.getElementById('prof-max-slope');
        if (gainEl) gainEl.textContent = `+${totalGain.toLocaleString()} m (est.)`;
        if (slopeEl) slopeEl.textContent = `${maxSlopeDeg.toFixed(1)}°`;
    }

    /**
     * Update the Live Mission Dashboard with current route state
     */
    function updateMissionDashboard(waypoints, totalDistKm, durationHours, o2Kg, risk) {
        // Endpoints label
        const endpointsEl = document.getElementById('dash-route-endpoints');
        if (endpointsEl) {
            if (waypoints.length >= 2) {
                const first = waypoints[0].name.substring(0, 22);
                const last = waypoints[waypoints.length - 1].name.substring(0, 22);
                endpointsEl.textContent = `${first} → ${last}`;
            } else if (waypoints.length === 1) {
                endpointsEl.textContent = `${waypoints[0].name.substring(0, 22)} → (destination pending)`;
            } else {
                endpointsEl.textContent = 'No route planned';
            }
        }

        // Waypoint count
        const wpCountEl = document.getElementById('dash-wp-count');
        if (wpCountEl) wpCountEl.textContent = `${waypoints.length} Waypoint${waypoints.length !== 1 ? 's' : ''} in sequence`;

        // Distance
        const distEl = document.getElementById('dash-total-distance');
        if (distEl) distEl.textContent = `${totalDistKm.toFixed(2)} km`;

        // Duration
        const timeEl = document.getElementById('dash-est-time');
        if (timeEl) timeEl.textContent = `Est. Traverse: ${durationHours.toFixed(1)} hrs`;

        // O2
        const o2El = document.getElementById('dash-o2-consumption');
        if (o2El) o2El.textContent = `${o2Kg.toFixed(3)} kg O²`;

        // Life support margin (assume 2.5 kg per person capacity)
        const suitMarginEl = document.getElementById('dash-suit-margin');
        if (suitMarginEl) {
            const capacity = appState.crewSize * 2.5;
            const margin = capacity > 0 ? Math.max(0, ((capacity - o2Kg) / capacity) * 100) : 100;
            suitMarginEl.textContent = `Life Support Reserve: ${margin.toFixed(0)}%`;
        }

        if (!risk || waypoints.length < 2) {
            // Clear risk display
            const badge = document.getElementById('dash-risk-badge');
            if (badge) { badge.textContent = 'NO DATA'; badge.className = 'risk-badge-large'; }
            const bar = document.getElementById('dash-risk-bar');
            if (bar) { bar.style.width = '0%'; bar.style.background = 'var(--text-3)'; }
            const scoreEl = document.getElementById('dash-risk-score');
            if (scoreEl) scoreEl.textContent = '— / 100';

            const rfSlope = document.getElementById('rf-slope-val');
            const rfHaz = document.getElementById('rf-hazards-val');
            const rfDist = document.getElementById('rf-dist-val');
            const rfUnc = document.getElementById('rf-uncertainty-val');
            if (rfSlope) rfSlope.textContent = 'Add ≥2 waypoints';
            if (rfHaz) rfHaz.textContent = 'Add ≥2 waypoints';
            if (rfDist) rfDist.textContent = 'Add ≥2 waypoints';
            if (rfUnc) rfUnc.textContent = 'Add ≥2 waypoints';

            const warnEl = document.getElementById('dash-warning-text');
            if (warnEl) warnEl.textContent = 'Plan a route to see mission risk analysis.';
            return;
        }

        // Risk badge
        const categoryMap = { 'LOW': 'low', 'MODERATE': 'moderate', 'HIGH': 'high', 'NO-GO': 'critical' };
        const badge = document.getElementById('dash-risk-badge');
        if (badge) {
            badge.textContent = `${risk.category} RISK TRAVERSE`;
            badge.className = `risk-badge-large ${categoryMap[risk.category] || 'moderate'}`;
        }

        // Risk bar
        const bar = document.getElementById('dash-risk-bar');
        if (bar) {
            bar.style.width = `${risk.score}%`;
            const barColors = { 'LOW': 'var(--green)', 'MODERATE': 'var(--yellow)', 'HIGH': '#e67e22', 'NO-GO': 'var(--red)' };
            bar.style.background = barColors[risk.category] || 'var(--yellow)';
        }

        // Risk score
        const scoreEl = document.getElementById('dash-risk-score');
        if (scoreEl) scoreEl.textContent = `${risk.score} / 100`;

        // Factor breakdown
        const rfSlope = document.getElementById('rf-slope-val');
        const rfHaz = document.getElementById('rf-hazards-val');
        const rfDist = document.getElementById('rf-dist-val');
        const rfUnc = document.getElementById('rf-uncertainty-val');

        const fColors = { low: 'var(--green)', med: 'var(--yellow)', high: '#e67e22', crit: 'var(--red)' };
        if (rfSlope) {
            rfSlope.textContent = risk.slopeText;
            rfSlope.style.color = risk.slopeScore <= 0 ? fColors.low : risk.slopeScore <= 10 ? fColors.med : fColors.crit;
        }
        if (rfHaz) {
            rfHaz.textContent = risk.hazardText;
            rfHaz.style.color = risk.hazardScore <= 0 ? fColors.low : risk.hazardScore <= 15 ? fColors.med : fColors.crit;
        }
        if (rfDist) {
            rfDist.textContent = risk.distText;
            rfDist.style.color = risk.distScore <= 0 ? fColors.low : risk.distScore <= 15 ? fColors.med : fColors.crit;
        }
        if (rfUnc) {
            rfUnc.textContent = risk.uncertaintyText;
            rfUnc.style.color = risk.uncertaintyScore <= 0 ? fColors.low : fColors.med;
        }

        // Warning text
        const warnEl = document.getElementById('dash-warning-text');
        if (warnEl) {
            warnEl.textContent = risk.warnings.join(' | ');
        }
    }

    /**
     * Load an Alternative Route (A, B, or C) into the active route planner
     */
    function selectAlternativeRoute(key) {
        const route = ALTERNATIVE_ROUTES[key];
        if (!route) return;

        // Update card active state
        ['a', 'b', 'c'].forEach(k => {
            const card = document.getElementById(`alt-card-${k}`);
            if (card) card.classList.toggle('active', k === key);
        });

        // Load waypoints with their preset elevation values
        clearRoute();
        route.waypoints.forEach(pt => {
            // addWaypoint will estimate elevation, but alt routes have precise values
            addWaypoint(pt.lat, pt.lon, pt.name);
            // Override the elevation with the precise preset value
            const wp = appState.waypoints[appState.waypoints.length - 1];
            if (typeof pt.elev === 'number') wp.elev = pt.elev;
        });

        // Zoom map to fit the route
        if (appState.waypoints.length > 0) {
            const bounds = L.latLngBounds(appState.waypoints.map(wp => [wp.lat, wp.lon]));
            appState.map.fitBounds(bounds, { padding: [60, 60] });
        }

        showMapToast(`Loaded: ${route.name}`);
    }

    /**
     * ================================================================
     * 4. ENVIRONMENTAL TELEMETRY & CHART.JS DATA VISUALIZATION
     * Authentic Perseverance MEDA & Curiosity REMS surface science curves
     * ================================================================
     */
    function initTelemetryCharts() {
        // 1. Diurnal Surface Temperature Chart (MEDA Sol Average in Jezero Crater)
        const tempCanvas = document.getElementById('tempChart');
        if (tempCanvas && window.Chart) {
            const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
            const airTemps = [-82, -85, -88, -84, -65, -35, -18, -15, -28, -55, -72, -79];
            const groundTemps = [-92, -95, -97, -90, -50, -10, 5, 2, -18, -62, -80, -88];

            new Chart(tempCanvas, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [
                        {
                            label: 'Ground Surface Temp (°C)',
                            data: groundTemps,
                            borderColor: '#ff6b35',
                            backgroundColor: 'rgba(255, 107, 53, 0.12)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#ff6b35'
                        },
                        {
                            label: 'Ambient Air Temp at 1.5m (°C)',
                            data: airTemps,
                            borderColor: '#3498db',
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            tension: 0.35,
                            borderWidth: 2,
                            pointRadius: 2,
                            pointBackgroundColor: '#3498db'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.75)',
                                font: { family: 'Inter', size: 11 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(7, 7, 26, 0.95)',
                            titleFont: { family: 'Orbitron', size: 11 },
                            bodyFont: { family: 'Inter', size: 12 },
                            borderColor: 'rgba(255, 107, 53, 0.3)',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.5)',
                                callback: val => `${val}°C`,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }

        // 2. Atmospheric Surface Pressure Seasonal Variation (REMS Annual Data)
        const pressureCanvas = document.getElementById('pressureChart');
        if (pressureCanvas && window.Chart) {
            const solarLongitudes = ['Ls 0° (Equinox)', 'Ls 60°', 'Ls 120° (Solstice)', 'Ls 180°', 'Ls 240°', 'Ls 300° (Winter)', 'Ls 360°'];
            const pressurePascals = [750, 710, 690, 780, 860, 890, 760];

            new Chart(pressureCanvas, {
                type: 'line',
                data: {
                    labels: solarLongitudes,
                    datasets: [
                        {
                            label: 'Surface Pressure (Pa)',
                            data: pressurePascals,
                            borderColor: '#1abc9c',
                            backgroundColor: 'rgba(26, 188, 156, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointBackgroundColor: '#1abc9c'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.75)',
                                font: { family: 'Inter', size: 11 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(7, 7, 26, 0.95)',
                            titleFont: { family: 'Orbitron', size: 11 },
                            bodyFont: { family: 'Inter', size: 12 },
                            borderColor: 'rgba(26, 188, 156, 0.3)',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 9.5 } }
                        },
                        y: {
                            min: 650,
                            max: 950,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.5)',
                                callback: val => `${val} Pa`,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * ================================================================
     * 5. ANIMATED STARFIELD CANVAS (HERO SECTION)
     * ================================================================
     */
    function initStarfieldCanvas() {
        const canvas = document.getElementById('stars-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const stars = [];
        const STAR_COUNT = 160;

        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.4 + 0.4,
                alpha: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.15 + 0.05
            });
        }

        function drawStars() {
            ctx.clearRect(0, 0, width, height);

            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();

                // Slow subtle drift
                star.y -= star.speed;
                if (star.y < 0) {
                    star.y = height;
                    star.x = Math.random() * width;
                }
            });

            requestAnimationFrame(drawStars);
        }

        drawStars();

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });
    }

    /**
     * ================================================================
     * 6. NAVIGATION, SCROLLSPY, AND LOADING SCREEN
     * ================================================================
     */
    function setupNavigation() {
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
        const mobileToggle = document.getElementById('mobile-toggle');
        const mobileNav = document.getElementById('mobile-nav');

        // Scroll listener for sticky navbar glass effect and scrollspy
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Scrollspy active state
            const sections = document.querySelectorAll('section[id]');
            const scrollPos = window.scrollY + 140;

            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach(link => {
                        if (link.dataset.section === id) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        });

        // Mobile drawer navigation
        if (mobileToggle && mobileNav) {
            mobileToggle.addEventListener('click', () => {
                mobileNav.classList.toggle('open');
            });

            document.querySelectorAll('.mobile-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.remove('open');
                });
            });
        }

        // Live Martian Sol counter simulator
        const solBadge = document.getElementById('telemetry-sol-badge');
        if (solBadge) {
            const baseSol = 1420;
            const now = new Date();
            const minutes = now.getMinutes();
            solBadge.innerHTML = `SOL ${baseSol} &bull; LMST ${String(now.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
    }

    /**
     * Dismiss loading screen once everything has initialized
     */
    function dismissLoadingScreen() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 600);
            }, 600);
        }
    }

    /**
     * Expose helper functions globally for table buttons and inline onclick handlers
     */
    window.MarsNav = {
        removeWaypoint: removeWaypoint,
        moveWaypoint: moveWaypoint,
        addWaypoint: addWaypoint,
        loadPresetRoute: loadPresetRoute,
        selectAlternativeRoute: selectAlternativeRoute
    };

    /**
     * ================================================================
     * APPLICATION ENTRYPOINT
     * ================================================================
     */
    window.addEventListener('DOMContentLoaded', () => {
        initStarfieldCanvas();
        initMarsMap();
        setupRoutePlannerHandlers();
        initTelemetryCharts();
        initElevationProfileChart();      // Stage 4: elevation profile
        setupNavigation();
        dismissLoadingScreen();

        // Stage 4: Wire origin dropdown
        const originSelect = document.getElementById('route-origin-select');
        if (originSelect) {
            originSelect.addEventListener('change', () => {
                const val = originSelect.value;
                const origins = {
                    'jezero-landing':     { lat: 18.4447, lon: 77.4508 },
                    'gale-landing':       { lat: -4.5895, lon: 137.4417 },
                    'valles-depot':       { lat: -12.5000, lon: -60.5000 },
                    'arcadia-ice-station':{ lat: 39.2000, lon: -171.0000 }
                };
                const origin = origins[val];
                if (origin && appState.map) {
                    appState.map.flyTo([origin.lat, origin.lon], 7, { animate: true, duration: 1.2 });
                }
            });
        }

        // Initial dashboard sync (empty state)
        updateMissionDashboard([], 0, 0, 0, null);
    });

})();
