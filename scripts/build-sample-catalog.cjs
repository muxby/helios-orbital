const fs = require("fs");
const path = require("path");

function checksum(line68) {
  let sum = 0;
  for (let i = 0; i < 68; i++) {
    const c = line68[i] ?? " ";
    if (c >= "0" && c <= "9") sum += Number(c);
    else if (c === "-") sum += 1;
  }
  return sum % 10;
}

function put(arr, start, str) {
  for (let i = 0; i < str.length && start + i < arr.length; i++) arr[start + i] = str[i];
}

function line1({ norad, intl, epoch, elset = 999 }) {
  const a = Array(68).fill(" ");
  a[0] = "1";
  put(a, 2, String(norad).padStart(5, "0"));
  a[7] = "U";
  put(a, 9, String(intl).padEnd(8, " ").slice(0, 8));
  put(a, 18, epoch.slice(0, 14));
  put(a, 33, " .00000000");
  put(a, 44, " 00000-0");
  put(a, 53, " 00000-0");
  a[62] = "0";
  put(a, 64, String(elset).padStart(4, " "));
  const body = a.join("");
  return body + checksum(body);
}

function line2({ norad, inc, raan, ecc, argp, ma, n, rev = 1 }) {
  const a = Array(68).fill(" ");
  a[0] = "2";
  put(a, 2, String(norad).padStart(5, "0"));
  put(a, 8, inc.toFixed(4).padStart(8, " "));
  put(a, 17, raan.toFixed(4).padStart(8, " "));
  put(a, 26, ecc.toFixed(7).replace(/^0\./, "").padStart(7, "0").slice(0, 7));
  put(a, 34, argp.toFixed(4).padStart(8, " "));
  put(a, 43, ma.toFixed(4).padStart(8, " "));
  put(a, 52, n.toFixed(8).padStart(11, " "));
  put(a, 63, String(rev).padStart(5, "0"));
  const body = a.join("");
  return body + checksum(body);
}

const EPOCH = "26241.00000000";

