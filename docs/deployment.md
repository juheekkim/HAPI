# Deployment — 서버 배포/실행 가이드

> Source of truth: `package.json`, `src/app.js`, `src/config/database.js`, `src/scripts/*.js`, `.env.example`, `db/scripts/**`. 코드가 바뀌면 이 문서도 갱신한다.
> 로컬 개발 환경은 `development.md`, DB 구조는 `db-schema.md` 참고.

## 1. 요약 (기존 서버 업데이트)
```bash
git pull
npm ci                     # 서버에서 직접 설치 (node_modules 복사 금지)
npm run db:scripts:status  # 새로 실행될 스크립트 확인
npm run db:scripts         # 미실행 DB 스크립트만 반영
pm2 restart hapi           # 앱 재시작
```
최초 배포라면 아래 2~6장을 순서대로 진행한다.

## 2. 서버 준비물
| 항목 | 내용 |
|---|---|
| Node.js | 22 LTS 권장(로컬 검증 버전 v22). 챗봇이 Node 내장 `fetch`를 쓰므로 최소 18 이상. `package.json`에 `engines` 지정 없음 |
| PostgreSQL | 18.x 권장(개발 DB 18.4). `28`/`29` 스냅샷은 `pg_dump` 18 출력이지만 실행기가 호환 라인을 제거하므로 16/17에서도 실행 가능 |
| git | 저장소 `https://github.com/juheekkim/HAPI` 접근 권한 |
| 프로세스 관리자 | `pm2`(`npm i -g pm2`) 권장. Linux는 `systemd`도 가능 |
| 아웃바운드 네트워크 | 사용하는 기능별로 서버에서 접근 가능해야 함: `SANDBOX_GATEWAY_BASE_URL`(API 테스트), `MCI_SERVICE_BASE_URL`(MCI 가져오기), `CHATBOT_LLM_BASE_URL`(챗봇), Anthropic API(이미지 자동입력) |

## 3. 소스 받기 / 패키지 설치
```bash
git clone https://github.com/juheekkim/HAPI.git
cd HAPI
npm ci
```
- **`npm ci`(또는 `npm install`)는 반드시 서버에서 실행한다.** `bcrypt`는 OS별 네이티브 빌드라, 다른 PC(예: Windows)의 `node_modules`를 복사하면 `invalid ELF header` 등으로 기동이 실패한다.

## 4. 환경변수 (`.env`)
`.env`는 git에 없으므로 서버에서 직접 만든다: `cp .env.example .env` 후 값 입력.

| 키 | 필수 | 설명 |
|---|---|---|
| `PORT` | 선택 | 리스닝 포트(기본 3000). 포트 변경은 코드가 아니라 이 값으로 한다 |
| `NODE_ENV` | 선택 | `production`이면 아래 **주의 1** 동작이 켜짐 |
| `DATABASE_URL` | 필수 | `postgresql://user:pass@host:5432/hapi_db` |
| `SESSION_SECRET` | 필수 | 충분히 긴 임의 문자열. `change-me` 그대로 두지 말 것 |
| `ANTHROPIC_API_KEY` | 선택 | API 등록 이미지 자동입력. 없으면 해당 기능 501 |
| `MCI_SERVICE_BASE_URL` | 선택 | MCI 서비스 주소 가져오기. 없으면 501 |
| `SANDBOX_GATEWAY_BASE_URL` | 선택 | API Reference 테스트 샌드박스. 없으면 501 |
| `CHATBOT_LLM_API_KEY` / `CHATBOT_LLM_BASE_URL` / `CHATBOT_LLM_MODEL` | 선택 | 챗봇·AI 어시스턴트. 없으면 메시지 전송 501 |

### 주의 1 — `NODE_ENV=production`의 영향
- **세션 쿠키 `secure: true`** (`src/app.js`): 브라우저↔앱 구간이 HTTPS가 아니면 로그인 쿠키가 발급되지 않아 **로그인이 계속 로그인 화면으로 돌아온다.**
  - 앱이 직접 HTTP로 서비스(사내망 등) → `NODE_ENV`를 `production`으로 두지 않는다.
  - Nginx/로드밸런서가 HTTPS를 처리하고 앱은 HTTP로 받는 구조 → 현재 코드에 `app.set('trust proxy', 1)`이 없어 쿠키가 발급되지 않는다. 이 구조로 운영하려면 해당 설정 추가가 필요 **[미적용]**.
- **DB SSL 연결** (`src/config/database.js`): `ssl: { rejectUnauthorized: false }`로 접속한다. DB 서버가 SSL을 지원하지 않으면 연결 실패.

### 주의 2 — 세션 저장소
- 세션은 별도 저장소 없이 **프로세스 메모리**(express-session 기본 MemoryStore)에 저장된다.
  - 앱을 재시작하면 모든 사용자가 로그아웃된다(배포 시 공지).
  - **pm2 cluster 모드/다중 인스턴스 금지** — 인스턴스마다 세션이 달라 로그인이 풀린다. 단일 인스턴스(fork 모드)로 실행한다.

