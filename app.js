(function () {
  const $ = id => document.getElementById(id);
  const tones = ["var(--tile-a)", "var(--tile-b)", "var(--tile-c)"];
  const demo = [["본식", "식장 이름"], ["야외 스냅", "촬영 장소"], ["본식", "식장 이름"]];
  let cat = "all", albums = [];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function render(data) {
    albums = data.albums || [];
    const box = $("albums"); box.textContent = "";
    if (!albums.length) {
      demo.forEach((p, i) => {
        const card = el("div", "album"); const c = el("div", "cover");
        c.style.background = `linear-gradient(${160 + i * 9}deg,${tones[i % 3]},${tones[(i + 1) % 3]})`;
        card.append(c, el("div", "t", p[1]), el("div", "m", p[0] + " · 준비 중"));
        card.dataset.cat = p[0]; box.appendChild(card);
      });
    }
    albums.forEach((a, i) => {
      const b = el("button", "album"); b.type = "button"; b.dataset.cat = a.cat;
      const c = el("div", "cover"); const im = new Image(); im.src = a.cover; im.alt = a.title + " 대표 사진"; im.loading = "lazy"; c.appendChild(im);
      const m = el("div", "m"); m.append(el("span", "", a.cat), el("span", "", a.date), el("span", "", a.photos.length + "장"));
      b.append(c, el("div", "t", a.title), m);
      b.onclick = () => openAlbum(i, true);
      box.appendChild(b);
    });
    filter();
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
  function filter() { $("albums").querySelectorAll(".album").forEach(t => t.hidden = !(cat === "all" || t.dataset.cat === cat)); }
  document.querySelectorAll(".chip[data-cat]").forEach(c => c.onclick = () => {
    document.querySelectorAll(".chip[data-cat]").forEach(x => x.setAttribute("aria-pressed", x === c));
    cat = c.dataset.cat; filter();
  });

  // 앨범 화면 (폰 뒤로가기로 닫힘)
  const av = $("av");
  function openAlbum(i, push) {
    const a = albums[i];
    $("avMeta").textContent = [a.cat, a.date, a.photos.length + "장"].filter(Boolean).join(" · ");
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
  $("avBook").onclick = () => { closeAlbum(); history.replaceState(null, "", "#booking"); };
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
