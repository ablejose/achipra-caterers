# Achipra Caters – internal tool

Orders → buying list → who buys what → bill photos → who must be paid.

## Start it

1. Install **Node.js 22 or newer** (LTS from nodejs.org) on the office computer. Nothing else is needed: no npm install.
2. Double-click **`Start Achipra.bat`**. A black window opens and shows two addresses:
   - `http://localhost:8080` for this computer
   - `http://192.168.x.x:8080` for phones on the same Wi-Fi
3. The first time, the app asks for the company name, a **team password** (everyone shares it) and the names of the people who go to buy.
4. On each phone open the second address in Chrome and choose **Add to Home screen**, so it opens like an app.

Keep the black window open while people are using the app.

## Where the data is

Everything is in the `data` folder: `achipra.db` (all orders, lists, bills, money) and `data/uploads` (bill photos).
Copy that folder to keep a backup, or use **Settings → Download backup**.

## How it works

- **Settings → Food types**: Sadhya (Full), Sadhya (Mini), Chicken Biriyani, Breakfast, Tea & Snacks. Each is a set of dishes.
- **Settings → Dishes and recipes**: what each dish needs for **100 plates**. The app multiplies it for the order and rounds up to amounts a shop gives (for example 0.25 kg steps, whole coconuts).
- **Settings → Things to buy**: unit, shop type (Vegetables, Grocery, Dairy…), and a rough rate used only for the cost estimate.
- **New order**: pick the food type and plates. Untick dishes the customer doesn't want, or add others. The buying list is made at once.
- **To buy**: tick a thing when it is bought (your name goes on it). "Give all to…" gives a whole shop type to one person. "Send list" shares the list on WhatsApp. Tap a line to change the amount, give it to someone, or mark "have in stock".
- **Bills**: the buyer takes a photo of the bill and types the amount. "Paid" means the buyer paid from their pocket. "Credit" means the shop is paid later.
- **Money**: who the office must pay (bills they paid minus advances given), shops not paid, customers still to pay, and who buys the most.
- If a phone has no signal, ticks and bills are kept on the phone and sent when it connects again.

The default recipe amounts are starting estimates. Have the head cook check them in Settings before the first real order.

## Using it outside the office Wi-Fi

Right now the app runs on the office computer, so phones must be on the same Wi-Fi. To use it from the market on mobile data, run this same folder on a small cloud server (any VPS with Node 22). Set `PORT` and optionally `DATA_DIR`, and put it behind HTTPS.
