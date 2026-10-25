
 // --- Teemanhallinta ---
const nykyinenTeema =
    localStorage.getItem("teema") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

document.documentElement.setAttribute("data-theme", nykyinenTeema);

let liveSleepInterval = null;
let sleepStartTime = null;

document.addEventListener("DOMContentLoaded", () => {
    // Asetetaan paikallinen päivämäärä oletukseksi.
    const sleepDate = document.getElementById("sleepDate");

    if (sleepDate) {
        const nyt = new Date();
        const vuosi = nyt.getFullYear();
        const kuukausi = String(nyt.getMonth() + 1).padStart(2, "0");
        const paiva = String(nyt.getDate()).padStart(2, "0");

        sleepDate.value = `${vuosi}-${kuukausi}-${paiva}`;
    }

    naytaHistoria();
    paivitaDashboard();
    tarkistaAktiivinenUni();

    // Teemanvaihto
    const teemaNappi = document.getElementById("themeToggle");

    paivitaTeemaNappiTeksti(
        teemaNappi,
        document.documentElement.getAttribute("data-theme")
    );

    if (teemaNappi) {
        teemaNappi.addEventListener("click", () => {
            const teema = document.documentElement.getAttribute("data-theme");
            const uusiTeema = teema === "dark" ? "light" : "dark";

            document.documentElement.setAttribute("data-theme", uusiTeema);
            localStorage.setItem("teema", uusiTeema);

            paivitaTeemaNappiTeksti(teemaNappi, uusiTeema);
        });
    }

    // Painikkeiden kuuntelijat
    const laskeNappi = document.getElementById("laske-btn");
    if (laskeNappi) {
        laskeNappi.addEventListener("click", manuaalinenTallennus);
    }

    const tyhjennaNappi = document.getElementById("tyhjenna-btn");
    if (tyhjennaNappi) {
        tyhjennaNappi.addEventListener("click", tyhjennaHistoria);
    }

    const uniNappi = document.getElementById("toggleSleepBtn");
    if (uniNappi) {
        uniNappi.addEventListener("click", toggleLiveSleep);
    }
});

function paivitaTeemaNappiTeksti(nappi, teema) {
    if (!nappi) return;

    nappi.innerText = teema === "dark" ? "☀️ Vaalea" : "🌙 Tumma";
}

// --- Livenukkumisen seuranta ---
function toggleLiveSleep() {
    const btn = document.getElementById("toggleSleepBtn");
    const btnText = document.getElementById("btnText");
    const timerDisplay = document.getElementById("liveTimerDisplay");
    const circle = document.getElementById("statusCircle");
    const statusText = document.getElementById("circleStatusText");

    if (!sleepStartTime) {
        // Aloitetaan unen seuranta.
        sleepStartTime = Date.now();
        localStorage.setItem("liveSleepStart", String(sleepStartTime));

        if (btnText) btnText.innerText = "Herää nyt";
        if (btn) btn.classList.add("active");
        if (timerDisplay) timerDisplay.classList.remove("hidden");
        if (circle) circle.classList.add("sleeping");
        if (statusText) statusText.innerText = "Nukkuu...";

        paivitaLiveAika();

        if (liveSleepInterval) clearInterval(liveSleepInterval);
        liveSleepInterval = setInterval(paivitaLiveAika, 1000);

    } else {
        // Lopetetaan unen seuranta.
        if (liveSleepInterval) {
            clearInterval(liveSleepInterval);
            liveSleepInterval = null;
        }

        const endTime = Date.now();
        const diffMs = Math.max(0, endTime - sleepStartTime);
        const kokonaisminuutit = Math.floor(diffMs / 60000);
        const tunnit = Math.floor(kokonaisminuutit / 60);
        const minuutit = kokonaisminuutit % 60;

        const tyyppi = confirm(
            "Oliko kyseessä päiväunet?\nOK = Päiväunet, Peruuta = Yöunet"
        ) ? "päiväunet" : "yöunet";

        // Päivämäärä määräytyy unen aloitusajasta.
        const pvm = new Date(sleepStartTime).toLocaleDateString("fi-FI");

        tallennaMerkinta(
            tyyppi,
            pvm,
            formatTime(new Date(sleepStartTime)),
            formatTime(new Date(endTime)),
            tunnit,
            minuutit,
            kokonaisminuutit
        );

        sleepStartTime = null;
        localStorage.removeItem("liveSleepStart");

        if (btnText) btnText.innerText = "Aloita nukkuminen";
        if (btn) btn.classList.remove("active");
        if (timerDisplay) timerDisplay.classList.add("hidden");
        if (circle) circle.classList.remove("sleeping");
        if (statusText) statusText.innerText = "Hereillä";

        paivitaDashboard();
    }
}

