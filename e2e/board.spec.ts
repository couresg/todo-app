import { expect, test } from "@playwright/test";
import { column, createPlan, createTodo, drag, resetData } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("E1 dragging a card to doing persists after reload", async ({ page, request }) => {
  await createTodo(request, "move me");
  await page.goto("/board");
  const card = column(page, "todo").getByTestId("todo-card").filter({ hasText: "move me" });
  await expect(card).toBeVisible();

  const reorder = page.waitForResponse((r) => r.url().includes("/api/todos/reorder") && r.request().method() === "PATCH");
  await drag(page, card, column(page, "doing"));
  expect((await reorder).status()).toBe(200);
  await expect(column(page, "doing").getByText("move me")).toBeVisible();

  await page.reload();
  await expect(column(page, "doing").getByText("move me")).toBeVisible();
  await expect(column(page, "todo").getByText("move me")).toHaveCount(0);
});

test("E2 failed save returns the card to its original column and shows an alert", async ({ page, request }) => {
  await createTodo(request, "will fail");
  await page.route("**/api/todos/reorder", (route) => route.fulfill({ status: 500, json: { error: "boom" } }));
  await page.route("**/api/todos/*", (route) =>
    route.request().method() === "PATCH" ? route.fulfill({ status: 500, json: { error: "boom" } }) : route.fallback(),
  );
  await page.goto("/board");
  const card = column(page, "todo").getByTestId("todo-card").filter({ hasText: "will fail" });
  await expect(card).toBeVisible();

  await drag(page, card, column(page, "doing"));

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(column(page, "todo").getByText("will fail")).toBeVisible();
  await expect(column(page, "doing").getByText("will fail")).toHaveCount(0);
});

test("E3 moving one of two linked todos to done shows 50% on the weekly page", async ({ page, request }) => {
  const plan = await createPlan(request, "Week plan");
  await createTodo(request, "first", plan.id);
  await createTodo(request, "second", plan.id);

  await page.goto("/board");
  const card = column(page, "todo").getByTestId("todo-card").filter({ hasText: "first" });
  await expect(card).toBeVisible();
  const reorder = page.waitForResponse((r) => r.url().includes("/api/todos/reorder"));
  await drag(page, card, column(page, "done"));
  expect((await reorder).status()).toBe(200);
  await expect(column(page, "done").getByText("first")).toBeVisible();

  await page.getByRole("link", { name: "주간 계획" }).click();
  const item = page.getByTestId("weekly-plan-item").filter({ hasText: "Week plan" });
  await expect(item).toContainText("50%");
});

test("E4 reordering within a column persists after reload", async ({ page, request }) => {
  await createTodo(request, "A");
  await createTodo(request, "B");
  await createTodo(request, "C");
  await page.goto("/board");
  const cards = column(page, "todo").getByTestId("todo-card");
  await expect(cards).toHaveText([/A/, /B/, /C/]);

  const reorder = page.waitForResponse((r) => r.url().includes("/api/todos/reorder"));
  await drag(page, cards.filter({ hasText: "C" }), cards.filter({ hasText: "A" }));
  expect((await reorder).status()).toBe(200);
  await expect(cards.first()).not.toContainText("A");
  const order = await cards.allInnerTexts();

  await page.reload();
  await expect(cards).toHaveCount(3);
  expect(await cards.allInnerTexts()).toEqual(order);
});

test("E5 unlinked page lists only todos without a plan", async ({ page, request }) => {
  const plan = await createPlan(request, "P");
  await createTodo(request, "linked one", plan.id);
  await createTodo(request, "loose one");
  await page.goto("/unlinked");
  const items = page.getByTestId("unlinked-item");
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("loose one");
});
