(function () {
  const $ = id => document.getElementById(id);
  const tones = ["var(--tile-a)", "var(--tile-b)", "var(--tile-c)"];
  const demo = [["본식", "식장 이름"], ["야외 스냅", "촬영 장소"], ["본식", "식장 이름"]];
  let albums = [], needs = [], st = { venue: "all", concept: "all", need: null };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const VENUE_ORDER = ["호텔", "웨딩홀", "루프탑·가든", "채플·교회", "레스토랑", "전통혼례장"];
  const CONCEPT_ORDER = ["밝은 자연광", "화사한 플라워", "캔들·무드", "스몰웨딩", "전통·한복", "가족·하객 중심"];
  const camTag = a => a.camera ? (a.camera.includes("아이폰") ? "아이폰 촬영" : a.camera + " 촬영") : "";
  const tagsOf = a => [a.venue, ...(a.concepts || []), camTag(a)].filter(Boolean);
  const byOrder = order => (x, y) => { const i = order.indexOf(x), j = order.indexOf(y); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || x.localeCompare(y, "ko"); };
  const uniq = arr => [...new Set(arr)];

  // 상품 이름으로 가격 찾기 (상품 섹션의 카드에서 읽어서 가격을 두 군데 따로 관리하지 않음)
  function priceOf(name) {
    for (const art of document.querySelectorAll("#packages article")) {
      const h = art.querySelector("h4"); if (!h) continue;
      if (h.textContent.replace(/\s+/g, " ").trim() === name) { const p = art.querySelector(".pr b, .sp-pr"); return p ? p.textContent.trim() : ""; }
    }
    return "";
  }
  function bookWith(pkg, venue) {
    const sel = $("pkg"); if (pkg && [...sel.options].some(o => o.text === pkg)) sel.value = pkg;
    if (venue && !$("venue").value) $("venue").placeholder = "예식장 이름 (예: " + venue + ")";
    $("booking").scrollIntoView({ behavior: "smooth" });
  }

  function chips(box, values, key, order) {
    box.textContent = "";
    ["all", ...values.sort(byOrder(order))].forEach(v => {
      const c = el("button", "chip", v === "all" ? "전체" : v); c.type = "button";
      c.setAttribute("aria-pressed", st[key] === v);
      c.onclick = () => { st[key] = v; st.need = null; sync(); };
      box.appendChild(c);
    });
  }

  function render(data) {
    albums = data.albums || []; needs = (data.needs || []).filter(n => albums.some(a => tagsOf(a).includes(n.tag)));
    const box = $("albums"); box.textContent = "";
    if (!albums.length) {
      demo.forEach((p, i) => {
        const card = el("div", "album"); const c = el("div", "cover");
        c.style.background = `linear-gradient(${160 + i * 9}deg,${tones[i % 3]},${tones[(i + 1) % 3]})`;
        card.append(c, el("div", "t", p[1]), el("div", "m", p[0] + " · 준비 중")); box.appendChild(card);
      });
    }
    albums.forEach((a, i) => {
      const b = el("button", "album"); b.type = "button";
      const c = el("div", "cover"); const im = new Image(); im.src = a.cover; im.alt = a.title + " 대표 사진"; im.loading = "lazy"; c.appendChild(im);
      const m = el("div", "m"); m.append(el("span", "", a.venue || a.cat), el("span", "", a.date), el("span", "", a.photos.length + "장"));
      const t = el("div", "tags"); (a.concepts || []).forEach(x => t.appendChild(el("span", "tag", x))); if (camTag(a)) t.appendChild(el("span", "tag cam", camTag(a)));
      b.append(c, el("div", "t", a.title), m, t);
      b.onclick = () => openAlbum(i, true);
      box.appendChild(b);
    });
    const nb = $("needs"); nb.textContent = "";
    needs.forEach(n => {
      const b = el("button", "need"); b.type = "button"; b.dataset.tag = n.tag;
      b.append(el("b", "", n.title), el("span", "", n.desc), el("small", "", "추천 · " + n.pkg));
      b.onclick = () => { st.need = st.need === n ? null : n; st.venue = "all"; st.concept = "all"; sync(); if (st.need) $("rec").scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      nb.appendChild(b);
    });
    $("needs").parentElement.hidden = !needs.length;
    sync();
    const insta = data.insta || [];
    if (insta.length) {
      // 같은 사진 묶음을 두 번 이어 붙여서 끊김 없이 계속 흐르게 함
      const track = el("div", "insta-track");
      [0, 1].forEach(copy => insta.forEach(src => {
        const a = el("a"); a.href = "https://www.instagram.com/daylog.record/"; a.target = "_blank"; a.rel = "noopener";
        a.setAttribute("aria-label", "인스타그램 @daylog.record 보기");
        if (copy) { a.setAttribute("aria-hidden", "true"); a.tabIndex = -1; }
        const im = new Image(); im.src = src; im.alt = copy ? "" : "데이로그레코드 인스타그램 사진"; im.loading = "lazy";
        a.appendChild(im); track.appendChild(a);
      }));
      track.style.setProperty("--dur", Math.max(24, insta.length * 6) + "s");
      $("instaGrid").appendChild(track);
      $("instagram").hidden = false;
    }
    if (data.hero) {
      const im = new Image(); im.src = data.hero; im.alt = "대표 사진"; im.fetchPriority = "high";
      $("hero").prepend(im); $("heroCap").hidden = true;
    }
    $("kakaoLine").textContent = data.kakaoName ? "카카오톡 채널 " + data.kakaoName : "카카오톡 채널 준비 중";
    if (data.kakaoUrl) $("kakao").href = data.kakaoUrl; else $("kakao").hidden = true;
    const m = location.hash.match(/^#album(\d+)$/); if (m && albums[+m[1]]) openAlbum(+m[1], false);
  }
  function sync() {
    const venues = uniq(albums.map(a => a.venue).filter(Boolean)), concepts = uniq(albums.flatMap(a => a.concepts || []));
    chips($("fVenue"), venues, "venue", VENUE_ORDER); chips($("fConcept"), concepts, "concept", CONCEPT_ORDER);
    $("fVenue").closest(".frow").hidden = !venues.length; $("fConcept").closest(".frow").hidden = !concepts.length;
    let shown = 0;
    $("albums").querySelectorAll("button.album").forEach((t, i) => {
      const a = albums[i], tags = tagsOf(a);
      const ok = (st.venue === "all" || a.venue === st.venue) && (st.concept === "all" || (a.concepts || []).includes(st.concept)) && (!st.need || tags.includes(st.need.tag));
      t.hidden = !ok; if (ok) shown++;
    });
    $("empty").hidden = !albums.length || shown > 0;
    $("needs").querySelectorAll(".need").forEach(b => b.setAttribute("aria-pressed", !!st.need && b.dataset.tag === st.need.tag));
    const n = st.need; $("rec").hidden = !n;
    if (n) {
      $("recTitle").textContent = n.title; $("recCount").textContent = "비슷한 실제 촬영 앨범 " + shown + "개";
      $("recPkg").textContent = n.pkg; $("recPrice").textContent = priceOf(n.pkg);
    }
  }
  $("recBook").onclick = () => st.need && bookWith(st.need.pkg);
  $("recClear").onclick = () => { st.need = null; sync(); };

  // 앨범 화면 (폰 뒤로가기로 닫힘)
  const av = $("av"); let curAlbum = null;
  function openAlbum(i, push) {
    const a = albums[i];
    $("avMeta").textContent = [a.venue || a.cat, a.date, a.photos.length + "장", camTag(a)].filter(Boolean).join(" · ");
    const tg = $("avTags"); tg.textContent = ""; (a.concepts || []).forEach(x => tg.appendChild(el("span", "tag", x)));
    $("avRec").hidden = !(a.forWho || a.pkg);
    $("avFor").textContent = a.forWho || ""; $("avPkg").textContent = a.pkg ? "추천 상품 · " + a.pkg : ""; $("avPrice").textContent = a.pkg ? priceOf(a.pkg) : "";
    $("avBook").textContent = a.pkg ? a.pkg + "으로 문의하기" : "이 분위기로 예약 문의하기";
    curAlbum = a;
    $("avTitle").textContent = a.title;
    $("avIntro").textContent = a.intro; $("avIntro").hidden = !a.intro;
    const g = $("avGrid"); g.textContent = "";
    a.photos.forEach(p => {
      const b = el("button", "tile"); b.type = "button";
      const im = new Image(); im.src = p.src; im.loading = "lazy"; im.alt = a.title + (p.cap ? " · " + p.cap : "");
      b.appendChild(im); b.setAttribute("aria-label", im.alt + " 크게 보기"); b.onclick = () => openLb(p, a);
      g.appendChild(b);
    });
    av.hidden = false; av.scrollTop = 0; document.body.style.overflow = "hidden";
    if (push) history.pushState({ album: i }, "", "#album" + i);
    $("avBack").focus();
  }
  function closeAlbum() { av.hidden = true; document.body.style.overflow = ""; }
  $("avBack").onclick = () => { if (history.state && history.state.album != null) history.back(); else { closeAlbum(); history.replaceState(null, "", "#portfolio"); } };
  $("avBook").onclick = e => { e.preventDefault(); closeAlbum(); history.replaceState(null, "", "#booking"); if (curAlbum) bookWith(curAlbum.pkg, curAlbum.title); };
  $("avBack2").onclick = () => $("avBack").click();
  window.addEventListener("popstate", () => { if (!/^#album/.test(location.hash)) closeAlbum(); lb.hidden = true; });

  const lb = $("lb");
  function openLb(p, a) { $("lbph").hidden = true; const im = $("lbimg"); im.src = p.src; im.alt = p.cap || a.title; $("lbcap").textContent = a.title + (p.cap ? " · " + p.cap : ""); lb.hidden = false; $("lbx").focus(); }
  $("lbx").onclick = () => lb.hidden = true;
  lb.onclick = e => { if (e.target === lb) lb.hidden = true; };
  document.addEventListener("keydown", e => { if (e.key !== "Escape") return; if (!lb.hidden) lb.hidden = true; else if (!av.hidden) $("avBack").click(); });

  // 예약 문의
  ["name", "phone", "venue", "memo", "date", "time"].forEach(id => $(id).value = "");
  const form = $("form"), done = $("done"), err = $("err"), v = id => $(id).value.trim();
  form.addEventListener("submit", e => {
    e.preventDefault(); const miss = [];
    if (!v("name")) miss.push("성함");
    if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(v("phone"))) miss.push("연락처(010-0000-0000 형식)");
    if (!v("date")) miss.push("날짜");
    if (!$("agree").checked) miss.push("개인정보 동의");
    if (miss.length) { err.textContent = miss.join(", ") + "을(를) 확인해 주세요."; err.hidden = false; return; }
    err.hidden = true;
    const d = new Date(v("date") + "T00:00"), days = ["일", "월", "화", "수", "목", "금", "토"];
    $("summary").textContent = `[데이로그레코드 예약 문의]
성함: ${v("name")}
연락처: ${v("phone")}
날짜: ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]}) ${v("time")}
상품: ${v("pkg")}
장소: ${v("venue") || "미정"}
메모: ${v("memo") || "-"}`;
    form.hidden = true; done.hidden = false;
  });
  $("copy").onclick = async e => {
    try { await navigator.clipboard.writeText($("summary").textContent); e.target.textContent = "복사됨"; }
    catch (_) { const r = document.createRange(); r.selectNodeContents($("summary")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); e.target.textContent = "선택됨, 복사하세요"; }
  };
  // 카톡 버튼을 누르면 문의 내용을 먼저 복사해 둠 (채팅방에 붙여넣기만 하면 됨)
  $("kakao").addEventListener("click", () => { try { navigator.clipboard.writeText($("summary").textContent); } catch (_) {} });
  $("again").onclick = () => { done.hidden = true; form.hidden = false; $("copy").textContent = "내용 복사"; };

  fetch("photos.json", { cache: "no-cache" }).then(r => r.json()).then(render)
    .catch(() => render({ albums: [], hero: "", kakaoUrl: "", kakaoName: "" }));
})();
