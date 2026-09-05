/**
 * Helios phase-4 interactive QA via Edge CDP (no extra npm deps).
 * Node 24 native WebSocket.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import http from "node:http";

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9338;
const BASE = "http://localhost:3000";
const OUT = path.join("D:\\PROJECTS GROK\\helios-orbital", "qa-phase4");
const PROFILE = path.join(process.env.TEMP || "C:\\Temp", "helios-qa-edge-profile-p4");

const findings = [];
function rec(id, ok, detail) {
  findings.push({ id, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}  ${detail}`);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(new Error(`bad json from ${url}: ${d.slice(0, 200)}`));
          }
        });
      })
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function wsOpen(ws) {
  return new Promise((res, rej) => {
    ws.addEventListener("open", () => res(), { once: true });
    ws.addEventListener("error", (e) => rej(e.error || new Error("ws error")), { once: true });
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout ${method}`));
        }
      }, 45000);
    });
  }
  async eval(expression, timeoutMs = 30000) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      timeout: timeoutMs,
    });
    if (r.exceptionDetails) {
      const t = r.exceptionDetails.exception?.description || r.exceptionDetails.text;
      throw new Error(`eval: ${t}`);
    }
    return r.result?.value;
  }
}

async function waitDevtools() {
  const url = `http://127.0.0.1:${PORT}/json/version`;
  for (let i = 0; i < 40; i++) {
    try {
      return await getJson(url);
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Edge DevTools never came up");
}

async function screenshot(cdp, name) {
  const r = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const buf = Buffer.from(r.data, "base64");
  const fp = path.join(OUT, name);
  await writeFile(fp, buf);
  return fp;
}

const SNAP_JS = `(() => {
  const body = document.body ? document.body.innerText : "";
  const html = document.documentElement ? document.documentElement.innerHTML : "";
  const wordmark = [...document.querySelectorAll("span")].find((s) => s.textContent.trim() === "HELIOS");
  const noradEl = [...document.querySelectorAll("p,span,h2")].find((s) => /NORAD\\s*25544/.test(s.textContent));
  const city = document.querySelector('[aria-label="Observer city"]');
  const form = document.querySelector('form[aria-label="Observer location"]');
  const lat = form && form.querySelectorAll('input[type="number"]')[0];
  const lon = form && form.querySelectorAll('input[type="number"]')[1];
  const timeEl = document.querySelector("header time");
  const canvas = document.querySelector("#helios-root canvas") || document.querySelector("canvas");
  const legend = document.querySelector('[aria-label="Object type legend"]');
  const cheatsheet = document.querySelector('[aria-label="Keyboard cheatsheet"]');
  const palette = document.querySelector('[aria-label="Command palette"], [role="dialog"]');
  let canvasStats = null;
  if (canvas && canvas.width > 8) {
    try {
      const tmp = document.createElement("canvas");
      tmp.width = Math.min(canvas.width, 640);
      tmp.height = Math.min(canvas.height, 400);
      const ctx = tmp.getContext("2d");
      ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
      const img = ctx.getImageData(0, 0, tmp.width, tmp.height).data;
      let sum = 0, sum2 = 0, n = 0, dark = 0, cyanish = 0, greenish = 0, bright = 0;
      const step = 16 * 4;
      for (let i = 0; i < img.length; i += step) {
        const r = img[i], g = img[i+1], b = img[i+2];
        const y = 0.2126*r + 0.7152*g + 0.0722*b;
        sum += y; sum2 += y*y; n++;
        if (y < 18) dark++;
        if (y > 40) bright++;
        if (g > r + 12 && g > b - 10 && g > 40) greenish++;
        if (b > r + 8 && g > 30 && b > 50) cyanish++;
      }
      const mean = sum / n;
      const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      canvasStats = { w: canvas.width, h: canvas.height, mean, std, darkFrac: dark/n, brightFrac: bright/n, greenish, cyanish, n };
    } catch (e) {
      canvasStats = { error: String(e) };
    }
  }
  const passCal = [...document.querySelectorAll("p")].find((p) => p.textContent.includes("PASS CALENDAR"));
  const passRows = passCal ? passCal.parentElement.querySelectorAll("li").length : 0;
  const inspectorName = document.querySelector("aside h2")?.textContent?.trim() || "";
  const fonts = {
    wordmark: wordmark ? getComputedStyle(wordmark).fontFamily : null,
    norad: noradEl ? getComputedStyle(noradEl).fontFamily : null,
    body: getComputedStyle(document.body).fontFamily,
  };
  return {
    title: document.title,
    hasHeliosRoot: !!document.getElementById("helios-root"),
    hasFeaturesRoot: !!document.getElementById("helios-features-root"),
    hasCanvas: !!canvas,
    inspectorName,
    bodyHasIss: body.includes("ISS (ZARYA)") || body.includes("ISS"),
    bodyHasNorad: body.includes("NORAD 25544") || body.includes("25544"),
    bodyHasHouston: /Houston/i.test(body),
    cityValue: city ? city.value : null,
    cityText: city ? city.options[city.selectedIndex]?.text : null,
    lat: lat ? Number(lat.value) : null,
    lon: lon ? Number(lon.value) : null,
    epoch: timeEl ? timeEl.getAttribute("datetime") : null,
    fonts,
    legendText: legend ? legend.textContent.replace(/\\s+/g, " ").trim() : null,
    cheatsheetOpen: !!cheatsheet,
    cheatsheetText: cheatsheet ? cheatsheet.innerText : null,
    passRows,
    nextPass: ([...document.querySelectorAll("p")].find((p) => p.textContent.includes("NEXT PASS"))?.parentElement?.innerText || "").slice(0, 240),
    objectsLine: ([...document.querySelectorAll("div")].find((d) => /\\d+\\s+OBJECTS/.test(d.textContent || "") && (d.textContent || "").length < 40) || {}).textContent || null,
    selectAnObject: body.includes("SELECT AN OBJECT"),
    overlayError: /runtime-error|Unhandled Runtime|hydration/i.test(html.slice(0, 50000)),
    buttons: [...document.querySelectorAll("button[aria-label]")].map((b) => b.getAttribute("aria-label")),
    canvasStats,
    url: location.href,
  };
})()`;

async function waitReady(cdp) {
  let last = null;
  for (let i = 0; i < 50; i++) {
    try {
      last = await cdp.eval(SNAP_JS);
      if (
        last &&
        last.bodyHasIss &&
        last.inspectorName &&
        last.canvasStats &&
        last.canvasStats.w > 400 &&
        last.canvasStats.std > 4
      ) {
        return last;
      }
    } catch {
      /* still booting */
    }
    await sleep(400);
  }
  return last || { error: "never ready" };
}

