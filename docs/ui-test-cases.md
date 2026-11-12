# Toolshop: UI test cases

UI test cases for **Practice Software Testing – Toolshop v5.0** (https://practicesoftwaretesting.com), written for later automation with Playwright.

The expected results were checked against the live site on **2026-11-12**. Lines marked *(docs)* come from the project's documentation and have not been confirmed in the UI yet. Check them the first time you run them, and fix the expected text if it differs.

---

## 1. Test environment

| Item | Value |
|---|---|
| App (full v5) | https://practicesoftwaretesting.com |
| App with bugs injected | https://with-bugs.practicesoftwaretesting.com. Run the finished suite here as well: it should fail. |
| Earlier sprints | `https://v1.` … `https://v4.practicesoftwaretesting.com` (fewer features) |
| API / Swagger | https://api.practicesoftwaretesting.com · https://api.practicesoftwaretesting.com/api/documentation |
| Source and docs | https://github.com/testsmith-io/practice-software-testing (`docs/`, `docs/user-stories/v5.md`) |
| Local copy | `docker compose` from the repo: app on `:4200`, API on `:8091`, MailCatcher on `:1080`. Needed for any test that reads email. |

### Test accounts

| Role | Email | Password | Name shown in the UI |
|---|---|---|---|
| Admin | `admin@practicesoftwaretesting.com` | `welcome01` | John Doe |
| Customer | `customer@practicesoftwaretesting.com` | `welcome01` | Jane Doe |
| Customer | `customer2@practicesoftwaretesting.com` | `welcome01` | Jack Howe |
| Customer | `customer3@practicesoftwaretesting.com` | `pass123` | Bob Smith |

### Ground rules (the environment is shared with other users)

1. **Never send a wrong password for a default account.** Three failed logins in a row lock the account for everyone. For lockout tests, register a new user, or log in with a random email that doesn't exist.
2. **Run Forgot password, Change password and TOTP only on a user you registered yourself.** On the default accounts they either change shared credentials or are refused ("Access denied: If you want to configure TOTP, please create your own account.").
3. **Other people create data here too.** Brands such as `rQ01` and `abc` exist, and the product and order counts change. Don't assert exact catalog-wide counts. Prefer relative checks: sorted order, a filter subset, a count before vs. after.
4. Admin tests that create data should use unique names (for example `PW-Product-<timestamp>`) and delete what they created.

### Selector convention

The app exposes `data-test` attributes, and `playwright.config.ts` already sets `testIdAttribute: 'data-test'`. So every `` `name` `` in backticks below can be used as `page.getByTestId('name')`. Section 15 lists all the selectors.

### Stable seed data (IDs are seeded ULIDs)

| Product | ID | Why it's useful |
|---|---|---|
| Combination Pliers ($14.15) | `01M77FSAZ9GW5PF7PSNPHNR5AZ` | Default product with a specs table |
| Pliers ($12.01) | `01M77FSAZFJKQBG8MA785PYNV1` | Second cart item |
| Bolt Cutters ($48.41) | `01M77FSAZJYSDVRXTXH716E7KN` | Larger price for checking totals |
| Long Nose Pliers ($14.24) | `01M77FSAZM1747MKN4CNZCJWQM` | **Out of stock** |
| Excavator (rental, $136.50) | `01M77FSB42RSFSBHVBYTD1P7BH` | Rental with a duration slider |

### Priorities and tags

- **P1**: core flow; a failure blocks a release. Tag `@smoke`.
- **P2**: important behavior and main validations. Tag `@regression`.
- **P3**: edge cases, cosmetics, exploratory checks.

---

## 2. Summary

| # | Area | ID prefix | Cases |
|---|---|---|---|
| 3 | Navigation & layout | `NAV` | 6 |
| 4 | Product catalog (search, sort, filter, pagination) | `CAT` | 14 |
| 5 | Product details | `PDP` | 10 |
| 6 | Rentals | `RENT` | 3 |
| 7 | Product comparison | `CMP` | 4 |
| 8 | Cart | `CART` | 8 |
| 9 | Checkout & payment | `CHK` | 15 |
| 10 | Authentication (login, register, forgot password, logout) | `AUTH` | 15 |
| 11 | My account (profile, favorites, invoices, messages) | `ACC` | 10 |
| 12 | Contact form | `CNT` | 8 |
| 13 | Language & chat | `I18N` / `CHAT` | 5 |
| 14 | Admin | `ADM` | 10 |
| | **Total** | | **108** |

---

## 3. Navigation & layout (`NAV`)

#### NAV-01 · Home page loads with the main layout · P1 `@smoke`
- **Steps:** 1) Open `/`.
- **Expected:** The title contains "Practice Software Testing - Toolshop". The nav shows `nav-home`, `nav-categories`, `nav-rentals`, `nav-contact`, `nav-sign-in`. The product grid shows 9 cards, each with `product-name`, `product-price` and `co2-rating-badge`. `search-query`, `sort` and the filters are visible.

#### NAV-02 · Categories dropdown navigates to a category page · P2 `@regression`
- **Steps:** 1) Click `nav-categories`. 2) Click `nav-hand-tools`.
- **Expected:** The dropdown offers Hand Tools, Power Tools, Other and Special Tools. The URL is `/category/hand-tools`, and `page-title` = "Category: Hand Tools". Every product shown belongs to a Hand Tools subcategory.

#### NAV-03 · Main nav links route correctly · P2 `@regression`
- **Steps:** Click `nav-rentals`, `nav-contact`, `nav-sign-in` and `nav-home` in turn.
- **Expected:** The URLs are `/rentals` (h1 "Rentals"), `/contact` (h1 "Contact"), `/auth/login` (h1 "Login") and `/` respectively.

#### NAV-04 · Product card opens the product detail page · P1 `@smoke`
- **Steps:** 1) On `/`, click the first product card.
- **Expected:** The URL matches `/product/{id}`. The h1 `product-name` matches the card's name, and `unit-price` matches the card's price without the `$`.