function paivitaLiveAika() {
    if (!sleepStartTime) return;

    const diffMs = Math.max(0, Date.now() - sleepStartTime);
    const kokonaissekunnit = Math.floor(diffMs / 1000);
    const sekunnit = kokonaissekunnit % 60;
    const kokonaisminuutit = Math.floor(kokonaissekunnit / 60);
    const minuutit = kokonaisminuutit % 60;
    const tunnit = Math.floor(kokonaisminuutit / 60);

    const nollaa = (num) => String(num).padStart(2, "0");

    const timerDisplay = document.getElementById("liveTimerDisplay");

    if (timerDisplay) {
        timerDisplay.innerText =
            `${nollaa(tunnit)}:${nollaa(minuutit)}:${nollaa(sekunnit)}`;
    }

    const subText = document.getElementById("circleSubText");

    if (subText) {
        subText.innerText = `Nukuttu: ${tunnit}t ${minuutit}m`;
    }
}

function tarkistaAktiivinenUni() {
    const tallennettuAloitus = localStorage.getItem("liveSleepStart");

    if (!tallennettuAloitus) return;

    const aloitusaika = Number(tallennettuAloitus);

    if (!Number.isFinite(aloitusaika) || aloitusaika <= 0) {
        localStorage.removeItem("liveSleepStart");
        return;
    }

    sleepStartTime = aloitusaika;

    const btn = document.getElementById("toggleSleepBtn");
    const btnText = document.getElementById("btnText");
    const timerDisplay = document.getElementById("liveTimerDisplay");
    const circle = document.getElementById("statusCircle");
    const statusText = document.getElementById("circleStatusText");

    if (btnText) btnText.innerText = "Herää nyt";
    if (btn) btn.classList.add("active");
    if (timerDisplay) timerDisplay.classList.remove("hidden");
    if (circle) circle.classList.add("sleeping");
    if (statusText) statusText.innerText = "Nukkuu...";

    paivitaLiveAika();

    if (liveSleepInterval) clearInterval(liveSleepInterval);
    liveSleepInterval = setInterval(paivitaLiveAika, 1000);
}

// --- Dashboard ---
function lueHistoria() {
    try {
        const historia = JSON.parse(
            localStorage.getItem("unihistoria") || "[]"
        );

        return Array.isArray(historia) ? historia : [];

    } catch (error) {
        console.error("Unihistorian lukeminen epäonnistui:", error);
        return [];
    }
}

function paivitaDashboard() {
    const historia = lueHistoria();
    const viimeisinUni = historia.length
        ? historia[historia.length - 1]
        : null;

    const statusText = document.getElementById("circleStatusText");
    const subText = document.getElementById("circleSubText");

    if (!sleepStartTime) {
        if (statusText) statusText.innerText = "Hereillä";

        if (subText) {
            subText.innerText = viimeisinUni
                ? `Viimeisin kesto: ${viimeisinUni.kesto}`
                : "Ei vielä unimerkintöjä";
        }
    }

    const paivaunet = historia
        .filter(
            (m) =>
                m.tyyppi === "päiväunet" &&
                Number.isFinite(Number(m.timestamp))
        )
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    const timeSinceLastNap = document.getElementById("timeSinceLastNap");

    if (timeSinceLastNap) {
        if (paivaunet.length > 0) {
            const erotusMs = Math.max(
                0,
                Date.now() - Number(paivaunet[0].timestamp)
            );

            const tunnit = Math.floor(erotusMs / 3600000);
            const minuutit = Math.floor((erotusMs / 60000) % 60);

            timeSinceLastNap.innerText =
                `${tunnit} t ${minuutit} min sitten`;

        } else {
            timeSinceLastNap.innerText = "Ei päiväunia";
        }
    }
}

