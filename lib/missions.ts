export interface MissionCard {
  blurb: string;
  radio: string;
}

const CARDS: Record<number, MissionCard> = {
  25544: {
    blurb: "International Space Station. Continuously crewed laboratory in 51.6° LEO since 1998.",
    radio: "ISS / ZARYA — voice on 145.800 MHz FM (ITU Region 1 downlink).",
  },
  49044: {
    blurb: "Nauka / MLM. ISS Russian multipurpose lab, docked 2021.",
    radio: "ISS stack — same voice loop as ZARYA.",
  },
  36086: {
    blurb: "Poisk / MRM-2. ISS docking module on Zvezda zenith.",
    radio: "ISS stack — no independent amateur downlink.",
  },
  48274: {
    blurb: "Tiangong core module Tianhe. China Space Station stack in ~41.5° LEO.",
    radio: "CSS / TIANHE — crew voice historically near 145.800 MHz; telemetry on S-band.",
  },
  20580: {
    blurb: "Hubble Space Telescope. 2.4 m UV/opt/IR observatory in 28.5° LEO, servicing-era veteran.",
    radio: "HST — TDRS S-band/Ku; no amateur downlink.",
  },
  25994: {
    blurb: "Terra. NASA flagship Earth-observing platform, sun-synchronous morning train.",
    radio: "TERRA — X-band science dump; S-band TT&C via TDRS.",
  },
  27424: {
    blurb: "Aqua. A-Train afternoon sounder/imager (MODIS, AIRS, AMSR-E era).",
    radio: "AQUA — X-band dump; S-band TT&C.",
  },
  39084: {
    blurb: "Landsat 8. USGS/NASA OLI + TIRS, 16-day global land archive.",
    radio: "LANDSAT 8 — X-band payload; S-band command.",
  },
  40697: {
    blurb: "Sentinel-2A. Copernicus MSI, 10–60 m optical, 290 km swath.",
    radio: "S2A — X-band / optical comms via EDRS.",
  },
  43412: {
    blurb: "TESS. NASA exoplanet transit survey in a 13.7-day lunar-resonant HEO.",
    radio: "TESS — DSN Ka/S-band.",
  },
  43013: {
    blurb: "NOAA-20 (JPSS-1). Polar operational weather, VIIRS/CrIS/ATMS.",
    radio: "NOAA-20 — HRPT/HRD X-band; APT not flown.",
  },
  33591: {
    blurb: "NOAA-19. Last of the POES afternoon birds. AVHRR + APT.",
    radio: "NOAA-19 APT 137.100 MHz; HRPT 1698 MHz.",
  },
  40732: {
    blurb: "Meteosat-11 (MSG-4). EUMETSAT 0° GEO imager.",
    radio: "METEOSAT-11 — HRIT/LRIT C-band; DCS.",
  },
  41866: {
    blurb: "GOES-16. NOAA GOES-East ABI, 75.2°W.",
    radio: "GOES-16 GRB 1686.6 MHz; HRIT 1694.1 MHz.",
  },
  43226: {
    blurb: "GOES-17. Former GOES-West; ABI cooling anomaly, now on-orbit spare.",
    radio: "GOES-17 — GRB/HRIT when tasked.",
  },
  51850: {
    blurb: "GOES-18. Operational GOES-West ABI at 137°W.",
    radio: "GOES-18 GRB 1686.6 MHz.",
  },
  24876: {
    blurb: "GPS IIR-2 / PRN 13. Medium Earth GNSS, ~20 180 km, 12h period.",
    radio: "GPS L1 C/A 1575.42 MHz; L2 1227.60 MHz.",
  },
  37753: {
    blurb: "GPS IIF-1 / PRN 25. First Block IIF, L5 civil added.",
    radio: "GPS L1/L2/L5 — PRN 25.",
  },
  37755: {
    blurb: "GPS IIF-2 / PRN 01. Block IIF, L1/L2/L5.",
    radio: "GPS L1/L2/L5 — PRN 01.",
  },
  43873: {
    blurb: "GPS III SV01 / PRN 04. First GPS III, L1C + improved clocks.",
    radio: "GPS L1 C/A + L1C — PRN 04.",
  },
  44713: {
    blurb: "Starlink v0.9/v1.0 slot. Ku/Ka user + laser ISL (generation dependent).",
    radio: "STARLINK — Ku user downlink; not a ham bird.",
  },
  39634: {
    blurb: "Sentinel-1A. C-band SAR, 12-day repeat, ESA Copernicus.",
    radio: "S1A — X-band / EDRS.",
  },
  36516: {
    blurb: "Iridium 33 debris. 2009 Iridium–Kosmos collision fragment.",
    radio: "DEB — no mission radio.",
  },
  44295: {
    blurb: "Falcon 9 spent stage. Typical LEO rocket body, high area-to-mass.",
    radio: "R/B — inert.",
  },
  49510: {
    blurb: "Kosmos 1408 debris. 2021 ASAT fragment, LEO hazard population.",
    radio: "DEB — no mission radio.",
  },
};

export function missionCard(noradId: number): MissionCard | null {
  return CARDS[noradId] ?? null;
}