#### NAV-05 · Logged-in nav shows the user menu · P1 `@smoke`
- **Pre:** Logged in as customer.
- **Steps:** 1) Click `nav-menu`.
- **Expected:** `nav-menu` shows "Jane Doe". The menu contains `nav-my-account`, `nav-my-favorites`, `nav-my-profile`, `nav-my-invoices`, `nav-my-messages` and `nav-sign-out`. `nav-sign-in` is gone.

#### NAV-06 · Mobile viewport collapses nav and filters · P3
- **Steps:** 1) Open `/` at an iPhone-sized viewport (for example `devices['iPhone 13']`).
- **Expected:** The nav collapses into a toggler button. The filter sidebar is hidden behind a `filters` button that opens it when tapped. The page doesn't scroll horizontally.

---

## 4. Product catalog (`CAT`)

### Search

#### CAT-01 · Search returns matching products · P1 `@smoke`
- **Steps:** 1) Fill `search-query` with `pliers`. 2) Click `search-submit`.
- **Expected:** `search-caption` = "Searched for: pliers" and `search-term` = "pliers". `search-result-count` = "4 products found for 'pliers'". Every `product-name` contains "Pliers": Combination Pliers, Pliers, Long Nose Pliers, Slip Joint Pliers.

#### CAT-02 · Search with no matches · P2 `@regression`
- **Steps:** Search for `zzzqqq`.
- **Expected:** `search-result-count` = "0 products found for 'zzzqqq'". `no-results` = "There are no products found." No product cards are shown.

#### CAT-03 · Reset search restores the full catalog · P2 `@regression`
- **Steps:** 1) Search for `pliers`. 2) Click `search-reset` (X).
- **Expected:** `search-query` is empty and `search-caption` disappears. The grid shows 9 products again and pagination comes back.

#### CAT-04 · Search is case-insensitive and matches partial words · P3
- **Steps:** Search for `PLIER`, then for `hamm`.
- **Expected:** Results are the same as for lower case; `hamm` returns hammer products.

#### CAT-05 · Search length limits (3–40 characters) · P3 *(docs)*
- **Steps:** Search with 2 characters (`ab`), then with 41 characters.
- **Expected:** *(docs)* Search needs 3–40 characters. Live behavior seen on 2026-11-12: a 2-character search showed no caption and no result count, and no error was displayed. Record the actual behavior and decide whether it is a bug.

### Sorting

#### CAT-06 · Sort by price, low to high · P1 `@smoke`
- **Steps:** Select `sort` = "Price (Low - High)".
- **Expected:** The `product-price` values (parsed as numbers) are in ascending order. Seen on page 1: $3.55, $3.95, $4.65 …

#### CAT-07 · Sort by price, high to low · P2 `@regression`
- **Steps:** Select "Price (High - Low)".
- **Expected:** The prices are in descending order.

#### CAT-08 · Sort by name A–Z and Z–A · P2 `@regression`
- **Steps:** Select "Name (A - Z)", then "Name (Z - A)".
- **Expected:** The `product-name` list is alphabetically ascending, then descending. Compare in a case-insensitive, locale-aware way.

#### CAT-09 · Sort by CO₂ rating · P3
- **Steps:** Select "CO₂ Rating (A - E)", then "CO₂ Rating (E - A)".
- **Expected:** The active (highlighted) letter in each `co2-rating-badge` is non-decreasing A→E, then non-increasing. Inspect the DOM to find how the active letter is marked.

### Filters

#### CAT-10 · Filter by subcategory · P1 `@smoke`
- **Steps:** Check the "Hammer" checkbox in the category tree. Locate it by label: `getByLabel('Hammer')`.
- **Expected:** Only hammers are listed (for example Claw Hammer, Thor Hammer, Sledgehammer, Court Hammer …), and no pliers or saws appear.

#### CAT-11 · Combine category and brand filters · P2 `@regression`
- **Steps:** 1) Check "Hammer". 2) Check brand "ForgeFlex Tools".
- **Expected:** Each product shown is a hammer and is made by ForgeFlex Tools. Open a product or the comparison view to check the brand. The result is a subset of CAT-10.

#### CAT-12 · Price range slider limits results · P2 `@regression`
- **Steps:** 1) Note the default slider range: min handle at 1, max at 100, scale 0–200. 2) Move the max handle down to about 10. Focus the handle and use the keyboard, for example `End`/`ArrowLeft`.
- **Expected:** Every `product-price` is ≤ the selected max. When the max goes back to 200, products over $100 can appear.

#### CAT-13 · Eco-friendly filter · P3
- **Steps:** Check `eco-friendly-filter`.
- **Expected:** Only products marked eco-friendly are shown. With "Hammer" plus eco-friendly the list was empty on 2026-11-12. Check that the "no products" state is displayed cleanly.

### Pagination

#### CAT-14 · Paginate through the catalog · P2 `@regression`
- **Steps:** 1) On `/`, note page 1's products. 2) Click page 2 (`getByRole('button', { name: 'Page-2' })`). 3) Click `pagination-prev`.
- **Expected:** On page 1, `pagination-prev` is disabled. Page 2 shows a different set of 9 products (it started with "Sledgehammer"). Going back shows page 1 again. Clicking `pagination-next` on the last page has no effect, or the button is disabled.

---

## 5. Product details (`PDP`)

#### PDP-01 · Product detail content · P1 `@smoke`
- **Steps:** Open `/product/01M77FSAZ9GW5PF7PSNPHNR5AZ`.
- **Expected:** `product-name` = "Combination Pliers" and `unit-price` = "14.15". `product-description`, `co2-rating-badge`, `quantity` (= 1), `add-to-cart`, `add-to-favorites` and `add-to-compare` are visible. There is a "Related products" section.

#### PDP-02 · Specifications table · P3
- **Steps:** Same product as PDP-01.
- **Expected:** `specs-title` = "Specifications". `product-specs` has 5 `spec-row`s (Handle Material: Bi-component, Length: 200 mm, …), and units are shown in `spec-unit`.

