// Default things-to-buy, dishes and menus loaded on first start.
// Quantities are "per 100 plates" starting points - the head cook should check
// and correct them in Settings. Rates are rough rupee prices, only for estimates.

// [id, name, malayalam, unit, group, rate]
const ITEMS = [
  // Vegetables
  ['cabbage', 'Cabbage', 'കാബേജ്', 'kg', 'Vegetables', 40],
  ['carrot', 'Carrot', 'കാരറ്റ്', 'kg', 'Vegetables', 60],
  ['beans', 'Beans', 'ബീൻസ്', 'kg', 'Vegetables', 80],
  ['drumstick', 'Drumstick', 'മുരിങ്ങക്കായ', 'kg', 'Vegetables', 80],
  ['brinjal', 'Brinjal', 'വഴുതനങ്ങ', 'kg', 'Vegetables', 50],
  ['ladysfinger', "Lady's finger", 'വെണ്ടയ്ക്ക', 'kg', 'Vegetables', 50],
  ['rawbanana', 'Raw banana (Nendran)', 'നേന്ത്രക്കായ', 'kg', 'Vegetables', 50],
  ['yam', 'Yam', 'ചേന', 'kg', 'Vegetables', 60],
  ['ashgourd', 'Ash gourd', 'കുമ്പളങ്ങ', 'kg', 'Vegetables', 30],
  ['pumpkin', 'Pumpkin', 'മത്തങ്ങ', 'kg', 'Vegetables', 30],
  ['cucumber', 'Cucumber (Vellari)', 'വെള്ളരിക്ക', 'kg', 'Vegetables', 40],
  ['tomato', 'Tomato', 'തക്കാളി', 'kg', 'Vegetables', 40],
  ['onion', 'Onion', 'സവാള', 'kg', 'Vegetables', 40],
  ['shallots', 'Small onion (Shallots)', 'ചെറിയ ഉള്ളി', 'kg', 'Vegetables', 80],
  ['potato', 'Potato', 'ഉരുളക്കിഴങ്ങ്', 'kg', 'Vegetables', 40],
  ['greenchilli', 'Green chilli', 'പച്ചമുളക്', 'kg', 'Vegetables', 80],
  ['ginger', 'Ginger', 'ഇഞ്ചി', 'kg', 'Vegetables', 120],
  ['garlic', 'Garlic', 'വെളുത്തുള്ളി', 'kg', 'Vegetables', 200],
  ['curryleaves', 'Curry leaves', 'കറിവേപ്പില', 'kg', 'Vegetables', 60],
  ['coriander', 'Coriander leaves', 'മല്ലിയില', 'kg', 'Vegetables', 80],
  ['mint', 'Mint leaves', 'പുതിനയില', 'kg', 'Vegetables', 100],
  ['lemon', 'Lemon', 'ചെറുനാരങ്ങ', 'kg', 'Vegetables', 120],
  // Fruits
  ['pineapple', 'Pineapple', 'കൈതച്ചക്ക', 'kg', 'Fruits', 60],
  ['poovan', 'Banana (Poovan)', 'പൂവൻ പഴം', 'nos', 'Fruits', 5],
  ['nendranripe', 'Ripe Nendran banana', 'നേന്ത്രപ്പഴം', 'kg', 'Fruits', 70],
  // Coconut & oil
  ['coconut', 'Coconut', 'തേങ്ങ', 'nos', 'Coconut & Oil', 45],
  ['coconutoil', 'Coconut oil', 'വെളിച്ചെണ്ണ', 'L', 'Coconut & Oil', 260],
  ['fryingoil', 'Frying oil', 'എണ്ണ (വറുക്കാൻ)', 'L', 'Coconut & Oil', 150],
  // Grocery
  ['mattarice', 'Matta rice', 'കുത്തരി', 'kg', 'Grocery', 55],
  ['biriyanirice', 'Jeerakasala rice', 'ജീരകശാല അരി', 'kg', 'Grocery', 140],
  ['rawrice', 'Raw rice (Pachari)', 'പച്ചരി', 'kg', 'Grocery', 45],
  ['toordal', 'Toor dal', 'തുവരപ്പരിപ്പ്', 'kg', 'Grocery', 160],
  ['moongdal', 'Moong dal', 'ചെറുപയർ പരിപ്പ്', 'kg', 'Grocery', 130],
  ['redcowpeas', 'Red cowpeas (Vanpayar)', 'വൻപയർ', 'kg', 'Grocery', 110],
  ['tamarind', 'Tamarind', 'പുളി', 'kg', 'Grocery', 180],
  ['jaggery', 'Jaggery', 'ശർക്കര', 'kg', 'Grocery', 70],
  ['sugar', 'Sugar', 'പഞ്ചസാര', 'kg', 'Grocery', 45],
  ['salt', 'Salt', 'ഉപ്പ്', 'kg', 'Grocery', 25],
  ['sambarpowder', 'Sambar powder', 'സാമ്പാർ പൊടി', 'kg', 'Grocery', 400],
  ['rasampowder', 'Rasam powder', 'രസം പൊടി', 'kg', 'Grocery', 400],
  ['chillipowder', 'Chilli powder', 'മുളകുപൊടി', 'kg', 'Grocery', 350],
  ['turmeric', 'Turmeric powder', 'മഞ്ഞൾപ്പൊടി', 'kg', 'Grocery', 300],
  ['mustard', 'Mustard seeds', 'കടുക്', 'kg', 'Grocery', 120],
  ['pepper', 'Black pepper', 'കുരുമുളക്', 'kg', 'Grocery', 700],
  ['cardamom', 'Cardamom', 'ഏലയ്ക്ക', 'kg', 'Grocery', 2500],
  ['cashew', 'Cashew', 'അണ്ടിപ്പരിപ്പ്', 'kg', 'Grocery', 900],
  ['raisins', 'Raisins', 'ഉണക്കമുന്തിരി', 'kg', 'Grocery', 400],
  ['ada', 'Rice ada', 'അട', 'kg', 'Grocery', 200],
  ['palada', 'Palada', 'പാലട', 'kg', 'Grocery', 250],
  ['biriyanimasala', 'Biriyani masala', 'ബിരിയാണി മസാല', 'kg', 'Grocery', 600],
  ['maida', 'Maida', 'മൈദ', 'kg', 'Grocery', 50],
  ['teapowder', 'Tea powder', 'ചായപ്പൊടി', 'kg', 'Grocery', 450],
  ['pappadam', 'Pappadam', 'പപ്പടം', 'nos', 'Grocery', 1.5],
  ['chips', 'Banana chips', 'ഉപ്പേരി', 'kg', 'Grocery', 400],
  ['sharkaravaratti', 'Sharkara varatti', 'ശർക്കര വരട്ടി', 'kg', 'Grocery', 400],
  ['limepickle', 'Lime pickle', 'നാരങ്ങ അച്ചാർ', 'kg', 'Grocery', 200],
  ['mangopickle', 'Mango pickle', 'മാങ്ങ അച്ചാർ', 'kg', 'Grocery', 200],
  // Dairy
  ['ghee', 'Ghee', 'നെയ്യ്', 'kg', 'Dairy', 700],
  ['curd', 'Curd', 'തൈര്', 'L', 'Dairy', 70],
  ['milk', 'Milk', 'പാൽ', 'L', 'Dairy', 56],
  // Meat & fish
  ['chicken', 'Chicken', 'ചിക്കൻ', 'kg', 'Meat & Fish', 180],
  ['egg', 'Egg', 'മുട്ട', 'nos', 'Meat & Fish', 7],
  // Disposables
  ['leaf', 'Banana leaf', 'വാഴയില', 'nos', 'Disposables', 6],
  ['watercup', 'Drinking water cup', 'കുടിവെള്ളം കപ്പ്', 'nos', 'Disposables', 3],
  ['papercup', 'Paper cup', 'പേപ്പർ കപ്പ്', 'nos', 'Disposables', 1],
  ['plate', 'Disposable plate', 'പ്ലേറ്റ്', 'nos', 'Disposables', 3],
  ['tissue', 'Tissue paper', 'ടിഷ്യു', 'pkt', 'Disposables', 40],
  // Gas & fuel
  ['gas', 'Gas cylinder (commercial)', 'ഗ്യാസ് സിലിണ്ടർ', 'nos', 'Gas & Fuel', 1900],
  ['firewood', 'Firewood', 'വിറക്', 'kg', 'Gas & Fuel', 10],
];