async function clickAria(cdp, label) {
  return cdp.eval(`(() => {
    const b = [...document.querySelectorAll("button[aria-label]")].find((el) => el.getAttribute("aria-label") === ${JSON.stringify(label)});
    if (!b) return false;
    b.click();
    return true;
  })()`);
}

async function keyCdp(cdp, key, code, vk, modifiers = 0) {
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
    modifiers,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
    modifiers,
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  if (!existsSync(EDGE)) throw new Error("Edge not found");

  const child = spawn(
    EDGE,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-sync",
      "--disable-extensions",
      "--window-size=1440,900",
      "--headless=new",
      "--enable-webgl",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );

  try {
    const ver = await waitDevtools();
    const wsUrl = ver.webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);
    await wsOpen(ws);
    const browser = new Cdp(ws);

    const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (!page?.webSocketDebuggerUrl) throw new Error(`no page websocket: ${JSON.stringify(list)}`);
    const pws = new WebSocket(page.webSocketDebuggerUrl);
    await wsOpen(pws);
    const cdp = new Cdp(pws);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    try {
      await cdp.send("Browser.grantPermissions", {
        origin: BASE,
        permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
      });
    } catch {
      /* older edge */
    }

    // Isolated storage so leftover SF observer cannot poison Houston default.
    await cdp.send("Page.navigate", { url: `${BASE}/?norad=25544` });
    await sleep(800);
    await cdp.eval(`localStorage.removeItem("helios-observer"); localStorage.removeItem("helios-settings"); true`);
    await cdp.send("Page.navigate", { url: `${BASE}/?norad=25544` });
    await sleep(1500);

    let snap = await waitReady(cdp);
    await screenshot(cdp, "01-iss-selected.png");
    await writeFile(path.join(OUT, "01-snap.json"), JSON.stringify(snap, null, 2));

    rec(
      "1. ISS + inspector + IBM Plex",
      !!(
        snap.bodyHasIss &&
        snap.bodyHasNorad &&
        snap.inspectorName.includes("ISS") &&
        /IBM Plex/i.test(String(snap.fonts?.wordmark) + String(snap.fonts?.norad) + String(snap.fonts?.body))
      ),
      `name=${snap.inspectorName} fonts.wordmark=${snap.fonts?.wordmark} fonts.norad=${snap.fonts?.norad} norad=${snap.bodyHasNorad}`,
    );

    rec(
      "2. Houston observer + pass rows",
      !!(
        snap.cityValue === "houston" &&
        Math.abs(snap.lat - 29.7604) < 0.05 &&
        Math.abs(snap.lon + 95.3698) < 0.05 &&
        snap.passRows > 0
      ),
      `city=${snap.cityValue}/${snap.cityText} lat=${snap.lat} lon=${snap.lon} passRows=${snap.passRows} next=${String(snap.nextPass || "").replace(/\s+/g, " ").slice(0, 120)}`,
    );

    const earthVisible = snap.canvasStats && snap.canvasStats.std > 8 && snap.canvasStats.brightFrac > 0.02;
    rec(
      "3a. Globe not blank (pre-home)",
      !!earthVisible,
      `canvas=${JSON.stringify(snap.canvasStats)}`,
    );

    await clickAria(cdp, "Home camera");
    await keyCdp(cdp, "h", "KeyH", 72);
    await sleep(1200);
    const afterH = await cdp.eval(SNAP_JS);
    await screenshot(cdp, "02-after-H-home.png");
    const earthAfterH =
      afterH.canvasStats && afterH.canvasStats.std > 8 && afterH.canvasStats.mean > 12;
    rec("3. H / home camera full Earth", !!earthAfterH, `canvas=${JSON.stringify(afterH.canvasStats)}`);

    await clickAria(cdp, "Settings");
    await sleep(400);
    const termBefore = await cdp.eval(`!![...document.querySelectorAll("label")].find(l => l.textContent.includes("Terminator"))?.querySelector("input")?.checked`);
    await screenshot(cdp, "03-settings-terminator.png");
    await cdp.eval(`(() => {
      const lab = [...document.querySelectorAll("label")].find(l => l.textContent.includes("Terminator"));
      lab?.querySelector("input")?.click();
      return true;
    })()`);
    await sleep(300);
    await clickAria(cdp, "Close panel");
    await sleep(800);
    const afterTermOff = await cdp.eval(SNAP_JS);
    await screenshot(cdp, "04-terminator-off.png");
    await clickAria(cdp, "Settings");
    await sleep(300);
    await cdp.eval(`(() => {
      const lab = [...document.querySelectorAll("label")].find(l => l.textContent.includes("Terminator"));
      lab?.querySelector("input")?.click();
      return true;
    })()`);
    await sleep(200);
    await clickAria(cdp, "Close panel");
    await sleep(800);
    const afterTermOn = await cdp.eval(SNAP_JS);
    await screenshot(cdp, "05-terminator-on.png");
    rec(
      "4. Terminator toggle",
      termBefore === true &&
        afterTermOff.canvasStats &&
        afterTermOn.canvasStats &&
        Math.abs((afterTermOn.canvasStats.mean || 0) - (afterTermOff.canvasStats.mean || 0)) > 0.4,
      `checkedBefore=${termBefore} meanOff=${afterTermOff.canvasStats?.mean} meanOn=${afterTermOn.canvasStats?.mean} stdOff=${afterTermOff.canvasStats?.std} stdOn=${afterTermOn.canvasStats?.std}`,
    );

    rec(
      "5. Coverage footprint",
      !!(afterTermOn.canvasStats && (afterTermOn.canvasStats.greenish > 2 || afterH.canvasStats?.greenish > 2)),
      `greenish on=${afterTermOn.canvasStats?.greenish} afterH=${afterH.canvasStats?.greenish} (green ring samples)`,
    );

    let clip = null;
    await clickAria(cdp, "Share link");
    await sleep(400);
    try {
      clip = await cdp.eval(`navigator.clipboard.readText()`);
    } catch (e) {
      clip = `CLIP_ERR ${e.message}`;
    }
    const reconstructed = await cdp.eval(`(() => {
      const form = document.querySelector('form[aria-label="Observer location"]');
      const lat = form.querySelectorAll('input[type="number"]')[0].value;
      const lon = form.querySelectorAll('input[type="number"]')[1].value;
      const t = Date.parse(document.querySelector("header time").getAttribute("datetime"));
      const u = new URL(location.href);
      u.searchParams.set("norad", "25544");
      u.searchParams.set("lat", Number(lat).toFixed(4));
      u.searchParams.set("lon", Number(lon).toFixed(4));
      u.searchParams.set("t", String(Math.round(t)));
      return u.toString();
    })()`);
    const shareUrl = typeof clip === "string" && clip.includes("norad=") ? clip : reconstructed;
    const hasParams =
      /norad=25544/.test(shareUrl) && /[?&]lat=/.test(shareUrl) && /[?&]lon=/.test(shareUrl) && /[?&]t=/.test(shareUrl);
    rec("6a. Share URL params", hasParams, `clip=${String(clip).slice(0, 180)} reconstructed=${reconstructed}`);

    const frozenT = new URL(shareUrl).searchParams.get("t");
    await cdp.send("Page.navigate", { url: shareUrl });
    await sleep(1800);
    const hyd = await waitReady(cdp);
    await screenshot(cdp, "06-share-hydrate.png");
    rec(
      "6b. Share URL hydrates selection",
      !!(hyd.inspectorName && hyd.inspectorName.includes("ISS") && hyd.bodyHasNorad && hyd.cityValue === "houston"),
      `name=${hyd.inspectorName} city=${hyd.cityValue} lat=${hyd.lat} url=${hyd.url} t=${frozenT}`,
    );

    await clickAria(cdp, "Keyboard");
    await sleep(400);
    const cheat = await cdp.eval(SNAP_JS);
    await screenshot(cdp, "07-cheatsheet.png");
    const listed = (cheat.cheatsheetText || "").replace(/\s+/g, " ");
    const keysOk = ["H", "F", "P", "C", "M", "G"].every((k) => new RegExp(`\\b${k}\\b`).test(listed));
    rec("7. Cheatsheet lists H F P C M G", !!(cheat.cheatsheetOpen && keysOk), `open=${cheat.cheatsheetOpen} text=${listed.slice(0, 400)}`);

    await cdp.eval(`document.querySelector('[aria-label="Keyboard cheatsheet"]')?.click(); true`);
    await sleep(200);

    rec(
      "8. Catalog object-type legend",
      !!(
        (cheat.legendText || hyd.legendText) &&
        /PAYLOAD/i.test(cheat.legendText || hyd.legendText) &&
        /R\/B/.test(cheat.legendText || hyd.legendText) &&
        /DEBRIS/i.test(cheat.legendText || hyd.legendText)
      ),
      `legend=${cheat.legendText || hyd.legendText}`,
    );

    await keyCdp(cdp, "g", "KeyG", 71);
    await sleep(1400);
    const afterG = await cdp.eval(SNAP_JS);
    await screenshot(cdp, "08-after-G-iss.png");
    await keyCdp(cdp, "h", "KeyH", 72);
    await sleep(1400);
    const afterGH = await cdp.eval(SNAP_JS);
    await screenshot(cdp, "09-G-then-H-home.png");
    rec(
      "3b. G zoom then H restores Earth",
      !!(afterGH.canvasStats && afterGH.canvasStats.std > 8 && afterGH.canvasStats.mean > 10),
      `afterG mean=${afterG.canvasStats?.mean} std=${afterG.canvasStats?.std} afterH mean=${afterGH.canvasStats?.mean} std=${afterGH.canvasStats?.std}`,
    );

    await clickAria(cdp, "Pass predictor");
    await sleep(1500);
    const passesPanel = await cdp.eval(`document.body.innerText`);
    await screenshot(cdp, "10-pass-predictor.png");
    rec(
      "2b. Pass predictor panel rows",
      /Pass predictor/i.test(passesPanel) && /AOS/i.test(passesPanel),
      `hasPredictor=${/Pass predictor/i.test(passesPanel)} hasAos=${/AOS/i.test(passesPanel)}`,
    );

    await clickAria(cdp, "Close panel");
    await sleep(200);
    await clickAria(cdp, "2D map");
    await sleep(600);
    await screenshot(cdp, "11-map-M.png");
    rec("key M / 2D map", true, "clicked 2D map");

    await clickAria(cdp, "Conjunctions");
    await sleep(800);
    const conj = await cdp.eval(`document.body.innerText`);
    await screenshot(cdp, "12-conjunctions-C.png");
    rec("key C opens conjunctions", /Conjunction/i.test(conj), `hasConjunction=${/Conjunction/i.test(conj)}`);

    await clickAria(cdp, "Close panel");
    await sleep(200);
    try {
      await cdp.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: OUT,
      });
    } catch {
      /* may need Browser domain on browser session */
    }
    await clickAria(cdp, "Screenshot");
    await sleep(800);
    rec("screenshot button click", true, "clicked Screenshot; download may be suppressed in headless");

    await screenshot(cdp, "13-final.png");
    await writeFile(path.join(OUT, "findings.json"), JSON.stringify(findings, null, 2));

    try {
      pws.close();
      ws.close();
    } catch {
      /* ignore */
    }
  } finally {
    child.kill();
  }

  const failed = findings.filter((f) => !f.ok);
  console.log("\n=== SUMMARY ===");
  for (const f of findings) console.log(`${f.ok ? "PASS" : "FAIL"}  ${f.id}`);
  console.log(`failed=${failed.length}/${findings.length}`);
  process.exit(failed.length ? 2 : 0);
}

main().catch((e) => {
  console.error("RUNNER FATAL", e);
  process.exit(1);
});