#### PDP-03 · Quantity increase/decrease buttons · P2 `@regression`
- **Steps:** Click `increase-quantity` twice, then `decrease-quantity` once.
- **Expected:** `quantity` goes 1 → 2 → 3 → 2.

#### PDP-04 · Quantity cannot go below 1 · P2 `@regression`
- **Steps:** 1) At quantity 1, click `decrease-quantity`. 2) Type `0`, then `-5`, into `quantity`.
- **Expected:** The value stays at 1, or is clamped to 1. Manual entries are clamped to 1…999,999,999 *(docs)*.

#### PDP-05 · Add to cart · P1 `@smoke`
- **Steps:** 1) Set quantity 2. 2) Click `add-to-cart`.
- **Expected:** A toast says "Product added to shopping cart." `nav-cart` appears in the header, and `cart-quantity` = 2.

#### PDP-06 · Out-of-stock product cannot be added · P1 `@smoke`
- **Steps:** Open `/product/01M77FSAZM1747MKN4CNZCJWQM` (Long Nose Pliers).
- **Expected:** `out-of-stock` = "Out of stock" and `add-to-cart` is **disabled**. On the catalog card, an `out-of-stock` label is shown too.

#### PDP-07 · Add to favorites as a guest · P2 `@regression`
- **Pre:** Logged out.
- **Steps:** Click `add-to-favorites`.
- **Expected:** A toast says "Unauthorized, can not add product to your favorite list."

#### PDP-08 · Add to favorites as a logged-in user · P1 `@smoke`
- **Pre:** Logged in as a customer, and the product is not in their favorites yet.
- **Steps:** Click `add-to-favorites`.
- **Expected:** A toast says "Product added to your favorites list." The product appears on `/account/favorites`. Clean up by deleting it there.

#### PDP-09 · Adding the same favorite twice · P2 `@regression`
- **Pre:** The product is already in favorites.
- **Steps:** Click `add-to-favorites` again.
- **Expected:** A toast says "Product already in your favorites list."

#### PDP-10 · Related product link · P3
- **Steps:** On PDP-01, click the first card under "Related products".
- **Expected:** The browser navigates to that product's detail page, and the h1 changes to its name.

---

## 6. Rentals (`RENT`)

#### RENT-01 · Rentals overview · P2 `@regression`
- **Steps:** Open `/rentals`.
- **Expected:** `page-title` = "Rentals". Cards for Excavator, Bulldozer and Crane, each with a description.

#### RENT-02 · Rental detail uses a duration slider · P2 `@regression`
- **Steps:** Open the Excavator detail page (`/product/01M77FSB42RSFSBHVBYTD1P7BH`).
- **Expected:** There are no +/- quantity buttons. A duration slider (`ngx-slider`, 1–10) is shown with a default of 1 hour, and `unit-price` = "136.50".

#### RENT-03 · Rental duration is added to the cart · P3
- **Steps:** 1) Move the slider to 5. 2) Click `add-to-cart`. 3) Open the cart.
- **Expected:** The rental row's quantity or duration is 5, and the line total = 5 × 136.50 = $682.50.

---

## 7. Product comparison (`CMP`)

#### CMP-01 · Comparison bar appears on selection · P2 `@regression`
- **Steps:** On `/`, click `compare-btn` on two product cards.
- **Expected:** `comparison-bar` shows "2 product(s) selected", with `clear-comparison` ("Clear All") and `compare-link` ("Compare Now").

#### CMP-02 · Comparison page shows both products · P2 `@regression`
- **Steps:** After CMP-01, click `compare-link`.
- **Expected:** The URL is `/comparison` and `comparison-title` = "Product Comparison". The `comparison-table` has one column per product, with rows `compare-price`, `compare-brand`, `compare-category`, `compare-stock`, `compare-co2`, `compare-eco`, `compare-spec` and `compare-description`.

#### CMP-03 · Remove a product / clear all · P3
- **Steps:** 1) On `/comparison`, click `remove-product` on one column. 2) Click `clear-comparison`.
- **Expected:** The first click drops that column. The second clears the comparison: the table is empty or redirects, and the comparison bar is gone on `/`.

#### CMP-04 · "Show differences" toggle · P3
- **Steps:** Check `show-differences`.
- **Expected:** Only rows whose values differ between the products remain visible.

---

## 8. Cart (`CART`)

#### CART-01 · Cart shows added items with correct totals · P1 `@smoke`
- **Steps:** 1) Add Combination Pliers ×1 and Pliers ×1. 2) Click `nav-cart`.
- **Expected:** The URL is `/checkout` (step 1). The rows have `product-title`, `product-quantity`, `product-price` and `line-price`. `cart-total` = "$26.16" (14.15 + 12.01).

#### CART-02 · Update quantity in the cart · P1 `@smoke`
- **Steps:** Change a row's `product-quantity` to 3 and blur the field (press Tab).
- **Expected:** A toast says "Product quantity updated." `line-price` = 3 × unit price, `cart-total` is recalculated, and the header `cart-quantity` updates.

#### CART-03 · Delete an item from the cart · P1 `@smoke`
- **Steps:** Click the red delete button on a row. It has no `data-test`, so use `row.locator('a.btn-danger')` or add a role-based locator.
- **Expected:** A toast says "Product deleted." The row is removed, and `cart-total` and `cart-quantity` decrease.

#### CART-04 · Quantity 0 is not accepted · P2 `@regression`
- **Steps:** Set `product-quantity` to 0 and blur.
- **Expected:** The quantity resets to 1 (seen live). It doesn't delete the row or produce a $0 line.

#### CART-05 · Quantity upper bound · P3
- **Steps:** Set `product-quantity` to 100, then to 9999.
- **Expected:** The cart input has `max="99"`. Check whether larger values are blocked or clamped, and record the result.

#### CART-06 · Empty cart state · P2 `@regression`
- **Steps:** Delete every item.
- **Expected:** An empty-cart message is shown ("Your shopping cart is empty" *(docs)*), `proceed-1` is not available, and the header cart badge disappears.