// [id, name, malayalam, category, [[itemId, qtyPer100Plates], ...]]
const DISHES = [
  ['rice', 'Rice (Choru)', 'ചോറ്', 'Main', [['mattarice', 12], ['salt', 0.1]]],
  ['parippu', 'Parippu with ghee', 'പരിപ്പ്', 'Curry', [['moongdal', 1.5], ['ghee', 0.5], ['coconut', 2], ['shallots', 0.25], ['greenchilli', 0.1], ['turmeric', 0.02], ['salt', 0.05]]],
  ['sambar', 'Sambar', 'സാമ്പാർ', 'Curry', [['toordal', 2], ['sambarpowder', 0.4], ['tamarind', 0.3], ['drumstick', 1], ['brinjal', 1], ['ladysfinger', 1], ['carrot', 0.5], ['ashgourd', 1], ['shallots', 1], ['tomato', 1], ['coconutoil', 0.2], ['mustard', 0.05], ['curryleaves', 0.1], ['salt', 0.3]]],
  ['avial', 'Avial', 'അവിയൽ', 'Curry', [['rawbanana', 2], ['yam', 2], ['carrot', 1], ['drumstick', 1], ['cucumber', 1.5], ['beans', 1], ['coconut', 10], ['curd', 1], ['coconutoil', 0.5], ['greenchilli', 0.2], ['curryleaves', 0.1], ['turmeric', 0.02], ['salt', 0.2]]],
  ['thoran', 'Cabbage thoran', 'തോരൻ', 'Curry', [['cabbage', 5], ['coconut', 5], ['greenchilli', 0.2], ['shallots', 0.25], ['coconutoil', 0.2], ['mustard', 0.05], ['curryleaves', 0.05], ['salt', 0.1]]],
  ['olan', 'Olan', 'ഓലൻ', 'Curry', [['ashgourd', 4], ['redcowpeas', 0.5], ['coconut', 6], ['coconutoil', 0.2], ['greenchilli', 0.1], ['salt', 0.1]]],
  ['kaalan', 'Kaalan', 'കാളൻ', 'Curry', [['rawbanana', 2], ['yam', 2], ['curd', 4], ['coconut', 5], ['pepper', 0.05], ['turmeric', 0.03], ['coconutoil', 0.1], ['salt', 0.1]]],
  ['pachadi', 'Pineapple pachadi', 'പച്ചടി', 'Curry', [['pineapple', 4], ['curd', 2], ['coconut', 4], ['sugar', 0.5], ['mustard', 0.05]]],
  ['kichadi', 'Kichadi', 'കിച്ചടി', 'Curry', [['cucumber', 3], ['curd', 3], ['coconut', 4], ['greenchilli', 0.1], ['mustard', 0.05]]],
  ['erissery', 'Erissery', 'എരിശ്ശേരി', 'Curry', [['pumpkin', 4], ['redcowpeas', 0.5], ['coconut', 6], ['coconutoil', 0.2], ['salt', 0.1]]],
  ['rasam', 'Rasam', 'രസം', 'Curry', [['tamarind', 0.3], ['tomato', 2], ['rasampowder', 0.3], ['pepper', 0.05], ['garlic', 0.2], ['coriander', 0.1], ['salt', 0.15]]],
  ['moru', 'Moru (buttermilk)', 'മോര്', 'Curry', [['curd', 6], ['greenchilli', 0.1], ['ginger', 0.1], ['shallots', 0.2], ['curryleaves', 0.05], ['salt', 0.1]]],
  ['injicurry', 'Inji curry', 'ഇഞ്ചിക്കറി', 'Side', [['ginger', 1], ['tamarind', 0.3], ['jaggery', 0.5], ['chillipowder', 0.05], ['coconutoil', 0.2]]],
  ['limepickle', 'Lime pickle', 'നാരങ്ങ അച്ചാർ', 'Side', [['limepickle', 2]]],
  ['mangopickle', 'Mango pickle', 'മാങ്ങ അച്ചാർ', 'Side', [['mangopickle', 2]]],
  ['pappadam', 'Pappadam', 'പപ്പടം', 'Side', [['pappadam', 200], ['fryingoil', 2]]],
  ['chips', 'Banana chips', 'ഉപ്പേരി', 'Side', [['chips', 2]]],
  ['sharkara', 'Sharkara varatti', 'ശർക്കര വരട്ടി', 'Side', [['sharkaravaratti', 2]]],
  ['banana', 'Banana', 'പഴം', 'Side', [['poovan', 100]]],
  ['adapradhaman', 'Ada pradhaman', 'അട പ്രഥമൻ', 'Payasam', [['ada', 2], ['jaggery', 6], ['coconut', 15], ['ghee', 0.5], ['cashew', 0.3], ['raisins', 0.2], ['cardamom', 0.05]]],
  ['palpayasam', 'Palada payasam', 'പാലട പായസം', 'Payasam', [['milk', 20], ['palada', 1.5], ['sugar', 5], ['ghee', 0.2], ['cashew', 0.2], ['cardamom', 0.03]]],
  ['chickenbiriyani', 'Chicken biriyani', 'ചിക്കൻ ബിരിയാണി', 'Main', [['chicken', 15], ['biriyanirice', 12], ['ghee', 1.5], ['onion', 10], ['tomato', 3], ['ginger', 1], ['garlic', 1], ['greenchilli', 0.5], ['curd', 2], ['coriander', 0.5], ['mint', 0.3], ['biriyanimasala', 0.3], ['cashew', 0.5], ['raisins', 0.3], ['lemon', 0.5], ['fryingoil', 2], ['salt', 0.5]]],
  ['salad', 'Salad', 'സാലഡ്', 'Side', [['onion', 3], ['cucumber', 2], ['greenchilli', 0.1], ['lemon', 0.2]]],
  ['appam', 'Appam', 'അപ്പം', 'Main', [['rawrice', 6], ['coconut', 8], ['sugar', 0.5], ['salt', 0.1]]],
  ['vegstew', 'Veg stew', 'വെജ് സ്റ്റൂ', 'Curry', [['potato', 4], ['carrot', 2], ['beans', 1], ['onion', 2], ['coconut', 12], ['ginger', 0.2], ['greenchilli', 0.2], ['coconutoil', 0.3], ['curryleaves', 0.05], ['salt', 0.1]]],
  ['eggroast', 'Egg roast', 'മുട്ട റോസ്റ്റ്', 'Curry', [['egg', 100], ['onion', 6], ['tomato', 2], ['chillipowder', 0.1], ['coconutoil', 0.5], ['salt', 0.1]]],
  ['tea', 'Tea', 'ചായ', 'Drinks', [['milk', 10], ['teapowder', 0.4], ['sugar', 2], ['papercup', 120]]],
  ['pazhampori', 'Pazhampori', 'പഴംപൊരി', 'Snacks', [['nendranripe', 12], ['maida', 3], ['sugar', 0.5], ['fryingoil', 3], ['turmeric', 0.01]]],
  ['leafserve', 'Banana leaf serving', 'ഇല', 'Serving & Kitchen', [['leaf', 110]]],
  ['plateserve', 'Plates & tissue', 'പ്ലേറ്റ്', 'Serving & Kitchen', [['plate', 110], ['tissue', 2]]],
  ['water', 'Drinking water', 'കുടിവെള്ളം', 'Serving & Kitchen', [['watercup', 120]]],
  ['kitchengas', 'Kitchen gas', 'ഗ്യാസ്', 'Serving & Kitchen', [['gas', 1]]],
];