// --- Manuaalinen syöttö ---
function manuaalinenTallennus() {
    const sleepDateInput = document.getElementById("sleepDate")?.value;
    const bedtimeVal = document.getElementById("bedtime")?.value;
    const wakeupVal = document.getElementById("wakeup")?.value;
    const tyyppi = document.getElementById("sleepType")?.value;

    if (!sleepDateInput || !bedtimeVal || !wakeupVal || !tyyppi) {
        alert("Täytä kaikki kentät (päivämäärä ja kellonajat)!");
        return;
    }

    const aikaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!aikaRegex.test(bedtimeVal) || !aikaRegex.test(wakeupVal)) {
        alert("Anna kellonajat muodossa HH:MM.");
        return;
    }

    const [bedHours, bedMins] = bedtimeVal.split(":").map(Number);
    const [wakeHours, wakeMins] = wakeupVal.split(":").map(Number);

    const bedTotalMins = bedHours * 60 + bedMins;
    let wakeTotalMins = wakeHours * 60 + wakeMins;

    // Jos heräämisaika on aikaisempi tai sama,
    // oletetaan heräämisen tapahtuneen seuraavana päivänä.
    if (wakeTotalMins <= bedTotalMins) {
        wakeTotalMins += 24 * 60;
    }

    const erotusMinuutteina = wakeTotalMins - bedTotalMins;
    const tunnit = Math.floor(erotusMinuutteina / 60);
    const minuutit = erotusMinuutteina % 60;

    // Muodostetaan päivämäärä paikallisessa aikavyöhykkeessä.
    const [vuosi, kuukausi, paiva] = sleepDateInput.split("-").map(Number);

    const pvmSuomeksi = new Date(
        vuosi,
        kuukausi - 1,
        paiva
    ).toLocaleDateString("fi-FI");

    tallennaMerkinta(
        tyyppi,
        pvmSuomeksi,
        bedtimeVal,
        wakeupVal,
        tunnit,
        minuutit,
        erotusMinuutteina
    );

    const tulos = document.getElementById("tamanKertainenTulos");

    if (tulos) {
        tulos.innerText = `Tallennettu päivälle ${pvmSuomeksi}!`;
    }

    paivitaDashboard();
}

// --- Unimerkinnän tallennus ---
function tallennaMerkinta(
    tyyppi,
    paivamaara,
    aloitusaika,
    lopetusaika,
    tunnit,
    minuutit,
    erotusMinuutteina
) {
    const nyt = Date.now();

    const uniMerkinta = {
        id: nyt,
        timestamp: nyt,
        paivamaara: paivamaara,
        kellonajat: `${aloitusaika} - ${lopetusaika}`,
        kesto: `${tunnit} t ${minuutit} min`,
        minuutitYhteensä: erotusMinuutteina,
        tyyppi: tyyppi
    };

    const historia = lueHistoria();
    historia.push(uniMerkinta);

    localStorage.setItem("unihistoria", JSON.stringify(historia));

    naytaHistoria();
}