#### CART-07 · Cart persists across reload and login · P2 `@regression`
- **Steps:** 1) As a guest, add an item. 2) Reload the page. 3) Log in.
- **Expected:** The item is still in the cart after the reload and after logging in.

#### CART-08 · Continue shopping · P3
- **Steps:** On the cart step, click `continue-shopping`.
- **Expected:** The browser goes back to the catalog with the cart unchanged.

---

## 9. Checkout & payment (`CHK`)

The checkout is a wizard at `/checkout`: **1 Cart → 2 Sign in → 3 Billing address → 4 Payment**, followed by a confirmation.

#### CHK-01 · End-to-end checkout as a logged-in customer (Cash on Delivery) · P1 `@smoke`
- **Pre:** Logged in as a customer, with one item in the cart.
- **Steps:** 1) Click `proceed-1`. 2) Step 2 says the user is already signed in; click `proceed-2`. 3) Complete the billing address and click `proceed-3`. 4) Set `payment-method` = "Cash on Delivery". 5) Click `finish` ("Check payment"). 6) Click `finish` again (now "Confirm").
- **Expected:** After step 5, `payment-success-message` = "Payment was successful" and the button label changes to "Confirm". After step 6, a confirmation shows an invoice number of the form `INV-<digits>` ("Thanks for your order! Your invoice number is …" *(docs)*). The cart is emptied, and the new invoice appears on `/account/invoices`.

#### CHK-02 · Sign in during checkout · P1 `@smoke`
- **Pre:** Logged out, with an item in the cart.
- **Steps:** 1) Click `proceed-1`. 2) On the "Sign in" tab, enter customer credentials in `email`/`password` and click `login-submit`.
- **Expected:** Step 2 confirms the user is signed in, and `proceed-2` becomes available. The cart keeps its items.

#### CHK-03 · Continue as guest · P1 `@smoke`
- **Pre:** Logged out, with an item in the cart.
- **Steps:** 1) Click `proceed-1`. 2) Open the "Continue as Guest" tab. 3) Fill `guest-email`, `guest-first-name` and `guest-last-name`. 4) Click `guest-submit`.
- **Expected:** The text "Continuing as guest: Guest Tester (guest.tester@example.com)" appears, and `proceed-2-guest` is enabled and leads to the billing address step.

#### CHK-04 · Guest form validation · P2 `@regression`
- **Steps:** On the guest tab, click `guest-submit` with empty fields.
- **Expected:** "Email is required", "First name is required" and "Last name is required" are shown, and the user doesn't move to the next step.

#### CHK-05 · Billing address is prefilled from the profile · P2 `@regression`
- **Pre:** Logged in as customer2 (whose profile has a street and city).
- **Steps:** Go to step 3.
- **Expected:** `street`, `city` and `country` are prefilled from the profile (for example "Test street 654", "Frankfurt").

#### CHK-06 · Billing address required fields · P2 `@regression`
- **Steps:** On step 3, clear `street` (or any other required field).
- **Expected:** The field is highlighted as invalid and `proceed-3` is **disabled**. Once every field is filled, `proceed-3` is enabled.

#### CHK-07 · Postcode lookup auto-fills the address · P3
- **Steps:** On step 3, select a country, enter `postal_code` and `house_number`, and wait.
- **Expected:** `street`, `city` and `state` are filled in automatically, as `postcode-lookup-hint` describes. On 2026-11-12, postal code 1010 with house number 1 overwrote the values typed by hand. Decide whether overwriting typed data is the intended behavior. Practice idea: stub the lookup request with `page.route` so the result is the same every run.

#### CHK-08 · Billing field max lengths · P3 *(docs)*
- **Steps:** Enter values that are too long: street over 70 characters, city/state/country over 40, postal code over 10.
- **Expected:** *(docs)* The input is rejected or an error is shown, and `proceed-3` stays disabled.

#### CHK-09 · Payment: Credit Card fields and validation · P1 `@smoke`
- **Steps:** Select "Credit Card", then enter `credit_card_number`=`1234`, `expiration_date`=`01/2020`, `cvv`=`1` and `card_holder_name`=`Jack 123`.
- **Expected:** The errors "Invalid card number format.", "Expiration date must be in the future." and "CVV must be 3 or 4 digits." are shown, and `finish` is **disabled**. With valid data (`4111-1111-1111-1111`, a future `MM/YYYY`, `123`, `Jane Doe`), `finish` is enabled and the payment succeeds.

#### CHK-10 · Payment: Bank Transfer · P2 `@regression`
- **Steps:** Select "Bank Transfer" and fill `bank_name`, `account_name` and `account_number`.
- **Expected:** All three fields are required. *(docs)* Bank name accepts letters and spaces only, and account number accepts digits only; invalid values show errors and keep `finish` disabled. Valid data gives "Payment was successful".

#### CHK-11 · Payment: Buy Now Pay Later · P2 `@regression`
- **Steps:** Select "Buy Now Pay Later".
- **Expected:** `monthly_installments` offers 3, 6, 9 and 12 monthly installments. You must choose one before the payment can be checked.

#### CHK-12 · Payment: Gift Card · P2 `@regression`
- **Steps:** Select "Gift Card" and fill `gift_card_number` and `validation_code`.
- **Expected:** Both fields are required and alphanumeric *(docs)*. Valid input gives "Payment was successful". Rules: see the repo's `docs/gift-card-validation.md`.

#### CHK-13 · Payment method options and form reset · P2 `@regression`
- **Steps:** 1) Open `payment-method`. 2) Fill the Credit Card fields. 3) Switch to Bank Transfer, then back to Credit Card.
- **Expected:** The options are Bank Transfer, Cash on Delivery, Credit Card, Buy Now Pay Later and Gift Card. Each method shows only its own fields, and switching methods clears the previous input *(docs)*.

#### CHK-14 · Cannot pay without choosing a method · P2 `@regression`
- **Steps:** On step 4, leave `payment-method` on "Choose your payment method".
- **Expected:** `finish` is disabled.

