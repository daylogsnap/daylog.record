// 사진 폴더를 읽어서 홈페이지(dist)를 만드는 스크립트. Cloudflare Pages가 자동으로 실행합니다.
const fs = require("fs"), path = require("path");
const ROOT = __dirname, OUT = path.join(ROOT, "dist");
const CATS = { "본식": "본식", "야외스냅": "야외 스냅", "가봉": "가봉", "웨딩데이": "웨딩데이" };
const IMG = /\.(jpe?g|png|webp|avif)$/i;
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "site.json"), "utf8"));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, "photos"), path.join(OUT, "photos"), { recursive: true });

// 파일 이름이 설명이 됩니다. "입장 직전.jpg" → "입장 직전". 카메라 기본 이름(IMG_1234 등)은 설명 없이.
const caption = f => {
  const n = f.replace(IMG, "").replace(/^\d+[_\-.\s]+/, "").trim();
  return /^(IMG|DSC|DSCF|_MG|_DSC|PXL|KakaoTalk)[\w\-]*$/i.test(n) || /^\d+$/.test(n) ? "" : n;
};
const files = dir => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter(f => IMG.test(f)).sort((a, b) => a.localeCompare(b, "ko", { numeric: true }))
  : [];

const photos = [];
for (const [folder, label] of Object.entries(CATS)) {
  for (const f of files(path.join(ROOT, "photos", folder))) {
    photos.push({ src: `photos/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`, cat: label, cap: caption(f) });
  }
}
const heroFile = files(path.join(ROOT, "photos", "대표"))[0];
const hero = heroFile ? `photos/${encodeURIComponent("대표")}/${encodeURIComponent(heroFile)}` : (photos[0] && photos[0].src) || "";

const data = { photos, hero, kakaoUrl: site.kakaoUrl || "", kakaoName: site.kakaoName || "" };
fs.writeFileSync(path.join(OUT, "photos.json"), JSON.stringify(data));

let html = fs.readFileSync(path.join(ROOT, "src", "index.html"), "utf8");
const og = hero && site.siteUrl ? `<meta property="og:image" content="${site.siteUrl.replace(/\/$/, "")}/${hero}">` : "";
html = html.replace("<!--OG_IMAGE-->", og);
fs.writeFileSync(path.join(OUT, "index.html"), html);
fs.copyFileSync(path.join(ROOT, "src", "app.js"), path.join(OUT, "app.js"));
console.log(`완료: 사진 ${photos.length}장, 대표 사진 ${hero ? "있음" : "없음"}`);
