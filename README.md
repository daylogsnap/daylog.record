# daylog.record 웨딩스냅 홈페이지

## 처음 한 번만: 사이트 올리기 (무료)

1. **GitHub 가입** (github.com) 후 오른쪽 위 `+` → `New repository`
   - 이름: `daylog-record` / Public 선택 → `Create repository`
2. 저장소 화면에서 `uploading an existing file` 클릭
   - 이 압축 파일을 푼 폴더 안의 **내용 전체**(build.js, site.json, src, photos 등)를 드래그 → `Commit changes`
3. **Cloudflare 가입** (dash.cloudflare.com) → `Workers & Pages` → `Pages` → Git 저장소 연결
   - GitHub 연결 후 `daylog-record` 저장소 선택
   - Build command: `node build.js`
   - Build output directory: `dist`
   - `Save and Deploy`
4. 1~2분 뒤 `daylog-record.pages.dev` 주소로 홈페이지가 열립니다.

## 사진 올리기

1. GitHub 저장소에서 `photos` → 원하는 폴더 클릭
   - `대표` : 메인 화면 큰 사진 (첫 번째 파일 1장만 사용)
   - `본식` / `야외스냅` / `가봉` / `웨딩데이` : 포트폴리오 카테고리
2. `Add file` → `Upload files` → 사진 드래그 → `Commit changes`
3. 1~2분 뒤 홈페이지에 자동으로 반영됩니다.

- 폰에서는 브라우저로 github.com 에 들어가서 같은 방법으로 올리면 돼요.
- **파일 이름이 사진 설명**이 됩니다. `입장 직전.jpg` → "입장 직전"
  - `IMG_1234.jpg` 같은 카메라 기본 이름은 설명 없이 사진만 나와요.
- **순서**는 파일 이름순이에요. 앞에 번호를 붙이면 정렬돼요: `01 입장 직전.jpg`, `02 혼인서약.jpg` (번호는 화면에 안 보임)
- 라이트룸에서 **긴 변 2000px, JPG 품질 80~85**로 내보내면 홈페이지가 빨리 열려요. 원본(수십 MB)은 올리지 마세요.

## 사진 지우기

사진 파일 클릭 → 오른쪽 위 `…` → `Delete file` → `Commit changes`

## 카카오톡 채널 연결

`site.json` 클릭 → 연필 아이콘(편집) → 아래처럼 채우고 `Commit changes`

```json
{
  "kakaoUrl": "https://pf.kakao.com/_채널ID/chat",
  "kakaoName": "@데이로그레코드",
  "siteUrl": "https://daylog-record.pages.dev"
}
```

- `kakaoUrl` : 카카오톡 채널 관리자센터에서 확인하는 채팅 주소
- `siteUrl` : 홈페이지 주소 (카톡·인스타에 링크 공유할 때 대표 사진 미리보기용)

## 글자·상품 수정

`src/index.html` 에 문구와 상품 구성이 들어 있어요. 수정이 필요하면 Claude에게 바꿀 내용을 말해주면 됩니다.
