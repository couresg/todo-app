# 할 일 관리 앱 - 프로젝트 계획

> 상태: **pending approval**
> 근거 문서: [docs/PRD.md](PRD.md)
> 작성일: 2026-10-27

---

## 0. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript | 사용자 지정 |
| API | Next.js API Route (`src/app/api/**/route.ts` Route Handler) | 사용자 지정 |
| DB | MongoDB | 사용자 지정. 접속 정보는 `.env.local`의 `MONGODB_URI` |
| ODM | Mongoose | 스키마·검증·인덱스 정의 |
| 입력 검증 | Zod | API 요청 본문·쿼리 검증 |
| 드래그 앤 드롭 | dnd-kit | 컬럼 간 이동 + 컬럼 내 정렬(P1) |
| 서버 상태 | TanStack Query | 낙관적 업데이트 + 실패 시 롤백 |
| 테스트 | Vitest + mongodb-memory-server, Playwright | 테스트는 메모리 MongoDB 사용 |
| 인증 | 없음 (단일 사용자) | PRD 2장 "개인 사용자" |

---

## 1. 요구사항 요약

- 3단계 계층: **1년 목표(Goal)** ← N:1 ← **주간 계획(WeeklyPlan)** ← N:1 ← **할 일(Todo)** (PRD 4장 "구조 연결")
- 할 일 상태 `todo / doing / done`, 생성 기본값 `todo` (PRD 4장 "상태 관리")
- 보드에서 드래그 앤 드롭으로 상태 변경, 즉시 저장, 실패 시 원래 컬럼으로 롤백 (PRD 4장)
- 상위 항목 삭제 시 하위 항목은 유지하고 연결만 해제 (PRD 4장)
- 주간 진행률 = `done 수 ÷ 연결된 전체 할 일 수 × 100`, 0개면 0% (PRD 4장)
- P1: 목표 진행률(주간 진행률 평균), 진행 바, 컬럼 내 순서 변경, 미연결 할 일 모아 보기 (PRD 4장 P1)

---

## 2. 핵심 설계 결정

### 2.1 진행률은 저장하지 않고 조회 시 집계한다
PRD가 정한 재계산 시점(생성, 삭제, 상태 변경, 연결 변경)마다 저장값을 갱신하면 경로 하나만 빠져도 값이 틀어진다. 주간 계획 조회 시 `todos` 컬렉션을 `$match { weeklyPlanId } → $group { _id: "$status", count }`로 집계하면 모든 변경 경로에서 항상 정확하다.
- 계산식은 순수 함수 `calcWeeklyProgress({done, total})`, `calcGoalProgress(progresses[])`로 분리해 단위 테스트한다.
- 반올림: `Math.round` 정수. 예: 1/3 → 33%.
- 클라이언트는 할 일 mutation이 끝나면 `weekly-plans`(와 `goals`) 쿼리를 무효화해 화면을 갱신한다.

### 2.2 연결 해제는 애플리케이션 코드에서 처리한다
MongoDB에는 외래 키·`ON DELETE SET NULL`이 없다. 삭제 API에서 다음 순서로 처리한다.
1. 부모 문서 삭제 (`WeeklyPlan.deleteOne`)
2. 자식 연결 해제 (`Todo.updateMany({ weeklyPlanId: id }, { $set: { weeklyPlanId: null } })`)

트랜잭션은 레플리카셋이 필요해 쓰지 않는다. 2단계가 실패해 남는 끊긴 참조는 **조회 시 존재하지 않는 부모 = 미연결로 취급**해 화면에서 일관되게 보이게 한다 (진행률 집계는 부모 기준이라 영향 없음).

### 2.3 참조 무결성은 쓰기 시 검사한다
할 일 생성·수정 시 `weeklyPlanId`, 주간 계획 생성·수정 시 `goalId`가 실제로 존재하는지 확인하고 없으면 400을 반환한다. 잘못된 ObjectId 형식도 400.

### 2.4 날짜는 `YYYY-MM-DD` 문자열로 저장한다
`Date` 타입은 시간대에 따라 날짜가 하루씩 밀린다. 할 일 `date`, 주간 계획 `weekStart`/`weekEnd`를 문자열로 저장하면 정렬·범위 비교도 문자열 비교로 정확하다.
- 주 시작은 월요일. `weekEnd = weekStart + 6일`을 서버에서 계산한다.