#### CHK-15 · Combined rental and non-rental discount · P3 *(docs)*
- **Steps:** Put one rental (Excavator) and one regular product in the cart.
- **Expected:** *(docs)* A 15% discount is applied and shown in the cart totals. Check that the displayed total matches the arithmetic.

---

## 10. Authentication (`AUTH`)

### Login

#### AUTH-01 · Customer login · P1 `@smoke`
- **Steps:** 1) Open `/auth/login`. 2) Fill `email`/`password` with the customer credentials. 3) Click `login-submit`.
- **Expected:** The URL is `/account`, `page-title` = "My account", and `nav-menu` shows "Jane Doe".

#### AUTH-02 · Admin login redirects to the dashboard · P1 `@smoke`
- **Steps:** Log in as admin.
- **Expected:** The URL is `/admin/dashboard` and the h1 is "Sales over the years".

#### AUTH-03 · Login with empty fields · P2 `@regression`
- **Steps:** Click `login-submit` with empty fields.
- **Expected:** `email-error` = "Email is required" and `password-error` = "Password is required".

#### AUTH-04 · Login with unknown credentials · P1 `@smoke`
- **Steps:** Log in with `nobody.<timestamp>@example.com` / `Wrong123!`. **Don't use a default account here.**
- **Expected:** `login-error` = "Invalid email or password", and the user stays on `/auth/login`.

#### AUTH-05 · Account lockout after 3 failed attempts · P2 `@regression` *(docs)*
- **Pre:** A user **you just registered** (see AUTH-09).
- **Steps:** Enter a wrong password 3 times, then the correct one.
- **Expected:** *(docs)* "Account locked, too many failed attempts. Please contact the administrator." Even the correct password is refused.

#### AUTH-06 · Logout · P1 `@smoke`
- **Pre:** Logged in.
- **Steps:** Click `nav-menu`, then `nav-sign-out`.
- **Expected:** The URL is `/auth/login` and `nav-sign-in` is visible again.

#### AUTH-07 · Protected routes require login · P2 `@regression`
- **Pre:** Logged out.
- **Steps:** Open `/account`, `/account/invoices` and `/admin/dashboard` directly.
- **Expected:** Each one redirects to `/auth/login`.

#### AUTH-08 · A customer cannot open the admin area · P2 `@regression`
- **Pre:** Logged in as a customer.
- **Steps:** Open `/admin/dashboard` and `/admin/users`.
- **Expected:** Access is denied and the user is redirected. No admin data is shown.

### Registration

#### AUTH-09 · Register a new customer · P1 `@smoke`
- **Steps:** 1) Open `/auth/register` (or click `register-link` on the login page). 2) Fill `first-name`, `last-name`, `dob` (`1990-05-15`), `country`, `postal_code`, `house_number`, `street`, `city`, `state`, `phone` (digits), a unique `email` and a strong `password` (for example `Str0ng!Pass#2026`). 3) Click `register-submit`.
- **Expected:** The browser is redirected to `/auth/login`, and logging in with the new credentials succeeds. This user is your fixture for AUTH-05, AUTH-13, ACC-04/05 and ACC-09. Practice idea: create the user through the API in a fixture.

#### AUTH-10 · Registration required-field validation · P2 `@regression`
- **Steps:** Click `register-submit` with every field empty.
- **Expected:** Each field shows its error: "First name is required", "Last name is required", "Please enter a valid date in YYYY-MM-DD format. Date of Birth is required", "Country is required", "Postcode is required", "House number is required", "Street is required", "City is required", "State is required", "Phone is required.", "Email is required", and "Password is required …". The selectors are `<field>-error`.

#### AUTH-11 · Registration field formats · P2 `@regression`
- **Steps:** Enter `phone` = `abc`, `dob` = `15-05-1990`, and an email without `@`.
- **Expected:** `phone-error` = "Only numbers are allowed." The date error asks for the YYYY-MM-DD format, and the email error is shown.

#### AUTH-12 · Password strength indicator and rules · P2 `@regression`
- **Steps:** Type `abc`, `abcdefgh`, `Abcdefgh1` and `Abcdefgh1!` into `password` one after another.
- **Expected:** The indicator moves up the scale Weak → Moderate → Strong → Very Strong → Excellent as criteria are met: length, upper and lower case, number, symbol. **Note:** the live error says "Password must be minimal 6 characters long", but the docs say at least 8 characters. Pin down the real rule and report the mismatch.

#### AUTH-13 · Duplicate email registration · P2 `@regression`
- **Steps:** Register with an email that already exists, for example `customer@practicesoftwaretesting.com`, and fill every other field validly.
- **Expected:** "Email is already in use." *(docs)*, and no account is created.

### Forgot password

#### AUTH-14 · Forgot password validation · P2 `@regression`
- **Steps:** 1) Open `/auth/forgot-password` (`forgot-password-link`). 2) Click `forgot-password-submit` ("Set New Password") with an empty field. 3) Try again with `not-an-email`.
- **Expected:** Step 2 shows `email-error` = "Email is required". Step 3 shows a format error.

#### AUTH-15 · Forgot password for your own account · P3 *(docs)*
- **Pre:** A user you registered yourself (never a default account). To check the email, use the local docker setup with MailCatcher.
- **Steps:** Submit that user's email.
- **Expected:** *(docs)* A success message appears and fades after about 3 seconds. A new password is emailed (not a reset link), and the old password stops working.

---

## 11. My account (`ACC`)

#### ACC-01 · Account overview tiles · P2 `@regression`
- **Pre:** Logged in as a customer.
- **Steps:** Open `/account`.
- **Expected:** `page-title` = "My account". `nav-favorites`, `nav-profile`, `nav-invoices` and `nav-messages` each navigate to their page.

#### ACC-02 · Profile shows the user's data · P2 `@regression`
- **Steps:** Open `/account/profile`.
- **Expected:** `first-name`, `last-name`, `email`, `phone`, `street`, `postal_code`, `city`, `state` and `country` are filled with the user's data, and the email is read-only *(docs)*.

