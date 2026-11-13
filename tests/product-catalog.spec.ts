import {test, expect} from '@playwright/test';

test('Search returns matching products', async ({page}) => {
    await page.goto('https://practicesoftwaretesting.com/');
    await page.getByTestId(`search-query`).fill(`pliers`);
    await page.getByTestId(`search-submit`).click();

    await expect(page.getByTestId(`search-term`)).toContainText(`pliers`);
    await expect(page.getByTestId(`search-result-count`)).toContainText(`4 products found for 'pliers'`);

    const productNames = page.getByTestId('product-name');
    await expect(productNames.filter({ hasNotText: /pliers/i })).toHaveCount(0);
});



