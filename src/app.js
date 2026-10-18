(function () {
  const $ = id => document.getElementById(id);
  const tones = ["var(--tile-a)", "var(--tile-b)", "var(--tile-c)"];
  const demo = [["본식", "3/4"], ["야외 스냅", "4/5"], ["본식", "4/3"], ["웨딩데이", "3/4"], ["가봉", "4/5"], ["야외 스냅", "1/1"]];
  let cat = "all";

  function tile(cat, inner) {
    const b = document.createElement("button");
    b.className = "tile"; b.dataset.cat = cat; b.append(...inner);
    $("grid").appendChild(b); return b;
  }
  function render(data) {
    $("grid").textContent = "";
    if (!data.photos.length) {
      demo.forEach((p, i) => {
        const ph = document.createElement("div"); ph.className = "ph";
        ph.style.cssText = `aspect-ratio:${p[1]};background:linear-gradient(${160 + i * 7}deg,${tones[i % 3]},${tones[(i + 1) % 3]})`;
        const b = tile(p[0], [ph]); b.tabIndex = -1; b.style.cursor = "default";
      });
    }
    data.photos.forEach(p => {
      const img = new Image(); img.src = p.src; img.loading = "lazy"; img.alt = p.cat + (p.cap ? " · " + p.cap : "");
      const parts = [img];
      if (p.cap) { const m = document.createElement("span"); m.className = "meta"; m.style.cssText = "color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4)"; m.textContent = p.cap; parts.push(m); }
      const b = tile(p.cat, parts); b.setAttribute("aria-label", img.alt + " 크게 보기"); b.onclick = () => openLb(p);
    });
    filter();
    if (data.hero) {
      const im = new Image(); im.src = data.hero; im.alt = "대표 사진"; im.fetchPriority = "high";
      $("hero").prepend(im); $("heroCap").hidden = true;
    }
    $("kakaoLine").textContent = data.kakaoName ? "카카오톡 채널 " + data.kakaoName : "카카오톡 채널 준비 중";
    if (data.kakaoUrl) $("kakao").href = data.kakaoUrl; else $("kakao").hidden = true;
  }
  function filter() { $("grid").querySelectorAll(".tile").forEach(t => t.hidden = !(cat === "all" || t.dataset.cat === cat)); }
  document.querySelectorAll(".chip[data-cat]").forEach(c => c.onclick = () => {
    document.querySelectorAll(".chip[data-cat]").forEach(x => x.setAttribute("aria-pressed", x === c));
    cat = c.dataset.cat; filter();
  });

  const lb = $("lb");
  function openLb(p) { $("lbph").hidden = true; const im = $("lbimg"); im.src = p.src; im.alt = p.cap || p.cat; $("lbcap").textContent = p.cat + (p.cap ? " · " + p.cap : ""); lb.hidden = false; $("lbx").focus(); }
  $("lbx").onclick = () => lb.hidden = true;
  lb.onclick = e => { if (e.target === lb) lb.hidden = true; };
  document.addEventListener("keydown", e => { if (e.key === "Escape") lb.hidden = true; });

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
    .catch(() => render({ photos: [], hero: "", kakaoUrl: "", kakaoName: "" }));
})();
