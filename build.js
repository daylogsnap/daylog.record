// 사진 폴더를 읽어서 홈페이지(dist)를 만드는 스크립트. Cloudflare Pages가 자동으로 실행합니다.
// 폴더 구조:  photos/<카테고리>/<앨범(식장) 이름>/사진.jpg
//   예)       photos/본식/2026.05 더채플앳청담/01 입장.jpg
//   앨범 폴더에 소개.txt 를 넣으면 앨범 소개글로 나옵니다.
//   이름이 '대표'로 시작하는 사진이 앨범 표지가 됩니다. 없으면 첫 번째 사진.
const fs = require("fs"), path = require("path");
const ROOT = __dirname, OUT = path.join(ROOT, "dist"), PH = path.join(ROOT, "photos");
const CATS = { "본식": "본식", "야외스냅": "야외 스냅", "가봉": "가봉", "웨딩데이": "웨딩데이" };
const IMG = /\.(jpe?g|png|webp|avif)$/i;
// 페이지 파일은 맨 위(index.html, app.js)에 있으면 그걸 쓰고, 없으면 src 폴더 것을 씁니다.
const page = f => fs.existsSync(path.join(ROOT, f)) ? path.join(ROOT, f) : path.join(ROOT, "src", f);
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "site.json"), "utf8"));
const url = (...parts) => "photos/" + parts.map(encodeURIComponent).join("/");
const byName = (a, b) => a.localeCompare(b, "ko", { numeric: true });
const ls = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
const images = dir => ls(dir).filter(d => d.isFile() && IMG.test(d.name)).map(d => d.name).sort(byName);
const caption = f => {
  const n = f.replace(IMG, "").replace(/^\d+[_\-.\s]+/, "").replace(/^대표[_\-.\s]*/, "").trim();
  return /^(IMG|DSC|DSCF|_MG|_DSC|PXL|KakaoTalk)[\w\-]*$/i.test(n) || /^\d*$/.test(n) ? "" : n;
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
if (fs.existsSync(PH)) fs.cpSync(PH, path.join(OUT, "photos"), { recursive: true });

const albums = [];
const makeAlbum = (cat, label, folderParts, files, name) => {
  if (!files.length) return;
  const m = name.match(/^(\d{4}[.\-]\d{1,2}(?:[.\-]\d{1,2})?)\s+(.+)$/);
  const introFile = path.join(PH, ...folderParts, "소개.txt");
  const coverFile = files.find(f => /^대표/.test(f)) || files[0];
  albums.push({
    cat: label,
    title: m ? m[2] : name,
    date: m ? m[1].replace(/-/g, ".") : "",
    sortKey: name,
    intro: fs.existsSync(introFile) ? fs.readFileSync(introFile, "utf8").trim() : "",
    cover: url(...folderParts, coverFile),
    photos: files.map(f => ({ src: url(...folderParts, f), cap: caption(f) }))
  });
};
for (const [folder, label] of Object.entries(CATS)) {
  const dir = path.join(PH, folder);
  for (const d of ls(dir).filter(d => d.isDirectory())) {
    makeAlbum(folder, label, [folder, d.name], images(path.join(dir, d.name)), d.name);
  }
  // 카테고리 폴더에 바로 넣은 사진은 카테고리 이름의 앨범 하나로 묶음
  makeAlbum(folder, label, [folder], images(dir), label);
}
albums.sort((a, b) => byName(b.sortKey, a.sortKey));
albums.forEach(a => delete a.sortKey);

// 인스타 피드: photos/인스타 폴더 사진 (파일 이름순, 최대 12장)
const insta = images(path.join(PH, "인스타")).slice(0, 12).map(f => url("인스타", f));

const heroFile = images(path.join(PH, "대표"))[0];
const hero = heroFile ? url("대표", heroFile) : (albums[0] && albums[0].cover) || "";
fs.writeFileSync(path.join(OUT, "photos.json"),
  JSON.stringify({ albums, insta, hero, kakaoUrl: site.kakaoUrl || "", kakaoName: site.kakaoName || "" }));

let html = fs.readFileSync(page("index.html"), "utf8");
const og = hero && site.siteUrl ? `<meta property="og:image" content="${site.siteUrl.replace(/\/$/, "")}/${hero}">` : "";
fs.writeFileSync(path.join(OUT, "index.html"), html.replace("<!--OG_IMAGE-->", og));
fs.copyFileSync(page("app.js"), path.join(OUT, "app.js"));
console.log(`완료: 인스타 ${insta.length}장, 앨범 ${albums.length}개, 사진 ${albums.reduce((n, a) => n + a.photos.length, 0)}장`);