// --- Historian näyttäminen ---
function naytaHistoria() {
    const historiaKontti = document.getElementById("uniPaivaryhmat");

    if (!historiaKontti) return;

    historiaKontti.innerHTML = "";

    const historia = lueHistoria();

    if (historia.length === 0) {
        const tyhja = document.createElement("p");

        tyhja.style.textAlign = "center";
        tyhja.style.opacity = "0.5";
        tyhja.style.padding = "20px 0";
        tyhja.textContent = "Ei unimerkintöjä vielä.";

        historiaKontti.appendChild(tyhja);
        return;
    }

    const ryhmitelty = {};

    historia.forEach((merkinta) => {
        if (!ryhmitelty[merkinta.paivamaara]) {
            ryhmitelty[merkinta.paivamaara] = [];
        }

        ryhmitelty[merkinta.paivamaara].push(merkinta);
    });

    Object.keys(ryhmitelty).reverse().forEach((pvm) => {
        const paivaLaatikko = document.createElement("div");
        paivaLaatikko.classList.add("day-group");

        const paivanMerkinnat = ryhmitelty[pvm];

        const paivanKokonaisMinuutit = paivanMerkinnat.reduce(
            (summa, merkinta) =>
                summa + (Number(merkinta.minuutitYhteensä) || 0),
            0
        );

        const yhteisTunnit = Math.floor(paivanKokonaisMinuutit / 60);
        const yhteisMinuutit = paivanKokonaisMinuutit % 60;

        const otsikko = document.createElement("div");
        otsikko.classList.add("day-header");

        const paivaTeksti = document.createElement("span");
        paivaTeksti.textContent = `📅 ${pvm}`;

        const paivaYhteensa = document.createElement("span");
        paivaYhteensa.classList.add("day-total");
        paivaYhteensa.textContent =
            `Σ ${yhteisTunnit}t ${yhteisMinuutit}m`;

        otsikko.append(paivaTeksti, paivaYhteensa);
        paivaLaatikko.appendChild(otsikko);

        const tapahtumalista = document.createElement("div");
        tapahtumalista.classList.add("day-events");

        paivanMerkinnat.forEach((merkinta) => {
            const tapahtuma = document.createElement("div");

            tapahtuma.classList.add(
                "event-item",
                merkinta.tyyppi
            );

            const vasen = document.createElement("div");

            const tapahtumaOtsikko = document.createElement("strong");
            const ikoni =
                merkinta.tyyppi === "päiväunet" ? "☀️" : "🌙";

            tapahtumaOtsikko.textContent =
                `${ikoni} ${(merkinta.tyyppi || "uni").toUpperCase()}`;

            const ajat = document.createElement("small");
            ajat.style.opacity = "0.6";
            ajat.textContent = merkinta.kellonajat || "";

            vasen.append(
                tapahtumaOtsikko,
                document.createElement("br"),
                ajat
            );

            const oikea = document.createElement("div");
            oikea.classList.add("event-right");

            const kesto = document.createElement("span");
            kesto.style.fontWeight = "700";
            kesto.textContent = merkinta.kesto || "";

            const poistaNappi = document.createElement("button");
            poistaNappi.type = "button";
            poistaNappi.classList.add("delete-sleep-btn");
            poistaNappi.setAttribute(
                "aria-label",
                "Poista unimerkintä"
            );
            poistaNappi.textContent = "🗑️";

            poistaNappi.addEventListener("click", () => {
                poistaUni(merkinta.id);
            });

            oikea.append(kesto, poistaNappi);
            tapahtuma.append(vasen, oikea);
            tapahtumalista.appendChild(tapahtuma);
        });

        paivaLaatikko.appendChild(tapahtumalista);
        historiaKontti.appendChild(paivaLaatikko);
    });
}

// --- Yksittäisen unimerkinnän poisto ---
function poistaUni(id) {
    if (!confirm("Haluatko varmasti poistaa tämän unimerkinnän?")) {
        return;
    }

    const historia = lueHistoria().filter(
        (merkinta) => String(merkinta.id) !== String(id)
    );

    localStorage.setItem("unihistoria", JSON.stringify(historia));

    naytaHistoria();
    paivitaDashboard();
}

// Säilytetään yhteensopivuus mahdollisten HTML-onclick-kutsujen kanssa.
window.poistaUni = poistaUni;

// --- Koko unihistorian tyhjennys ---
function tyhjennaHistoria() {
    if (!confirm("Haluatko varmasti poistaa koko unihistorian?")) {
        return;
    }

    // Ei poisteta teema-asetusta.
    localStorage.removeItem("unihistoria");
    localStorage.removeItem("liveSleepStart");

    if (liveSleepInterval) {
        clearInterval(liveSleepInterval);
        liveSleepInterval = null;
    }

    sleepStartTime = null;

    naytaHistoria();
    paivitaDashboard();

    const btn = document.getElementById("toggleSleepBtn");
    const btnText = document.getElementById("btnText");
    const timerDisplay = document.getElementById("liveTimerDisplay");
    const circle = document.getElementById("statusCircle");
    const statusText = document.getElementById("circleStatusText");

    if (btn) btn.classList.remove("active");

    if (btnText) {
        btnText.innerText = "Aloita nukkuminen";
    }

    if (timerDisplay) {
        timerDisplay.classList.add("hidden");
        timerDisplay.innerText = "00:00:00";
    }

    if (circle) circle.classList.remove("sleeping");
    if (statusText) statusText.innerText = "Hereillä";
}

// --- Kellonajan muotoilu ---
function formatTime(date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
    ).padStart(2, "0")}`;
}