#### ACC-03 · Update profile · P2 `@regression`
- **Pre:** Your own registered user.
- **Steps:** Change `city`, click `update-profile-submit`, then reload.
- **Expected:** A success message appears, and the new city is still there after the reload. Clearing a required field (for example `first-name`) shows an error *(docs)*.

#### ACC-04 · Change password validation · P2 `@regression`
- **Pre:** Your own registered user.
- **Steps:** 1) Enter a mismatched `new-password` / `new-password-confirm`. 2) Enter a wrong `current-password`. 3) Use the current password as the new one. 4) Use a well-known leaked password such as `Abcdef12!`.
- **Expected:** 1) "Passwords do not match." 2) A "current password does not match" error. 3) "New Password cannot be same as your current password." 4) "The given new password has appeared in a data leak. Please choose a different new password." (seen live). Expectations 1–3 are *(docs)*.

#### ACC-05 · Change password successfully · P3
- **Pre:** Your own registered user.
- **Steps:** Change the password to a strong new one.
- **Expected:** A success message appears, and the user is logged out after about 5 seconds *(docs)*. The new password works and the old one doesn't.

#### ACC-06 · Favorites list and delete · P2 `@regression`
- **Pre:** Add one favorite (PDP-08).
- **Steps:** 1) Open `/account/favorites`. 2) Click `delete` on the card.
- **Expected:** A card `favorite-<id>` shows that product's `product-name` and `product-description`. After the delete, the card is removed and an empty state is shown.

#### ACC-07 · Invoice list · P2 `@regression`
- **Steps:** Open `/account/invoices` as the customer.
- **Expected:** A table with the columns Invoice Number, Billing Address, Invoice Date and Total, plus a Details link per row. It is paginated (`pagination-next`), and invoice numbers match `INV-\d+`.

#### ACC-08 · Invoice detail and PDF download · P2 `@regression`
- **Steps:** Click "Details" on a row, then click `download-invoice` ("Download PDF").
- **Expected:** The detail page shows `invoice-number`, `invoice-date`, `total`, the billing fields and `payment-method`. After the click a PDF file is downloaded; catch it with `page.waitForEvent('download')`.

#### ACC-09 · Messages list and detail · P3
- **Pre:** As a logged-in user, send a message via the contact form (CNT-02).
- **Steps:** Open `/account/messages` and open the message.
- **Expected:** The message is listed with its subject and status, and its detail page shows the text and lets the user reply *(docs)*.

#### ACC-10 · Two-factor (TOTP) setup is blocked for default accounts · P3
- **Pre:** Logged in as `customer@`.
- **Steps:** Open `/account/profile` and click `verify-totp`.
- **Expected:** "Access denied: If you want to configure TOTP, please create your own account." With your own user, the `totp-secret` and `totp-code` flow can be tested properly. Practice idea: generate the code with an `otplib` helper.

---

## 12. Contact form (`CNT`)

#### CNT-01 · Guest contact form fields · P2 `@regression`
- **Pre:** Logged out.
- **Steps:** Open `/contact`.
- **Expected:** `first-name`, `last-name`, `email`, `subject`, `message`, `attachment` and `contact-submit` ("Send") are shown. The `subject` options are Customer service, Webmaster, Return, Payments, Warranty and "Status of my order".

#### CNT-02 · Successful submission · P1 `@smoke`
- **Steps:** Fill every field validly: a message of 50 or more characters and the subject "Customer service". Click `contact-submit`.
- **Expected:** The form is replaced by a success confirmation. Record the exact text the first time you run it.

#### CNT-03 · Required-field validation · P2 `@regression`
- **Steps:** Click `contact-submit` with an empty form.
- **Expected:** "First name is required", "Last name is required", "Email is required", "Subject is required" and "Message is required" are shown (`<field>-error`).

#### CNT-04 · Invalid email format · P2 `@regression`
- **Steps:** Set `email` = `bad-email` and submit.
- **Expected:** `email-error` = "Email format is invalid".

#### CNT-05 · Message minimum length (boundary) · P2 `@regression`
- **Steps:** Submit with messages of 49 and then 50 characters.
- **Expected:** 49 characters shows `message-error` = "Message must be minimal 50 characters". 50 characters is accepted.

#### CNT-06 · Attachment must be an empty .txt file · P3
- **Steps:** Use `setInputFiles` to attach, in turn: a non-empty `.pdf`, a non-empty `.txt`, and an empty (0-byte) `.txt`.
- **Expected:** The `.pdf` gets `attachment-error` = "File should be empty." (and/or "File should have a txt extension." *(docs)*). The non-empty `.txt` gets "File should be empty." The empty `.txt` is accepted. Practice idea: pass an in-memory buffer, `{ name, mimeType, buffer }`.

#### CNT-07 · Logged-in user gets a simplified form · P2 `@regression`
- **Pre:** Logged in as customer.
- **Steps:** Open `/contact`.
- **Expected:** The text "Hello Jane Doe, please fill out this form to submit your message." is shown. `first-name`, `last-name` and `email` are **not** shown; only `subject`, `message` and `attachment` are.

#### CNT-08 · Subject is required even with other fields valid · P3
- **Steps:** Fill everything except `subject` and submit.
- **Expected:** Only `subject-error` = "Subject is required" is shown.

---

## 13. Language & chat (`I18N` / `CHAT`)

#### I18N-01 · Switch the language to German · P2 `@regression`
- **Steps:** Click `language-select`, then `lang-de`.
- **Expected:** The nav reads "Start", "Kontakt" and "Einloggen", the search button reads "Suche", and `language-select` shows "DE".

#### I18N-02 · All languages are available and switch back · P3
- **Steps:** Open `language-select`.
- **Expected:** The options are DE, EL, EN, ES, FR, NL and TR. Choosing `lang-en` restores the English labels. Check whether the choice survives a reload.