const sats = [
  { name: "ISS (ZARYA)", norad: 25544, intl: "98067A", group: "stations", inc: 51.6416, raan: 247.4627, ecc: 0.0006703, argp: 130.536, ma: 325.0288, n: 15.50400001 },
  { name: "CSS (TIANHE)", norad: 48274, intl: "21035A", group: "stations", inc: 41.469, raan: 120.1, ecc: 0.0006, argp: 40.2, ma: 80.1, n: 15.61000001 },
  { name: "HST", norad: 20580, intl: "90037B", group: "science", inc: 28.4699, raan: 37.3861, ecc: 0.0003445, argp: 18.7965, ma: 47.3695, n: 15.09000001 },
  { name: "TERRA", norad: 25994, intl: "99068A", group: "science", inc: 98.2, raan: 10, ecc: 0.00012, argp: 90, ma: 270, n: 14.57100001 },
  { name: "AQUA", norad: 27424, intl: "02022A", group: "science", inc: 98.2, raan: 190, ecc: 0.00014, argp: 80, ma: 280, n: 14.57120001 },
  { name: "LANDSAT 8", norad: 39084, intl: "13008A", group: "science", inc: 98.2, raan: 40, ecc: 0.00013, argp: 70, ma: 290, n: 14.57140001 },
  { name: "SENTINEL-2A", norad: 40697, intl: "15028A", group: "science", inc: 98.57, raan: 55, ecc: 0.00012, argp: 60, ma: 300, n: 14.30800001 },
  { name: "TESS", norad: 43412, intl: "18038A", group: "science", inc: 28.0, raan: 90, ecc: 0.45, argp: 200, ma: 10, n: 0.80000000 },
  { name: "NOAA 20", norad: 43013, intl: "17073A", group: "weather", inc: 98.7, raan: 70, ecc: 0.00015, argp: 50, ma: 310, n: 14.19500001 },
  { name: "NOAA 19", norad: 33591, intl: "09005A", group: "weather", inc: 99.1, raan: 88, ecc: 0.0013, argp: 90, ma: 270, n: 14.12500001 },
  { name: "METEOSAT-11", norad: 40732, intl: "15041A", group: "weather", inc: 0.4, raan: 70, ecc: 0.0002, argp: 40, ma: 90, n: 1.00270000 },
  { name: "GOES 16", norad: 41866, intl: "16071A", group: "geo", inc: 0.08, raan: 80, ecc: 0.0002, argp: 10, ma: 80, n: 1.00270000 },
  { name: "GOES 17", norad: 43226, intl: "18022A", group: "geo", inc: 0.1, raan: 90, ecc: 0.00025, argp: 20, ma: 140, n: 1.00270000 },
  { name: "GOES 18", norad: 51850, intl: "22021A", group: "geo", inc: 0.06, raan: 85, ecc: 0.00018, argp: 15, ma: 200, n: 1.00270000 },
  { name: "INTELSAT 40E", norad: 56174, intl: "23080A", group: "geo", inc: 0.04, raan: 100, ecc: 0.0003, argp: 30, ma: 250, n: 1.00270000 },
  { name: "GPS BIIR-2  (PRN 13)", norad: 24876, intl: "97035A", group: "gps-ops", inc: 55.0, raan: 10, ecc: 0.005, argp: 20, ma: 40, n: 2.00562700 },
  { name: "GPS BIIF-1  (PRN 25)", norad: 37753, intl: "11036A", group: "gps-ops", inc: 55.1, raan: 130, ecc: 0.004, argp: 40, ma: 80, n: 2.00560000 },
  { name: "GPS BIIF-2  (PRN 01)", norad: 37755, intl: "11036B", group: "gps-ops", inc: 55.2, raan: 250, ecc: 0.006, argp: 60, ma: 120, n: 2.00550000 },
  { name: "GPS BIII-1  (PRN 04)", norad: 43873, intl: "18096A", group: "gps-ops", inc: 55.05, raan: 190, ecc: 0.003, argp: 90, ma: 160, n: 2.00565000 },
  { name: "STARLINK-1007", norad: 44713, intl: "19074A", group: "starlink", inc: 53.0, raan: 10, ecc: 0.00014, argp: 70, ma: 20, n: 15.12000001 },
  { name: "STARLINK-1008", norad: 44714, intl: "19074B", group: "starlink", inc: 53.0, raan: 12, ecc: 0.00015, argp: 72, ma: 40, n: 15.11900001 },
  { name: "STARLINK-1009", norad: 44715, intl: "19074C", group: "starlink", inc: 53.0, raan: 14, ecc: 0.00013, argp: 74, ma: 60, n: 15.12100001 },
  { name: "STARLINK-1010", norad: 44716, intl: "19074D", group: "starlink", inc: 53.0, raan: 16, ecc: 0.00016, argp: 76, ma: 80, n: 15.11800001 },
  { name: "STARLINK-1011", norad: 44717, intl: "19074E", group: "starlink", inc: 53.0, raan: 18, ecc: 0.00012, argp: 78, ma: 100, n: 15.12200001 },
  { name: "STARLINK-1012", norad: 44718, intl: "19074F", group: "starlink", inc: 53.0, raan: 20, ecc: 0.00011, argp: 80, ma: 120, n: 15.12000001 },
  { name: "SENTINEL-1A", norad: 39634, intl: "14016A", group: "science", inc: 98.18, raan: 60, ecc: 0.00014, argp: 55, ma: 305, n: 14.40500001 },
  { name: "IRIDIUM 33 DEB", norad: 36516, intl: "97051Q", group: "visual", inc: 86.4, raan: 200, ecc: 0.0008, argp: 40, ma: 320, n: 14.34000001 },
  { name: "FALCON 9 R/B", norad: 44295, intl: "19029B", group: "visual", inc: 53.0, raan: 40, ecc: 0.01, argp: 100, ma: 20, n: 15.05000001 },
  { name: "COSMOS 1408 DEB", norad: 49510, intl: "82092C", group: "visual", inc: 82.6, raan: 300, ecc: 0.002, argp: 50, ma: 310, n: 15.60000001 },
];

const rows = [];
const seen = new Set();
sats.forEach((s, i) => {
  if (seen.has(s.norad)) return;
  seen.add(s.norad);
  rows.push({
    OBJECT_NAME: s.name,
    OBJECT_ID: s.intl,
    NORAD_CAT_ID: s.norad,
    TLE_LINE1: line1({ norad: s.norad, intl: s.intl, epoch: EPOCH, elset: 100 + i }),
    TLE_LINE2: line2({ ...s, rev: 1000 + i }),
    GROUP: s.group,
  });
});

const out = path.join("D:/PROJECTS GROK/helios-orbital/public/data/sample-catalog.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log("count", rows.length);
console.log(rows[0].TLE_LINE1);
console.log(rows[0].TLE_LINE2);
console.log("len", rows[0].TLE_LINE1.length, rows[0].TLE_LINE2.length);
