import { expect, test } from "@playwright/test";
import { column, drag, resetData } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("PRD user flow 1-7: goal, plan, todo, board, progress, edit/delete, plan delete", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  const planCard = () => page.getByTestId("weekly-plan-item").filter({ hasText: "Week 1" });

  // 1. goal
  await page.goto("/goals");
  const goalForm = page.getByRole("form", { name: "목표 추가" });
  await goalForm.getByLabel("제목").fill("Ship product");
  await goalForm.getByRole("button", { name: "추가" }).click();
  await expect(page.getByTestId("goal-item")).toContainText("Ship product");

  // 2. weekly plan linked to the goal
  await page.getByRole("link", { name: "주간 계획" }).click();
  const planForm = page.getByRole("form", { name: "주간 계획 추가" });
  await planForm.getByLabel("제목").fill("Week 1");
  await expect(planForm.getByLabel("1년 목표").locator("option")).toHaveCount(2);
  await planForm.getByLabel("1년 목표").selectOption({ index: 1 });
  await planForm.getByRole("button", { name: "추가" }).click();
  await expect(planCard()).toContainText("목표: Ship product");
  await expect(planCard()).toContainText("0%");

  // 3. todos linked to the plan
  await page.getByRole("link", { name: "할 일" }).click();
  const todoForm = page.getByRole("form", { name: "할 일 추가" });
  await expect(todoForm.getByLabel("주간 계획").locator("option")).toHaveCount(2);
  for (const title of ["task one", "task two"]) {
    await todoForm.getByLabel("제목").fill(title);
    await todoForm.getByLabel("주간 계획").selectOption({ index: 1 });
    await todoForm.getByRole("button", { name: "추가" }).click();
    await expect(page.getByTestId("todo-item").filter({ hasText: title })).toBeVisible();
  }

  // 4. board shows the three columns
  await page.getByRole("link", { name: "보드", exact: true }).click();
  await expect(column(page, "todo").getByTestId("todo-card")).toHaveCount(2);
  await expect(column(page, "doing").getByTestId("todo-card")).toHaveCount(0);
  await expect(column(page, "done").getByTestId("todo-card")).toHaveCount(0);

  // 5. drag to doing, then done
  await drag(page, column(page, "todo").getByTestId("todo-card").filter({ hasText: "task one" }), column(page, "doing"));
  await expect(column(page, "doing").getByText("task one")).toBeVisible();
  const doingCard = column(page, "doing").getByTestId("todo-card").filter({ hasText: "task one" });
  await expect(doingCard).not.toHaveAttribute("aria-busy", "true"); // first save settled
  await page.waitForTimeout(600); // let dnd-kit finish its 250ms drop animation before the next drag
  await drag(page, doingCard, column(page, "done"));
  await expect(column(page, "done").getByText("task one")).toBeVisible();

  // 6. progress updated: 1 of 2 done
  await page.getByRole("link", { name: "주간 계획" }).click();
  await expect(planCard()).toContainText("50%");

  // 7. edit status to done -> 100%
  await page.getByRole("link", { name: "할 일" }).click();
  await page.getByTestId("todo-item").filter({ hasText: "task two" }).getByRole("button", { name: "수정" }).click();
  await page.getByTestId("todo-item").getByLabel("상태").selectOption("done");
  await page.getByTestId("todo-item").getByRole("button", { name: "저장" }).click();
  await page.getByRole("link", { name: "주간 계획" }).click();
  await expect(planCard()).toContainText("100%");

  // 7. delete a todo -> progress recomputed over remaining todos
  await page.getByRole("link", { name: "할 일" }).click();
  await page.getByTestId("todo-item").filter({ hasText: "task two" }).getByRole("button", { name: "삭제" }).click();
  await expect(page.getByTestId("todo-item").filter({ hasText: "task two" })).toHaveCount(0);
  await page.getByRole("link", { name: "주간 계획" }).click();
  await expect(planCard()).toContainText("완료 1 / 전체 1");

  // deleting the plan keeps the todo, now unlinked
  await planCard().getByRole("button", { name: "삭제" }).click();
  await expect(page.getByTestId("weekly-plan-item")).toHaveCount(0);
  await page.getByRole("link", { name: "미연결" }).click();
  await expect(page.getByTestId("unlinked-item")).toContainText("task one");
});