### 2.5 드래그 앤 드롭은 낙관적 업데이트 + 롤백
1. 드롭 즉시 캐시에서 카드를 새 컬럼으로 이동 (`onMutate`에서 이전 스냅샷 보관)
2. `PATCH /api/todos/:id { status }`
3. 실패 시 스냅샷 복원 + 오류 토스트
4. `onSettled`에서 todos·weekly-plans·goals 쿼리 무효화

### 2.6 MongoDB 연결 캐싱
개발 모드 HMR마다 연결이 늘어나지 않도록 `src/lib/db.ts`에서 `globalThis`에 연결 Promise를 캐싱한다.

---

## 3. 데이터 모델 (`src/models/*.ts`, Mongoose)

```ts
// Goal
{ title: string (required, trim, 1~100자),
  year: number (required, 2000~2100),
  createdAt, updatedAt }

// WeeklyPlan
{ title: string (required),
  weekStart: string "YYYY-MM-DD" (월요일),
  weekEnd: string "YYYY-MM-DD",
  goalId: ObjectId | null (ref: Goal, default null),
  createdAt, updatedAt }
index: { goalId: 1 }, { weekStart: 1 }

// Todo
{ title: string (required),
  date: string "YYYY-MM-DD",
  status: "todo" | "doing" | "done" (default "todo"),
  sortOrder: number (default 0, P1),
  weeklyPlanId: ObjectId | null (ref: WeeklyPlan, default null),
  createdAt, updatedAt }
index: { date: 1 }, { weeklyPlanId: 1, status: 1 }
```

API 응답은 `_id` → `id` 문자열로 변환한 DTO로 내보낸다 (`src/server/dto.ts`).

---

## 4. API 설계 (`src/app/api/**/route.ts`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET / POST | `/api/goals` | 목록(P1: 진행률 포함) / 생성 `{title, year}` |
| GET / PATCH / DELETE | `/api/goals/[id]` | 조회 / 수정 / 삭제 + 연결 주간 계획의 `goalId` 해제 |
| GET / POST | `/api/weekly-plans` | 목록(진행률 포함, `?goalId=` 필터) / 생성 `{title, weekStart, goalId?}` |
| GET / PATCH / DELETE | `/api/weekly-plans/[id]` | 조회 / 수정 / 삭제 + 연결 할 일의 `weeklyPlanId` 해제 |
| GET | `/api/todos?date=YYYY-MM-DD` | 일자별 목록 |
| GET | `/api/todos?weeklyPlanId=` | 주간 계획별 목록 (보드 필터) |
| GET | `/api/todos?unlinked=true` | 미연결 할 일 (P1) |
| POST | `/api/todos` | 생성 `{title, date, weeklyPlanId?}` → status `todo` |
| PATCH | `/api/todos/[id]` | 수정 `{title?, date?, status?, weeklyPlanId?, sortOrder?}` |
| DELETE | `/api/todos/[id]` | 단건 삭제 |
| PATCH | `/api/todos/reorder` | (P1) `{status, orderedIds[]}` 컬럼 내 순서 일괄 저장 |

공통 규칙
- 요청 검증: `src/lib/validation.ts` Zod 스키마. 실패 → 400 `{ error, details }`
- 리소스 없음 → 404, 연결 대상 없음 → 400
- 핸들러는 얇게, 로직은 `src/server/services/*.ts`에 둔다 (테스트 대상)

---

## 5. 구현 단계

### M0. 프로젝트 셋업
- `create-next-app` (TypeScript, App Router, ESLint, `src/` 디렉터리)
- 패키지: `mongoose zod @tanstack/react-query @dnd-kit/core @dnd-kit/sortable`, 개발: `vitest mongodb-memory-server @playwright/test`
- `.env.local.example`에 `MONGODB_URI=mongodb://localhost:27017/todo-app`
- `src/lib/db.ts` 연결 캐싱 (2.6)
- `docs/CLAUDE.md`에 실행·테스트 명령 기록
- **완료 기준**: `npm run dev` 기동, `npm test`·`npx playwright test`가 빈 상태로 통과, `/api/health`가 DB 연결 시 200