## 5. DB 준비 / 스크립트 실행
실행기 상세는 `development.md`의 "DB 스크립트 실행기" 참고. 실행 이력은 `schema_migrations` 테이블에 기록된다.

### 5-1. 새 DB(빈 DB)에 최초 배포
```bash
# PostgreSQL에서 DB 생성 (예: createdb -U postgres hapi_db)
npm run db:scripts      # 01부터 전체 실행
npm run db:setup        # admin / admin123 계정 생성
```
- `npm run db:setup`은 admin 비밀번호를 **항상 `admin123`으로 덮어쓴다.** 최초 1회만 실행하고, 로그인 후 즉시 비밀번호를 변경한다(운영 DB에서 재실행 금지).
- 01~`29` 사이 시드/스냅샷 스크립트에 개발용 계정·데이터가 포함된다(`16_seed_dev_data.sql`, `28`/`29` 스냅샷). 운영 공개 전 불필요한 계정은 정리한다 **[Needs verification: 운영 반영 대상 데이터 범위 팀 확정 필요]**.

### 5-2. 이미 데이터가 있는 DB에 처음 이 실행기를 쓰는 경우
- 이력이 없는 기존 DB에서 `npm run db:scripts`를 실행하면 **안전장치로 거부**된다(`28`/`29` 스냅샷이 데이터를 TRUNCATE하는 사고 방지).
- 그 DB에 이미 반영된 마지막 스크립트 번호를 확인한 뒤 1회만 기록한다:
```bash
npm run db:scripts -- --baseline 51   # 51번까지 반영된 DB 예시 (실제 실행 안 함, 기록만)
npm run db:scripts                    # 이후 번호만 실행
```
- 번호를 모르면 최근 스크립트의 결과(테이블/컬럼/데이터)가 DB에 있는지 확인해 판단한다. 잘못 크게 잡으면 필요한 스크립트가 건너뛰어진다.

### 5-3. 이후 업데이트
```bash
npm run db:scripts:status   # 미실행 목록 확인
npm run db:scripts          # 미실행만 실행, 실패 시 그 파일에서 중단
```
- 실패하면 원인을 해결하고 다시 실행하면 실패한 파일부터 이어서 실행된다.
- **배포 전 DB 백업 권장**: `pg_dump -U postgres -Fc hapi_db > hapi_db_YYYYMMDD.dump`

## 6. 앱 실행
### pm2 (Linux/Windows 공통, 권장)
```bash
pm2 start src/app.js --name hapi     # fork 모드 단일 인스턴스 (cluster 금지, 4장 주의 2)
pm2 save                             # 현재 프로세스 목록 저장
pm2 startup                          # (Linux) 재부팅 시 자동 시작 등록 — 출력되는 명령 실행
pm2 logs hapi                        # 로그 확인
pm2 restart hapi                     # 재시작 (코드/.env 변경 후)
```
- `.env`는 앱 기동 시 `dotenv`가 작업 디렉터리 기준으로 읽는다. pm2는 저장소 루트에서 실행한다.
- Windows 서버에서 재부팅 자동 시작이 필요하면 `pm2-windows-startup` 등 별도 구성 또는 작업 스케줄러 사용.

### 단순 실행 (테스트용)
```bash
npm start     # 터미널을 닫으면 종료됨
```

## 7. 기동 확인
1. `pm2 logs hapi`에 `HAPI Portal → http://localhost:<PORT>` 출력 확인.
2. 브라우저에서 `/auth/login` 접속 → admin 로그인 → `/home` 이동 확인(로그인 반복되면 4장 주의 1).
3. 메뉴 확인: API Reference(`?doc=` 전환), 관리자 > API 관리/역할 관리, 지원 메뉴.
4. 선택 기능: API 테스트 샌드박스, 챗봇 메시지 전송(501이면 해당 `.env` 키 누락).
5. 권한 확인: AI 어시스턴트/챗봇 위젯은 역할에 `/assistant` 메뉴가 매핑돼 있어야 노출(`chatbot.md` 보안 범위).

## 8. 배포 전 체크리스트
- [ ] 서버에서 `npm ci` 실행 (node_modules 복사 X)
- [ ] `.env` 작성: `DATABASE_URL`, 운영용 `SESSION_SECRET`, 필요한 기능 키
- [ ] `NODE_ENV`/HTTPS 구성 결정 (4장 주의 1)
- [ ] DB 백업
- [ ] 새 DB → `db:scripts` + `db:setup` / 기존 DB 최초 → `--baseline <N>` 후 `db:scripts`
- [ ] `npm run db:scripts:status`가 미실행 0개
- [ ] pm2 단일 인스턴스로 기동, `pm2 save`
- [ ] admin 로그인 확인 후 기본 비밀번호 변경
- [ ] 외부 연계 URL(샌드박스/MCI/AI 허브) 서버에서 접근 가능 여부 확인
- [ ] 재시작 시 전원 로그아웃됨을 사용자에게 공지