#### CHAT-01 · Open and close the chat widget · P3
- **Steps:** Click `chat-toggle`, then `chat-close`.
- **Expected:** `chat-window` opens with "Chat Assistant" and "Hi! How can I help you today?", and the close button closes it. **Note:** while the window is open it covers page elements, so a test must close it before clicking anything underneath.

#### CHAT-02 · Chat quick actions · P3
- **Steps:** With the chat open, click each action: `chat-action-find-product`, `chat-action-order-product`, `chat-action-start-checkout` and `chat-action-support-ticket`.
- **Expected:** Each one starts its flow. "Find a product" asks what you're looking for, and "Create support ticket" asks for a message of at least 50 characters, with an optional `.txt` via `chat-file-input` *(docs)*.

#### CHAT-03 · Find a product through the chat · P3
- **Steps:** Use "Find a product" and type `hammer`.
- **Expected:** Hammer products are suggested in the chat, with a link to each product page.

---

## 14. Admin (`ADM`)

All cases: log in as admin first. **Clean up any data you create.**

#### ADM-01 · Admin menu · P1 `@smoke`
- **Steps:** Click `nav-menu`.
- **Expected:** `nav-menu` shows "John Doe". The entries are `nav-admin-dashboard`, `-brands`, `-categories`, `-products`, `-orders`, `-users`, `-messages`, `-settings`, `-statistics`, `nav-average-month-sales`, `nav-average-week-sales` and `nav-sign-out`. Each link opens its page (for example `/admin/products`, with h1 "Products").

#### ADM-02 · Dashboard · P2 `@regression`
- **Steps:** Open `/admin/dashboard`.
- **Expected:** The "Sales over the years" chart and the "Latest orders" table (paginated) are shown.

#### ADM-03 · Create, search and delete a product · P1 `@smoke`
- **Steps:** 1) Click `product-add`. 2) Fill `name` (unique), `description`, `stock`, `price`, `brand-id`, `category-id`, `product-image-id` and `co2-rating`. 3) Click `product-submit`. 4) Back on the list, search for it with `product-search-query`. 5) Click `product-delete-<id>`.
- **Expected:** A success message appears after the save, and the search finds the product. Optionally check that it shows in the shop. After the delete, it no longer appears in the search.

#### ADM-04 · Product form validation · P2 `@regression`
- **Steps:** Open `/admin/products/add` and click `product-submit` with empty fields. Then enter a negative or non-numeric `price` and `stock`.
- **Expected:** The required-field errors are shown and nothing is saved.

#### ADM-05 · Edit a product · P2 `@regression`
- **Pre:** The product created in ADM-03, before it is deleted.
- **Steps:** Click `product-edit-<id>`, change the price, and save.
- **Expected:** The new price shows in the admin list and on the shop's product page.

#### ADM-06 · Brands and categories CRUD · P2 `@regression`
- **Steps:** Use `brand-add` to create a brand with a unique name, edit it, and delete it. Do the same with `category-add`, `category-edit-<id>` and `category-delete-<id>`.
- **Expected:** Each operation is reflected in the list and in the shop's filter sidebar. Deleting a category or brand that is still in use is either blocked with a clear error or handled gracefully.

#### ADM-07 · Update an order's status · P2 `@regression`
- **Pre:** An order created by your own checkout (CHK-01).
- **Steps:** 1) Open `/admin/orders` and search for your invoice number in `order-search-query`. 2) Click `order-edit-<id>`. 3) Change the status (AWAITING_FULFILLMENT → ON_HOLD → AWAITING_SHIPMENT → SHIPPED → COMPLETED *(docs)*). 4) Save.
- **Expected:** The new status is saved and shows in the list.

#### ADM-08 · Users list and search · P2 `@regression`
- **Steps:** Open `/admin/users` and search for `customer2`.
- **Expected:** Jack Howe is listed with `user-edit-<id>` and `user-delete-<id>`. Don't delete or disable the default users.

#### ADM-09 · Messages: view and reply · P3
- **Pre:** A message sent through the contact form (CNT-02).
- **Steps:** Open `/admin/messages` and click `message-details-<id>` for your message.
- **Expected:** The details show the sender, subject and text. Sending a reply changes the message's status, and the customer sees the reply under My messages (ACC-09).

#### ADM-10 · Reports pages · P3
- **Steps:** Open `/admin/reports/statistics`, `/admin/reports/average-sales-per-month` and `/admin/reports/average-sales-per-week`.
- **Expected:** Each page renders its chart or table without errors. Practice idea: assert that the console has no errors (`page.on('console')`).

---

## 15. Selector reference (`data-test` values, captured 2026-11-12)

