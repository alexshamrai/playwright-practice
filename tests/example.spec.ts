import {test, expect} from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://practicesoftwaretesting.com/');
  await page.getByTestId("nav-sign-in").click();
  await page.getByTestId("email").fill("customer@practicesoftwaretesting.com");
  await page.getByTestId("password").fill("welcome01");
  await page.getByTestId("login-submit").click();

  await expect(page.getByTestId("page-title")).toHaveText("My account");
  await expect(page.getByTestId("nav-menu")).toContainText("Jane Doe");
});