### M1. 모델 + 도메인 로직
- `src/models/Goal.ts`, `WeeklyPlan.ts`, `Todo.ts` (3장)
- `src/lib/progress.ts`, `src/lib/week.ts`(`toWeekStart`, `addDays`, `weekEndOf`), `src/lib/validation.ts`
- **완료 기준**: 단위 테스트 U1~U6 통과

### M2. 서비스 + API
- `src/server/services/{goals,weeklyPlans,todos}.ts`: CRUD, 참조 검사(2.3), 연결 해제(2.2), 진행률 집계(2.1)
- `src/app/api/**/route.ts` (4장)
- **완료 기준**: 통합 테스트 I1~I9 통과 (mongodb-memory-server)

### M3. CRUD 화면
- `src/app/goals/page.tsx`: 1년 목표 목록·생성·수정·삭제
- `src/app/weekly/page.tsx`: 주간 계획 목록·생성(목표 선택)·수정·삭제, 진행률 숫자 표시
- `src/app/page.tsx`: 날짜 선택 + 일자별 할 일 목록, 생성·수정 폼(주간 계획 선택), 삭제
- 공통: `src/components/{TodoForm,WeeklyPlanSelect,GoalSelect}.tsx`, `src/lib/api-client.ts`
- **완료 기준**: PRD 3장 User Flow 1~3, 7을 브라우저에서 수행 가능

### M4. 상태 보드 + 드래그 앤 드롭
- `src/app/board/page.tsx`, `src/components/board/{Board,Column,TodoCard}.tsx`
- `src/hooks/useMoveTodo.ts` (2.5)
- 보드 범위: 날짜 선택(기본 오늘) + 주간 계획 필터
- **완료 기준**: E1, E2 통과

### M5. 진행률 반영 마무리 → P0 완료
- 모든 todo mutation의 `onSettled`에서 공통 헬퍼 `invalidateProgress(queryClient)` 호출
- **완료 기준**: E3 통과, 7장 P0 수용 기준 전부 충족

### M6. P1
- 목표 진행률(연결 주간 계획 진행률 평균, 0개면 0%) + `src/components/ProgressBar.tsx`
- 컬럼 내 순서 변경: `@dnd-kit/sortable` + `/api/todos/reorder`, 목록은 `sortOrder` 오름차순
- `src/app/unlinked/page.tsx`: 미연결 할 일 (끊긴 참조 포함)
- **완료 기준**: U5, I10, E4, E5 통과

---

## 6. 테스트 계획

### 단위 (Vitest, `src/lib/*.test.ts`)
- U1 `calcWeeklyProgress({done:0,total:0})` → 0
- U2 `{done:1,total:3}` → 33, `{done:2,total:3}` → 67
- U3 `{done:4,total:4}` → 100
- U4 `toWeekStart("2026-10-29")`(목) → `"2026-10-26"`(월), `"2026-11-01"`(일) → `"2026-10-26"`, 월말·연말 경계 포함
- U5 `calcGoalProgress([50,100])` → 75, `[]` → 0
- U6 Zod: status `"finished"` 거부, 빈 제목 거부, `"2026-13-01"` 날짜 거부

### API 통합 (Vitest + mongodb-memory-server, `src/server/**/*.test.ts`)
- I1 할 일 생성 시 status 미지정 → `"todo"`
- I2 할 일 4개 중 1개 done → 주간 계획 진행률 25
- I3 done 할 일 1개 삭제 (1/4 → 0/3) → 0
- I4 할 일 연결 A→B 변경 → A, B 진행률 모두 반영
- I5 주간 계획 삭제 → 연결 할 일은 남고 `weeklyPlanId === null`
- I6 목표 삭제 → 연결 주간 계획은 남고 `goalId === null`
- I7 존재하지 않는 `weeklyPlanId`로 생성 → 400, 잘못된 ObjectId 형식 → 400
- I8 존재하지 않는 할 일 PATCH/DELETE → 404
- I9 연결 할 일 0개인 주간 계획 진행률 → 0
- I10 (P1) `?unlinked=true` → `weeklyPlanId`가 null이거나 존재하지 않는 계획을 가리키는 할 일만 반환