| Page / component | `data-test` values |
|---|---|
| **Header** | `nav-home`, `nav-categories`, `nav-hand-tools`, `nav-power-tools`, `nav-other`, `nav-special-tools`, `nav-rentals`, `nav-contact`, `nav-sign-in`, `nav-cart`, `cart-quantity`, `nav-menu`, `language-select`, `lang-de` / `lang-el` / `lang-en` / `lang-es` / `lang-fr` / `lang-nl` / `lang-tr` |
| **User menu** | `nav-my-account`, `nav-my-favorites`, `nav-my-profile`, `nav-my-invoices`, `nav-my-messages`, `nav-sign-out` |
| **Catalog** | `search-query`, `search-submit`, `search-reset`, `search-caption`, `search-term`, `search-result-count`, `search_completed`, `no-results`, `sort`, `filters`, `category-<ULID>`, `brand-<ULID>`, `eco-friendly-filter`, `product-<ULID>` (card link), `product-name`, `product-price`, `co2-rating-badge`, `out-of-stock`, `compare-btn`, `pagination-prev`, `pagination-next` (page buttons: `aria-label="Page-N"`), `page-title` (category page) |
| **Comparison** | `comparison-bar`, `clear-comparison`, `compare-link`, `comparison-title`, `show-differences`, `comparison-table`, `remove-product`, `compare-price`, `compare-brand`, `compare-category`, `compare-stock`, `compare-co2`, `compare-eco`, `compare-spec`, `compare-description` |
| **Product detail** | `product-name`, `unit-price`, `product-description`, `co2-rating-badge`, `decrease-quantity`, `quantity`, `increase-quantity`, `add-to-cart`, `add-to-favorites`, `add-to-compare`, `out-of-stock`, `specs-title`, `product-specs`, `spec-row`, `spec-name`, `spec-value`, `spec-value-text`, `spec-unit` |
| **Cart (checkout step 1)** | `product-title`, `product-quantity`, `product-price`, `line-price`, `cart-total`, `continue-shopping`, `proceed-1` (the row delete button has no data-test: `a.btn-danger`) |
| **Checkout step 2** | `email`, `password`, `login-submit`, `guest-email`, `guest-first-name`, `guest-last-name`, `guest-submit`, `proceed-2`, `proceed-2-guest` |
| **Checkout step 3** | `country`, `postal_code`, `house_number`, `street`, `city`, `state`, `postcode-lookup-hint`, `proceed-3` |
| **Checkout step 4** | `payment-method`, `bank_name`, `account_name`, `account_number`, `credit_card_number`, `expiration_date`, `cvv`, `card_holder_name`, `monthly_installments`, `gift_card_number`, `validation_code`, `finish`, `payment-success-message` |
| **Login** | `login-form`, `email`, `password`, `login-submit`, `login-error`, `email-error`, `password-error`, `register-link`, `forgot-password-link` |
| **Register** | `register-form`, `first-name`, `last-name`, `dob`, `country`, `postal_code`, `house_number`, `street`, `city`, `state`, `phone`, `email`, `password`, `register-submit`, plus `<field>-error` for each |
| **Forgot password** | `forgot-password-form`, `email`, `email-error`, `forgot-password-submit` |
| **Account** | `page-title`, `nav-favorites`, `nav-profile`, `nav-invoices`, `nav-messages` |
| **Profile** | `first-name`, `last-name`, `email`, `phone`, `street`, `postal_code`, `city`, `state`, `country`, `update-profile-submit`, `current-password`, `new-password`, `new-password-confirm`, `change-password-submit`, `totp-secret`, `totp-code`, `verify-totp` |
| **Favorites** | `favorite-<id>`, `product-name`, `product-description`, `delete` |
| **Invoice detail** | `invoice-number`, `invoice-date`, `total`, `street`, `postal_code`, `city`, `state`, `country`, `payment-method`, `download-invoice` |
| **Contact** | `first-name`, `last-name`, `email`, `subject`, `message`, `attachment`, `contact-submit`, plus `<field>-error` and `attachment-error` |
| **Chat** | `chat-toggle`, `chat-window`, `chat-close`, `chat-action-find-product`, `chat-action-order-product`, `chat-action-start-checkout`, `chat-action-support-ticket`, `chat-file-input` |
| **Admin: menu** | `nav-admin-dashboard`, `nav-admin-brands`, `nav-admin-categories`, `nav-admin-products`, `nav-admin-orders`, `nav-admin-users`, `nav-admin-messages`, `nav-admin-settings`, `nav-admin-statistics`, `nav-average-month-sales`, `nav-average-week-sales` |
| **Admin: lists** | `{product,category,brand,user,order}-search-form` / `-search-query` / `-search-submit` / `-search-reset`, `{product,category,brand,user}-add`, `{product,category,user,order}-edit-<id>`, `{product,category,user}-delete-<id>`, `message-details-<id>` |
| **Admin: product form** | `name`, `description`, `stock`, `price`, `location-offer`, `rental`, `co2-rating`, `brand-id`, `category-id`, `product-image-id`, `product-submit`, `back` |

---

## 16. Observations from exploration (possible bugs or doc gaps)

1. **Password minimum length:** the register form error says "minimal 6 characters", but the v5 user story says at least 8 (AUTH-12).
2. **Search under 3 characters:** no caption, no result count and no validation message. Unclear whether a search ran (CAT-05).
3. **Postcode lookup overwrites typed address fields** in checkout step 3 (CHK-07).
4. **Guest checkout** ("Continue as Guest") exists on v5 but isn't described in the v5 user story.
5. **Features missing from the docs:** CO₂ rating badge and sort, eco-friendly filter, product comparison, specifications table, postcode lookup with house number, Greek (EL) language.
6. **Chat window blocks clicks** on elements underneath it while open (CHAT-01). Automation must close it first.
7. **Shared-environment noise:** junk brands from other testers (`rQ01`, `abc`, `brand123`) appear in the filters and the admin product form.

---

## 17. Suggested automation order (Playwright practice path)

| Step | Cases | Playwright skills to practice |
|---|---|---|
| 1 | NAV-01, NAV-04, CAT-01…03, PDP-01, PDP-03 | `getByTestId`, `toHaveText`, `toHaveURL`, `toHaveCount` |
| 2 | CAT-06…08, CAT-14 | Reading lists with `allTextContents()`, sorting assertions, `getByRole` |
| 3 | AUTH-01…04, AUTH-06 | Page Object Model (LoginPage), `test.describe`, tags with `--grep @smoke` |
| 4 | AUTH-09…13 | Test data factories (faker), parametrized tests (loop over cases), API setup with `request` |
| 5 | All logged-in cases | Log in once via `storageState` in a setup project, then reuse the session |
| 6 | CART-*, CHK-01…03 | Custom fixtures (`cartWithItem`), multi-step flows, `test.step` |
| 7 | CHK-09…14 | Data-driven payment cases, checking that buttons are disabled |
| 8 | CNT-06, ACC-08 | `setInputFiles` with buffers, `waitForEvent('download')` |
| 9 | CAT-12, CHK-07 | Keyboard on the slider, `page.route` to mock or stub network responses |
| 10 | ADM-* | Admin `storageState`, create and clean up data via the API in `afterEach` |
| 11 | Everything | Run against `with-bugs.practicesoftwaretesting.com` and triage the failures |