// [id, name, ratePerPlate, [dishIds]]
const MENUS = [
  ['sadhya', 'Sadhya (Full)', 350, ['rice', 'parippu', 'sambar', 'avial', 'thoran', 'olan', 'kaalan', 'pachadi', 'kichadi', 'erissery', 'rasam', 'moru', 'injicurry', 'limepickle', 'mangopickle', 'pappadam', 'chips', 'sharkara', 'banana', 'adapradhaman', 'palpayasam', 'leafserve', 'water', 'kitchengas']],
  ['minisadhya', 'Sadhya (Mini)', 250, ['rice', 'parippu', 'sambar', 'avial', 'thoran', 'kaalan', 'pachadi', 'moru', 'injicurry', 'limepickle', 'pappadam', 'chips', 'banana', 'adapradhaman', 'leafserve', 'water', 'kitchengas']],
  ['biriyani', 'Chicken Biriyani', 280, ['chickenbiriyani', 'salad', 'limepickle', 'plateserve', 'water', 'kitchengas']],
  ['breakfast', 'Breakfast (Appam & Stew)', 150, ['appam', 'vegstew', 'eggroast', 'tea', 'plateserve', 'water', 'kitchengas']],
  ['teasnacks', 'Tea & Snacks', 60, ['tea', 'pazhampori', 'kitchengas']],
];

export function seedRecords() {
  const now = Date.now();
  const out = [];
  ITEMS.forEach(([id, name, ml, unit, group, rate]) => out.push({ coll: 'items', id, data: { id, name, ml, unit, group, rate, createdAt: now } }));
  DISHES.forEach(([id, name, ml, cat, recipe]) => out.push({ coll: 'dishes', id, data: { id, name, ml, cat, recipe: recipe.map(([item, q]) => ({ item, q })), createdAt: now } }));
  MENUS.forEach(([id, name, rate, dishIds], i) => out.push({ coll: 'menus', id, data: { id, name, rate, dishIds, sort: i, createdAt: now } }));
  return out;
}