### E2E (Playwright, `e2e/*.spec.ts`)
- E1 todo 카드를 doing 컬럼으로 드래그 → 새로고침 후에도 doing
- E2 `PATCH /api/todos/*`를 500으로 가로챔 → 카드가 원래 컬럼으로 복귀, 오류 토스트 표시
- E3 목표 → 주간 계획 → 할 일 2개 생성 → 하나를 done으로 드래그 → 주간 계획 화면 진행률 50%
- E4 (P1) 같은 컬럼 내 순서 변경 후 새로고침해도 순서 유지
- E5 (P1) 미연결 할 일 화면에 연결 없는 할 일만 표시

---

## 7. 수용 기준 (P0)

- [ ] 할 일을 제목·날짜·주간 계획(선택)으로 생성하면 상태가 `todo`다
- [ ] 날짜를 선택하면 그 날짜의 할 일만 보인다
- [ ] 보드에 todo / doing / done 3개 컬럼이 있고 각 할 일이 상태에 맞는 컬럼에 있다
- [ ] 카드를 다른 컬럼으로 옮기면 새로고침 후에도 그 상태다
- [ ] 저장 실패 시 카드가 원래 컬럼으로 돌아가고 오류가 표시된다
- [ ] 할 일의 제목·날짜·상태·주간 계획 연결을 수정할 수 있고, 단건 삭제할 수 있다
- [ ] 주간 계획과 1년 목표 각각 생성·조회·수정·삭제할 수 있다
- [ ] 주간 계획 삭제 시 연결 할 일은 남고 미연결 상태가 된다 (목표 삭제도 동일)
- [ ] 주간 진행률이 생성·삭제·상태 변경·연결 변경 직후 화면에 반영되고 산식과 일치한다
- [ ] 연결 할 일 0개인 주간 계획의 진행률은 0%다
- [ ] U1~U6, I1~I9, E1~E3 전부 통과

---

## 8. 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 연결 해제(`updateMany`) 실패로 끊긴 참조가 남음 | 삭제된 계획을 가리키는 할 일 | 조회 시 미연결로 취급(2.2), I10으로 검증 |
| 참조 검사와 쓰기 사이에 부모가 삭제됨 (경쟁 조건) | 끊긴 참조 | 단일 사용자 앱이라 확률 낮음, 위와 같은 조회 측 처리로 흡수 |
| 날짜 시간대 문제 | 다른 날짜·주에 표시 | 문자열 날짜(2.4), U4 경계 테스트 |
| 개발 중 MongoDB 연결 누수 | "too many connections" | 연결 캐싱(2.6) |
| 연속 드래그 시 응답 순서 역전 | 롤백이 최신 상태를 덮어씀 | `onMutate`에서 `cancelQueries`, 요청 진행 중인 카드는 드래그 비활성화 |
| 진행률 갱신 누락 | 이전 값 표시 | 공통 `invalidateProgress` 헬퍼, E3 |
| 로컬에 MongoDB 미설치 | 개발 시작 불가 | M0에서 접속 방식 확정 (9장 1번) |

---

## 9. 미결 사항

1. **개발용 MongoDB**: 로컬 설치 / Docker / Atlas 중 무엇을 쓸지 (기본: Docker `mongo:7`)
2. 할 일 날짜가 연결한 주간 계획 기간 밖일 때 (기본: 허용 + 폼에 경고 표시)
3. 주간 계획 연도와 연결 목표 연도가 다를 때 (기본: 허용)
4. 보드 기본 범위 (기본: 오늘 + 주간 계획 필터)
5. 같은 주에 주간 계획 여러 개 (기본: 허용)

---

## 10. 검증 절차

1. `npm run lint && npx tsc --noEmit` 오류 0
2. `npm test` → U·I 테스트 전부 통과
3. `npx playwright test` → E 테스트 전부 통과
4. 수동 확인: PRD 3장 User Flow 1~7을 브라우저에서 순서대로 수행
5. 7장 수용 기준 전부 체크
