/* Reconversion Arthur — fiches bristol
   · bibliothèque des .md (lecteur plein écran, rendu marked)
   · checklist persistée en localStorage
*/
(function () {
  "use strict";

  /* ─── manifeste des fiches ──────────────────────────────── */
  var DOCS = [
    { file: "GUIDE-ARTHUR.md",                         num: "★",  title: "Le guide pas-à-pas",              sub: "Par où commencer, quoi remplir, les pièges — LA fiche à lire d'abord" },
    { file: "PREVISIONNEL-FREELANCE.md",               num: "€",  title: "Prévisionnel freelance (v2)",     sub: "Scénarios, tarifs lillois, seuil de viabilité, ARE/ARCE" },
    { file: "00-analyse-du-dossier.md",                num: "0",  title: "Analyse du formulaire officiel",  sub: "Qui remplit quoi, les 4 critères de la commission" },
    { file: "01-formation-eopi.md",                    num: "1",  title: "Formation EOPI",                  sub: "Le rapport complet et sourcé (organisme, programme, coûts)" },
    { file: "02-formation-edai.md",                    num: "2",  title: "Formation EDAI",                  sub: "Le rapport complet et sourcé (programme, certifications, coûts)" },
    { file: "03-etude-marche.md",                      num: "3",  title: "Étude de marché nationale",       sub: "ROME F1102, salaires, tendances rénovation" },
    { file: "04-dispositif-demission-reconversion.md", num: "4",  title: "Le dispositif, règles 2026",      sub: "CEP, commission, CPF 150 €, ARE, contrôles" },
    { file: "05-synthese-benchmark-et-choix.md",       num: "5",  title: "Benchmark des deux formations",   sub: "Le comparatif critère par critère" },
    { file: "07-etude-marche-lille.md",                num: "6",  title: "Le marché lillois",               sub: "Offres, immobilier, concurrence, tarifs des pros MEL" },
    { file: "08-parametres-financiers-freelance.md",   num: "7",  title: "Micro-entreprise 2026",           sub: "Cotisations, ACRE, TVA, charges, tarifs métier" }
  ];

  var byFile = {};
  DOCS.forEach(function (d) { byFile[d.file] = d; });

  /* ─── bibliothèque ──────────────────────────────────────── */
  var list = document.getElementById("doc-list");
  DOCS.forEach(function (d) {
    var li = document.createElement("li");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML =
      '<span class="num">' + d.num + "</span>" +
      '<span><span class="doc-title">' + d.title + '</span><span class="doc-sub">' + d.sub + "</span></span>";
    btn.addEventListener("click", function () { openDoc(d.file); });
    li.appendChild(btn);
    list.appendChild(li);
  });

  /* ─── lecteur ───────────────────────────────────────────── */
  var reader = document.getElementById("reader");
  var readerTitle = document.getElementById("reader-title");
  var readerContent = document.getElementById("reader-content");
  var closeBtn = document.getElementById("reader-close");
  var lastFocus = null;
  var cache = {};

  marked.setOptions({ gfm: true, breaks: false });

  function openDoc(file) {
    var meta = byFile[file];
    lastFocus = document.activeElement;
    readerTitle.textContent = meta ? meta.title : file;
    readerContent.innerHTML = '<p class="scribble">je feuillette…</p>';
    reader.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();

    (cache[file]
      ? Promise.resolve(cache[file])
      : fetch("docs/" + file).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        }).then(function (txt) { cache[file] = txt; return txt; })
    ).then(function (txt) {
      readerContent.innerHTML = marked.parse(txt);
      readerContent.scrollTop = 0;
      hookInternalLinks();
    }).catch(function () {
      readerContent.innerHTML =
        '<p>Oups, impossible de charger cette fiche. <a href="docs/' + file + '">L’ouvrir en brut</a> ?</p>';
    });
  }

  /* liens .md internes → rester dans le lecteur ; externes → nouvel onglet */
  function hookInternalLinks() {
    readerContent.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      var m = href && href.match(/([\w.\-]+\.md)(#.*)?$/i);
      if (m && byFile[m[1]]) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          openDoc(m[1]);
        });
      } else if (/^https?:/i.test(href)) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    });
  }

  function closeReader() {
    reader.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  closeBtn.addEventListener("click", closeReader);
  reader.addEventListener("click", function (e) { if (e.target === reader) closeReader(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !reader.hidden) closeReader();
  });

  /* ─── checklist persistée ───────────────────────────────── */
  var KEY = "arthur-checklist-v1";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}

  var boxes = document.querySelectorAll("#checklist input[type=checkbox]");
  var progress = document.getElementById("progress");

  function updateProgress() {
    var done = 0;
    boxes.forEach(function (b) { if (b.checked) done++; });
    var msgs = [
      "on attaque quand tu veux !",
      "c'est parti ✊",
      "bon rythme, continue…",
      "plus que quelques cases…",
      "presque au bout !",
      "DOSSIER PRÊT — fonce déposer 🎉"
    ];
    var idx = done === 0 ? 0
      : done === boxes.length ? 5
      : Math.min(4, Math.ceil(done / boxes.length * 4));
    progress.textContent = done + " / " + boxes.length + " — " + msgs[idx];
  }

  boxes.forEach(function (b) {
    var k = b.getAttribute("data-k");
    b.checked = !!saved[k];
    b.addEventListener("change", function () {
      saved[k] = b.checked;
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
      updateProgress();
    });
  });
  updateProgress();

  /* ─── apparition en cascade des fiches ──────────────────── */
  document.querySelectorAll(".card").forEach(function (c, i) {
    c.style.animationDelay = Math.min(i * 70, 600) + "ms";
  });
})();
