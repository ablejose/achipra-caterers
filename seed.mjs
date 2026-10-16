// Default lists, taken from Achipra's printed purchase sheets:
//   പലചരക്ക് (Grocery), പച്ചക്കറി (Vegetables), പലവക (Miscellaneous), പാത്രങ്ങൾ (Vessels).
// Items keep the sheet's order. Recipe amounts are "per 100 plates" starting points
// for the head cook to correct in Settings. Rates are rough rupee prices, only for estimates.
import fs from 'node:fs';
import path from 'node:path';

export const SEED_VERSION = 2;

// [id, name, malayalam (as printed), unit, rate]
const GROCERY = [
  ['rice', 'Rice (Kuruva / Matta / Jaya)', 'അരി കുറുവ / മട്ട / ജയ', 'kg', 50],
  ['ponnirice', 'Ponni rice', 'അരി പൊന്നി', 'kg', 55],
  ['quickrice', 'Quick-cook rice', 'വേഗംവേവുന്ന അരി', 'kg', 60],
  ['biriyanirice', 'Biriyani rice', 'ബിരിയാണി അരി', 'kg', 140],
  ['basmati', 'Basmati rice', 'ബാസ്മതി റൈസ്', 'kg', 150],
  ['unakkalari', 'Unakkalari (3 nurukku)', 'ഉണങ്ങലരി 3 നുറുക്ക്', 'kg', 50],
  ['wheatnurukku', 'Broken wheat', 'ഗോതമ്പുനുറുക്ക്', 'kg', 50],
  ['ada', 'Matta rice ada', 'മട്ട അരി അട', 'kg', 200],
  ['salt', 'Rock salt', 'കല്ലുപ്പ്', 'kg', 15],
  ['saltpowder', 'Powder salt', 'പൊടിയുപ്പ്', 'kg', 25],
  ['corianderseed', 'Coriander seeds', 'മല്ലി', 'kg', 160],
  ['drychilli', 'Dry chilli (no stalk)', 'മുളക് ഞെട്ടില്ലാത്തത്', 'kg', 250],
  ['fenugreek', 'Fenugreek', 'ഉലുവ', 'kg', 120],
  ['chanadal', 'Kadala parippu', 'കടലപരിപ്പ്', 'kg', 100],
  ['uraddal', 'Uzhunnu parippu', 'ഉഴുന്നുപരിപ്പ്', 'kg', 140],
  ['toordal', 'Thuvara parippu', 'തുവരപരിപ്പ്', 'kg', 160],
  ['moongdal', 'Cherupayar parippu', 'ചെറുപയർപരിപ്പ്', 'kg', 130],
  ['asafoetida', 'Kayam', 'കായം', 'kg', 1800],
  ['asafoetidapowder', 'Kayam powder', 'കായംപൊടി', 'kg', 1000],
  ['chickpeas', 'Kadala', 'കടല', 'kg', 90],
  ['greenpeas', 'Green peas', 'പച്ചപട്ടാണി', 'kg', 120],
  ['redcowpeas', 'Vanpayar', 'വൻപയർ', 'kg', 110],
  ['sesame', 'Sesame', 'എള്ള്', 'kg', 200],
  ['mustard', 'Mustard', 'കടുക്', 'kg', 120],
  ['cumin', 'Jeerakam', 'ജീരകം', 'kg', 350],
  ['turmeric', 'Turmeric powder', 'മഞ്ഞൾപൊടി', 'kg', 300],
  ['chillipowder', 'Chilli powder', 'മുളക്പൊടി', 'kg', 350],
  ['kashmirichilli', 'Kashmiri chilli powder', 'കാഷ്മീരി മുളക്പൊടി', 'kg', 500],
  ['pepper', 'Pepper powder', 'കുരുമുളക്പൊടി', 'kg', 800],
  ['sambarpowder', 'Sambar powder', 'സാമ്പാർപൊടി', 'kg', 400],
  ['dryginger', 'Chukku powder', 'ചുക്കുപൊടി', 'kg', 600],
  ['cuminpowder', 'Jeerakam powder', 'ജീരകപൊടി', 'kg', 450],
  ['garampowder', 'Garam masala powder', 'ഗരംമസാല പൗഡർ', 'kg', 800],
  ['vegmasala', 'Veg masala', 'വെജ്മസാല', 'kg', 500],
  ['chickenmasala', 'Chicken masala', 'ചിക്കൻമസാല', 'kg', 500],
  ['coconutoil', 'Coconut oil', 'വെളിച്ചെണ്ണ', 'L', 260],
  ['oil', 'Oil', 'ഓയൽ', 'L', 130],
  ['sunfloweroil', 'Sunflower oil', 'സൺഫ്ളവർ ഓയിൽ', 'L', 150],
  ['dalda', 'Dalda', 'ഡാൽഡ', 'kg', 150],
  ['rkg', 'RKG ghee', 'ആർ.കെ.ജി.', 'kg', 650],
  ['ghee', 'Milma ghee', 'മിൽമ നെയ്യ്', 'kg', 700],
  ['teapowder', 'Tea powder', 'ചായപൊടി', 'kg', 450],
  ['coffeepowder', 'Coffee powder', 'കാപ്പിപൊടി', 'kg', 600],
  ['bru', 'Bru instant', 'ബ്രൂ ഇൻസ്റ്റന്റ്', 'kg', 1200],
  ['dahashamani', 'Dahashamani', 'ദാഹശമനി', 'kg', 300],
  ['milkpowder', 'Milk powder (Everyday)', 'പാൽപൊടി (എവരിഡെ)', 'kg', 500],
  ['aval', 'Aval', 'അവിൽ', 'kg', 70],
  ['rava', 'Rava', 'റവ', 'kg', 50],
  ['wheatrava', 'Wheat rava', 'ഗോതമ്പുറവ', 'kg', 55],
  ['semiya', 'Semiya (roasted)', 'സേമിയ വറുത്തത്', 'kg', 120],
  ['maida', 'Maida', 'മൈദ', 'kg', 50],
  ['riceflour', 'Rice flour', 'അരിപൊടി', 'kg', 60],
  ['cornflour', 'Corn flour', 'കോൺഫ്ളവർ', 'kg', 100],
  ['besan', 'Kadalamavu', 'കടലമാവ്', 'kg', 110],
  ['cashew', 'Cashew', 'അണ്ടിപരിപ്പ്', 'kg', 900],
  ['kalkandam', 'Kalkandam', 'കൽക്കണ്ടം', 'kg', 150],
  ['raisins', 'Raisins', 'മുന്തിരി', 'kg', 400],
  ['cardamom', 'Cardamom', 'ഏലക്കായ', 'kg', 2500],
  ['garammasala', 'Garam masala', 'ഗരംമസാല', 'kg', 800],
  ['colouryellow', 'Food colour yellow', 'കളർ മഞ്ഞ', 'nos', 20],
  ['colourred', 'Food colour red', 'കളർ ചുവപ്പ്', 'nos', 20],
  ['tamarind', 'Tamarind (new)', 'പുളി പുതിയത്', 'kg', 180],
  ['tamarindold', 'Tamarind (old)', 'പുളി പഴയത്', 'kg', 150],
  ['chillisauce', 'Chilli sauce', 'ചില്ലി സോസ്', 'nos', 120],
  ['soyasauce', 'Soya sauce', 'സോയ സോസ്', 'nos', 100],
  ['tomatosauce', 'Tomato sauce', 'ടൊമാറ്റോ സോസ്', 'nos', 120],
  ['soap', 'Washing soap', 'സോപ്പ് തേക്കുന്നത്', 'nos', 30],
  ['cleaningpowder', 'Cleaning powder', 'ക്ലീനിംഗ് പൗഡർ', 'nos', 50],
  ['vimbar', 'Vim bar', 'വിം കട്ട', 'nos', 10],
  ['scrubber', 'Steel wool / scrubber', 'കമ്പി / സ്ക്രബർ', 'nos', 10],
  ['matchbox', 'Matchbox', 'തീപ്പെട്ടി', 'nos', 2],
  ['paperglass150', 'Paper glass 150 ml', 'പേപ്പർഗ്ലാസ് 150 ml', 'nos', 1],
  ['paperglass100', 'Paper glass 100 ml', 'പേപ്പർ ഗ്ലാസ് 100 ml', 'nos', 0.7],
  ['paperplate', 'Paper plate (thick)', 'പേപ്പർ പ്ലേറ്റ് കനമുള്ളത്', 'nos', 3],
  ['thermocolplate', 'Thermocol plate (thick)', 'തെർമോക്കോൾ പ്ലേറ്റ് കനമുള്ളത്', 'nos', 2.5],
  ['paperroll', 'Paper roll', 'പേപ്പർ റോൾ', 'nos', 100],
  ['wastecover', 'Waste cover', 'വേസ്റ്റ് കവർ', 'pkt', 50],
  ['sasleafbig', 'SAS leaf (big)', 'SAS ഇല വലുത്', 'nos', 4],
  ['sasleafsmall', 'SAS leaf (small)', 'SAS ഇല ചെറുത്', 'nos', 3],
];

const VEGETABLES = [
  ['nendranripe', 'Nendran banana (ripe)', 'നേന്ത്രപഴം', 'kg', 70],
  ['poovan', 'Cherupazham / Njalipoovan', 'ചെറുപഴം / ഞാലിപ്പൂവൻ', 'nos', 4],
  ['rawbanana', 'Nendran (raw)', 'നേന്ത്രക്കായ', 'kg', 50],
  ['ladysfinger', "Lady's finger", 'വെണ്ടക്ക', 'kg', 50],
  ['tomato', 'Tomato', 'തക്കാളി', 'kg', 40],
  ['drumstick', 'Drumstick', 'മുരിങ്ങക്കായ', 'kg', 80],
  ['bittergourd', 'Bitter gourd', 'കയ്പക്ക', 'kg', 60],
  ['yam', 'Yam', 'ചേന', 'kg', 60],
  ['longbeans', 'Long beans', 'കെട്ടുപയർ', 'kg', 60],
  ['carrot', 'Carrot', 'കാരറ്റ്', 'kg', 60],
  ['beans', 'Beans', 'ബീൻസ്', 'kg', 80],
  ['cabbage', 'Cabbage', 'കാബേജ്', 'kg', 40],
  ['ashgourd', 'Ash gourd (Elavan)', 'എളവൻ', 'kg', 30],
  ['greenpumpkin', 'Green pumpkin (white inside)', 'പച്ചമത്തൻ (ഉള്ള് വെള്ള)', 'kg', 30],
  ['pumpkin', 'Ripe pumpkin', 'പഴുത്ത മത്തൻ', 'kg', 35],
  ['pineapple', 'Pineapple', 'പൈനാപ്പിൾ', 'kg', 60],
  ['cucumber', 'Cucumber (Kakkarikka)', 'കക്കരിക്ക', 'kg', 40],
  ['ginger', 'Ginger', 'ഇഞ്ചി', 'kg', 120],
  ['greenchilli', 'Green chilli', 'പച്ചമുളക്', 'kg', 80],
  ['curryleaves', 'Curry leaves', 'കറിവേപ്പില', 'kg', 60],
  ['coriander', 'Coriander leaves', 'മല്ലിച്ചപ്പ്', 'kg', 80],
  ['mint', 'Mint', 'പൊതീന', 'kg', 100],
  ['celery', 'Leaf celery', 'ലീഫ്സില്ലറി', 'kg', 150],
  ['springonion', 'Spring onion', 'സ്പ്രിംഗ് ഒനിയൻ', 'kg', 100],
  ['rawmango', 'Raw mango (sour)', 'പച്ചമാങ്ങ (പുളിയുള്ളത്)', 'kg', 80],
  ['ripemango', 'Ripe mango', 'പഴുത്ത മാങ്ങ', 'kg', 100],
  ['vadukapuli', 'Vadukapuli naranga', 'വടുകപ്പുളി നാരങ്ങ', 'kg', 80],
  ['lemon', 'Lemon', 'ചെറുനാരങ്ങ', 'kg', 120],
  ['gooseberry', 'Gooseberry', 'നെല്ലിക്ക', 'kg', 100],
  ['onion', 'Onion (Sabola)', 'സബോള', 'kg', 40],
  ['potato', 'Potato', 'ഉരുളക്കിഴങ്ങ്', 'kg', 40],
  ['cauliflower', 'Cauliflower', 'കോളിഫ്ളവർ', 'kg', 50],
  ['radish', 'Radish', 'മുള്ളങ്കി', 'kg', 40],
  ['knolkhol', 'Knol-khol', 'നൂൽക്കോസ്', 'kg', 50],
  ['karamees', 'Karamees', 'കരാമീസ്', 'kg', 0],
  ['garlic', 'Garlic', 'വെളുത്തുള്ളി', 'kg', 200],
  ['shallots', 'Small onion', 'ചെറിയ ഉള്ളി', 'kg', 80],
  ['leaf', 'Naakila (banana leaf)', 'നാക്കില', 'nos', 5],
];

const MISC = [
  ['milk', 'Milk (Milma)', 'പാൽ (മിൽമ)', 'L', 56],
  ['curd', 'Curd (Milma)', 'തൈര് (മിൽമ)', 'L', 70],
  ['curdlocal', 'Curd (local)', 'തൈര് നാടൻ', 'L', 60],
  ['coconut', 'Coconut (fresh)', 'നാളികേരം പച്ച', 'nos', 45],
  ['drycoconut', 'Coconut (dry)', 'നാളികേരം വരട്', 'nos', 40],
  ['kottathenga', 'Kottathenga', 'കൊട്ടത്തേങ്ങ', 'kg', 150],
  ['pappadambig', 'Pappadam (big)', 'പപ്പടം - വലുത്', 'nos', 2],
  ['pappadamsmall', 'Pappadam (small)', 'പപ്പടം - ചെറുത്', 'nos', 1],
  ['towel', 'Eerezha thorthu', 'ഈരെഴതോർത്ത്', 'nos', 80],
  ['betel', 'Betel leaf', 'വെറ്റില', 'nos', 1],
  ['adakka', 'Adakka', 'അടക്ക', 'nos', 3],
  ['pakku', 'Pakku', 'പാക്ക്', 'pkt', 10],
  ['chunnambu', 'Chunnambu', 'ചുണ്ണാമ്പ്', 'pkt', 10],
  ['tobacco', 'Pukayila', 'പുകയില', 'pkt', 20],
  ['firewood', 'Firewood', 'വിറക്', 'kg', 10],
  ['chakiri', 'Coconut husk', 'ചകിരി', 'nos', 2],
  ['chiratta', 'Coconut shell', 'ചിരട്ട', 'kg', 15],
  ['oldcloth', 'Old cloth', 'പഴയ തുണി', 'nos', 0],
  ['oldpaper', 'Old paper', 'പഴയ പേപ്പർ', 'kg', 15],
  ['paala', 'Paala', 'പാള', 'nos', 5],
  ['gasstove1', 'Gas stove (single)', 'ഗ്യാസടുപ്പ് Single', 'nos', 0],
  ['gasstove2', 'Gas stove (2 burner)', 'ഗ്യാസടുപ്പ് 2 Burner', 'nos', 0],
  ['gas', 'Gas cylinder 19 kg', 'ഗ്യാസ്കുറ്റി 19 kg', 'nos', 1900],
  ['mixie', 'Mixie', 'മിക്സി', 'nos', 0],
  ['knife', 'Vettukathi / Madaval', 'വെട്ടുകത്തി / മടവാൾ', 'nos', 0],
];

// Vessels are taken to the venue, not bought - rate 0. Add them to an order with "Add item".
const VESSELS = [
  ['charakku300', 'Charakku 300 L', 'ചരക്ക് 300 ltr'],
  ['charakku200', 'Charakku 200 L', 'ചരക്ക് 200 ltr'],
  ['charakku150', 'Charakku 150 L', 'ചരക്ക് 150 ltr'],
  ['charakku100', 'Charakku 100 L', 'ചരക്ക് 100 ltr'],
  ['charakku80', 'Charakku 80 L', 'ചരക്ക് 80 ltr'],
  ['charakku60', 'Charakku 60 L', 'ചരക്ക് 60 ltr'],
  ['uruli40', 'Uruli 40 L', 'ഉരുളി 40 ltr'],
  ['uruli30', 'Uruli 30 L', 'ഉരുളി 30 ltr'],
  ['uruli20', 'Uruli 20 L', 'ഉരുളി 20 ltr'],
  ['cheenachatti', 'Cheenachatti', 'ചീനച്ചട്ടി'],
  ['kathan75', 'Kathan chembu (rice) 75 kg', 'കാതൻചെമ്പ് ചോറ് 75 kg'],
  ['kathan50', 'Kathan chembu (rice) 50 kg', 'കാതൻചെമ്പ് ചോറ് 50 kg'],
  ['kathan30', 'Kathan chembu (rice) 30 kg', 'കാതൻചെമ്പ് ചോറ് 30 kg'],
  ['vatta50', 'Vatta chembu with lid 50 kg', 'വട്ടച്ചെമ്പ് അടപ്പടക്കം 50 kg'],
  ['vatta40', 'Vatta chembu with lid 40 kg', 'വട്ടച്ചെമ്പ് അടപ്പടക്കം 40 kg'],
  ['vatta30', 'Vatta chembu with lid 30 kg', 'വട്ടച്ചെമ്പ് അടപ്പടക്കം 30 kg'],
  ['vatta20', 'Vatta chembu with lid 20 kg', 'വട്ടച്ചെമ്പ് അടപ്പടക്കം 20 kg'],
  ['vatta10', 'Vatta chembu with lid 10 kg', 'വട്ടച്ചെമ്പ് അടപ്പടക്കം 10 kg'],
  ['vatta5', 'Vatta chembu with lid 5 kg', 'വട്ടച്ചെമ്പ് അടപ്പടക്കം 5 kg'],
  ['valpathram', 'Valpathram', 'വാൽപാത്രം'],
  ['andavubig', 'Andavu (big)', 'അണ്ടാവ് - വലുത്'],
  ['andavusmall', 'Andavu (small)', 'അണ്ടാവ് - ചെറുത്'],
  ['thalavarppan', 'Thalavarppan', 'തലവാർപ്പൻ'],
  ['kuthuchattukam', 'Kuthu chattukam', 'കുത്തുചട്ടുകം'],
  ['smallchattukam', 'Small chattukam', 'ചെറിയ ചട്ടുകം'],
  ['thulakkayil', 'Thulakkayil', 'തുളക്കയിൽ'],
  ['kannappa', 'Kannappa', 'കണ്ണാപ്പ'],
  ['kathuring', 'Kathu (ring)', 'കാത് (റിംഗ്)'],
  ['kottakkayil', 'Kottakkayil', 'കൊട്ടക്കയിൽ'],
  ['oottukotta', 'Oottukotta', 'ഊറ്റുകൊട്ട'],
  ['fibrekotta', 'Fibre kotta', 'ഫൈബർ കൊട്ട'],
  ['steelbucket', 'Steel bucket + kayil', 'സ്റ്റീൽ ബക്കറ്റ് + കയിൽ'],
  ['davara', 'Davara + teaspoon', 'ഡവറ + ടീസ്പൂൺ'],
  ['basin', 'Basin + kori', 'ബേസിൻ + കോരി'],
  ['steeljug', 'Steel jug', 'സ്റ്റീൽ ജഗ്ഗ്'],
  ['glasspayasam', 'Steel glass – payasam', 'സ്റ്റീൽഗ്ലാസ് - പായസം'],
  ['glasswater', 'Steel glass – water', 'സ്റ്റീൽഗ്ലാസ് - വെള്ളം'],
  ['flask', 'Flask', 'ഫ്ളാസ്ക്'],
  ['grinder', 'Grinder', 'ഗ്രൈന്റർ'],
  ['idlivessel', 'Idli vessel (with spare plates)', 'ഇഡലി പാത്രം (മാറ്റു തട്ടുള്ളത്)'],
].map(([id, name, ml]) => [id, name, ml, 'nos', 0]);

// [id, name, malayalam, category, [[itemId, qtyPer100Plates], ...]]
// Sugar and jaggery are not on the printed sheet, so the sweet dishes here have none -
// add them in Settings → Things to buy if they should be on the list.
const DISHES = [
  ['rice', 'Rice (Choru)', 'ചോറ്', 'Main', [['rice', 12], ['salt', 0.1]]],
  ['parippu', 'Parippu with ghee', 'പരിപ്പ്', 'Curry', [['moongdal', 1.5], ['ghee', 0.5], ['coconut', 2], ['shallots', 0.25], ['greenchilli', 0.1], ['cumin', 0.02], ['turmeric', 0.02], ['saltpowder', 0.05]]],
  ['sambar', 'Sambar', 'സാമ്പാർ', 'Curry', [['toordal', 2], ['sambarpowder', 0.4], ['tamarind', 0.3], ['drumstick', 1], ['ladysfinger', 1.5], ['carrot', 0.5], ['ashgourd', 1], ['shallots', 1], ['tomato', 1], ['drychilli', 0.05], ['fenugreek', 0.02], ['asafoetidapowder', 0.02], ['coconutoil', 0.2], ['mustard', 0.05], ['curryleaves', 0.1], ['salt', 0.3]]],
  ['avial', 'Avial', 'അവിയൽ', 'Curry', [['rawbanana', 2], ['yam', 2], ['carrot', 1], ['drumstick', 1], ['cucumber', 1.5], ['beans', 1], ['longbeans', 0.5], ['coconut', 10], ['curdlocal', 1], ['cumin', 0.02], ['coconutoil', 0.5], ['greenchilli', 0.2], ['curryleaves', 0.1], ['turmeric', 0.02], ['salt', 0.2]]],
  ['thoran', 'Cabbage thoran', 'തോരൻ', 'Curry', [['cabbage', 5], ['coconut', 5], ['greenchilli', 0.2], ['shallots', 0.25], ['uraddal', 0.05], ['coconutoil', 0.2], ['mustard', 0.05], ['curryleaves', 0.05], ['salt', 0.1]]],
  ['olan', 'Olan', 'ഓലൻ', 'Curry', [['ashgourd', 4], ['redcowpeas', 0.5], ['coconut', 6], ['coconutoil', 0.2], ['greenchilli', 0.1], ['curryleaves', 0.05], ['salt', 0.1]]],
  ['kaalan', 'Kaalan', 'കാളൻ', 'Curry', [['rawbanana', 2], ['yam', 2], ['curd', 4], ['coconut', 5], ['pepper', 0.05], ['fenugreek', 0.02], ['turmeric', 0.03], ['coconutoil', 0.1], ['salt', 0.1]]],
  ['pachadi', 'Pineapple pachadi', 'പച്ചടി', 'Curry', [['pineapple', 4], ['curd', 2], ['coconut', 4], ['greenchilli', 0.05], ['mustard', 0.05]]],
  ['kichadi', 'Kichadi', 'കിച്ചടി', 'Curry', [['cucumber', 3], ['curd', 3], ['coconut', 4], ['greenchilli', 0.1], ['mustard', 0.05]]],
  ['erissery', 'Erissery', 'എരിശ്ശേരി', 'Curry', [['pumpkin', 4], ['redcowpeas', 0.5], ['coconut', 6], ['cumin', 0.02], ['turmeric', 0.02], ['coconutoil', 0.2], ['salt', 0.1]]],
  ['rasam', 'Rasam', 'രസം', 'Curry', [['tamarind', 0.3], ['tomato', 2], ['pepper', 0.05], ['cuminpowder', 0.03], ['chillipowder', 0.03], ['garlic', 0.2], ['coriander', 0.1], ['asafoetidapowder', 0.02], ['salt', 0.15]]],
  ['moru', 'Moru (buttermilk)', 'മോര്', 'Curry', [['curdlocal', 6], ['greenchilli', 0.1], ['ginger', 0.1], ['shallots', 0.2], ['curryleaves', 0.05], ['salt', 0.1]]],
  ['injicurry', 'Inji curry', 'ഇഞ്ചിക്കറി', 'Side', [['ginger', 1], ['tamarind', 0.3], ['chillipowder', 0.05], ['fenugreek', 0.01], ['coconutoil', 0.2]]],
  ['limepickle', 'Lime pickle', 'നാരങ്ങ അച്ചാർ', 'Side', [['lemon', 2], ['kashmirichilli', 0.2], ['asafoetidapowder', 0.02], ['fenugreek', 0.02], ['oil', 0.2], ['saltpowder', 0.2]]],
  ['mangopickle', 'Mango pickle', 'മാങ്ങ അച്ചാർ', 'Side', [['rawmango', 2], ['kashmirichilli', 0.2], ['asafoetidapowder', 0.02], ['fenugreek', 0.02], ['oil', 0.2], ['saltpowder', 0.2]]],
  ['pappadam', 'Pappadam', 'പപ്പടം', 'Side', [['pappadambig', 100], ['pappadamsmall', 100], ['oil', 2]]],
  ['chips', 'Banana chips', 'ഉപ്പേരി', 'Side', [['rawbanana', 3], ['coconutoil', 1], ['turmeric', 0.01], ['saltpowder', 0.05]]],
  ['sharkara', 'Sharkara varatti', 'ശർക്കര വരട്ടി', 'Side', [['rawbanana', 2], ['coconutoil', 0.5], ['dryginger', 0.02], ['cardamom', 0.01]]],
  ['banana', 'Banana', 'പഴം', 'Side', [['poovan', 100]]],
  ['adapradhaman', 'Ada pradhaman', 'അട പ്രഥമൻ', 'Payasam', [['ada', 2], ['coconut', 15], ['ghee', 0.5], ['cashew', 0.3], ['raisins', 0.2], ['cardamom', 0.05], ['dryginger', 0.02]]],
  ['palpayasam', 'Palada payasam', 'പാലട പായസം', 'Payasam', [['milk', 20], ['ada', 1.5], ['ghee', 0.2], ['cashew', 0.2], ['cardamom', 0.03]]],
  ['leafserve', 'Naakila serving', 'ഇല', 'Serving & Kitchen', [['leaf', 110]]],
  ['water', 'Drinking water', 'കുടിവെള്ളം', 'Serving & Kitchen', [['paperglass150', 120], ['dahashamani', 0.05]]],
  ['kitchengas', 'Kitchen gas', 'ഗ്യാസ്', 'Serving & Kitchen', [['gas', 1]]],
];

const MENUS = [
  ['sadhya', 'Sadhya (Full)', 350, ['rice', 'parippu', 'sambar', 'avial', 'thoran', 'olan', 'kaalan', 'pachadi', 'kichadi', 'erissery', 'rasam', 'moru', 'injicurry', 'limepickle', 'mangopickle', 'pappadam', 'chips', 'sharkara', 'banana', 'adapradhaman', 'palpayasam', 'leafserve', 'water', 'kitchengas']],
  ['minisadhya', 'Sadhya (Mini)', 250, ['rice', 'parippu', 'sambar', 'avial', 'thoran', 'kaalan', 'pachadi', 'moru', 'injicurry', 'limepickle', 'pappadam', 'chips', 'banana', 'adapradhaman', 'leafserve', 'water', 'kitchengas']],
];

export function seedRecords() {
  const now = Date.now();
  const out = [];
  let sort = 0;
  for (const [group, list] of [['Grocery', GROCERY], ['Vegetables', VEGETABLES], ['Miscellaneous', MISC], ['Vessels', VESSELS]]) {
    for (const [id, name, ml, unit, rate] of list) out.push({ coll: 'items', id, data: { id, name, ml, unit, group, rate, sort: sort++, createdAt: now } });
  }
  DISHES.forEach(([id, name, ml, cat, recipe]) => out.push({ coll: 'dishes', id, data: { id, name, ml, cat, recipe: recipe.map(([item, q]) => ({ item, q })), createdAt: now } }));
  MENUS.forEach(([id, name, rate, dishIds], i) => out.push({ coll: 'menus', id, data: { id, name, rate, dishIds, sort: i, createdAt: now } }));
  return out;
}

// ---------------------------------------------------------------------------
// Demo: two orders with people, ticks, bills (with photos) and advances, so a new
// user sees every screen working. Every demo record has demo: true and can be
// removed from Settings → Remove demo order.
// ---------------------------------------------------------------------------
const DAY = 864e5;
const ymd = (ms) => { const d = new Date(ms); const z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };

export const DEMO_PHOTOS = ['demo-bill-veg.jpg', 'demo-bill-grocery.jpg', 'demo-bill-misc.jpg'];

export function demoRecords(now = Date.now()) {
  const items = Object.fromEntries(seedRecords().filter((r) => r.coll === 'items').map((r) => [r.id, r.data]));
  const dishes = Object.fromEntries(DISHES.map(([id, , , , recipe]) => [id, recipe]));
  const menus = Object.fromEntries(MENUS.map(([id, name, rate, dishIds]) => [id, { name, rate, dishIds }]));
  const out = [];
  const add = (coll, data) => { out.push({ coll, id: data.id, data: { ...data, demo: true, createdAt: data.createdAt || now, updatedAt: now } }); };

  const P = { unni: 'demo-unni', suresh: 'demo-suresh', prakash: 'demo-prakash' };
  add('people', { id: P.unni, name: 'Unni', phone: '', active: true });
  add('people', { id: P.suresh, name: 'Suresh', phone: '', active: true });
  add('people', { id: P.prakash, name: 'Prakash', phone: '', active: true });
  const byGroup = { Vegetables: P.unni, Grocery: P.suresh, Miscellaneous: P.prakash, Vessels: P.prakash };
  const itemsOf = (menuId) => [...new Set(menus[menuId].dishIds.flatMap((d) => dishes[d].map(([i]) => i)))]
    .sort((a, b) => items[a].sort - items[b].sort);

  // 1) Coming up: Full Sadhya, buying half done.
  const o1 = 'demo-order-wedding';
  const d1 = now + 4 * DAY;
  add('orders', {
    id: o1, client: 'DEMO – Krishnan family wedding', phone: '9400000000', date: ymd(d1), time: '11:30',
    venue: 'Community Hall, Kadampuzha', menuId: 'sadhya', menuName: menus.sadhya.name, plates: 600,
    dishIds: menus.sadhya.dishIds, rate: 320, amount: '', advance: 60000,
    notes: 'This is a demo order to show how the app works. Remove it from Settings when you start.',
  });
  const left1 = new Set(['coriander', 'curryleaves', 'leaf', 'cashew', 'raisins', 'cardamom', 'dahashamani', 'paperglass150', 'pappadambig', 'pappadamsmall', 'gas']);
  itemsOf('sadhya').forEach((itemId, i) => {
    const g = items[itemId].group;
    const person = byGroup[g];
    const bought = !left1.has(itemId);
    add('lines', {
      id: `${o1}__${itemId}`, orderId: o1, itemId, person, bought,
      boughtBy: bought ? person : '', boughtAt: bought ? now - (30 - (i % 24)) * 3600e3 : null,
      ...(itemId === 'rice' ? { qty: 75, note: 'Extra rice for the evening' } : {}),
      ...(itemId === 'coconut' ? { note: 'From Kadampuzha market' } : {}),
    });
  });
  // Vessels added by hand
  [['kathan75', 1], ['charakku200', 2], ['uruli40', 2], ['vatta30', 3], ['steelbucket', 6], ['glasspayasam', 650]].forEach(([itemId, qty], i) => {
    add('lines', { id: `${o1}__${itemId}`, orderId: o1, itemId, person: P.prakash, extra: true, qty, bought: i < 3, boughtBy: i < 3 ? P.prakash : '', boughtAt: i < 3 ? now - 5 * 3600e3 : null });
  });
  add('bills', { id: 'demo-bill-1', orderId: o1, person: P.unni, amount: 18450, shop: 'Vegetable market, Kottakkal', mode: 'paid', photos: ['demo-bill-veg.jpg'], date: ymd(now - DAY), createdAt: now - 26 * 3600e3, note: '' });
  add('bills', { id: 'demo-bill-2', orderId: o1, person: P.suresh, amount: 32800, shop: 'Wholesale grocery, Valanchery', mode: 'credit', shopPaid: false, photos: ['demo-bill-grocery.jpg'], date: ymd(now - DAY), createdAt: now - 24 * 3600e3, note: 'Pay after the function' });
  add('bills', { id: 'demo-bill-3', orderId: o1, person: P.prakash, amount: 15600, shop: 'Milma booth & coconut shop', mode: 'paid', photos: ['demo-bill-misc.jpg'], date: ymd(now), createdAt: now - 6 * 3600e3, note: '' });
  add('bills', { id: 'demo-bill-4', orderId: o1, person: P.unni, amount: 2350, shop: 'Banana seller', mode: 'paid', photos: [], date: ymd(now), createdAt: now - 3 * 3600e3, note: 'Bill not given' });
  add('payments', { id: 'demo-pay-1', orderId: o1, person: P.unni, amount: 15000, kind: 'advance', note: 'Advance for vegetables', date: ymd(now - 2 * DAY), createdAt: now - 48 * 3600e3 });
  add('payments', { id: 'demo-pay-2', orderId: o1, person: P.prakash, amount: 10000, kind: 'advance', note: 'Advance for milk and coconut', date: ymd(now - 2 * DAY), createdAt: now - 47 * 3600e3 });
  add('payments', { id: 'demo-pay-3', orderId: o1, person: P.suresh, amount: 5000, kind: 'advance', note: 'Advance', date: ymd(now - 2 * DAY), createdAt: now - 46 * 3600e3 });

  // 2) Finished: Mini Sadhya, everything bought, all settled.
  const o2 = 'demo-order-housewarming';
  const d2 = now - 9 * DAY;
  add('orders', {
    id: o2, client: 'DEMO – Lakshmi Nivas housewarming', phone: '', date: ymd(d2), time: '12:00',
    venue: 'Marakkara', menuId: 'minisadhya', menuName: menus.minisadhya.name, plates: 250,
    dishIds: menus.minisadhya.dishIds, rate: 260, amount: '', advance: 65000, notes: '', createdAt: d2 - 6 * DAY,
  });
  itemsOf('minisadhya').forEach((itemId) => {
    const person = byGroup[items[itemId].group];
    add('lines', { id: `${o2}__${itemId}`, orderId: o2, itemId, person, bought: true, boughtBy: person, boughtAt: d2 - DAY });
  });
  [[P.unni, 7900, 'Vegetable market, Kottakkal'], [P.suresh, 13200, 'Wholesale grocery, Valanchery'], [P.prakash, 6400, 'Milma booth & coconut shop']].forEach(([person, amount, shop], i) => {
    add('bills', { id: `demo-bill-hw-${i}`, orderId: o2, person, amount, shop, mode: 'paid', photos: [], date: ymd(d2 - DAY), createdAt: d2 - DAY, note: '' });
    add('payments', { id: `demo-pay-hw-${i}`, orderId: o2, person, amount, kind: 'settle', note: 'Settled', date: ymd(d2 + DAY), createdAt: d2 + DAY });
  });
  return out;
}

export function copyDemoPhotos(root, uploads) {
  for (const name of DEMO_PHOTOS) {
    const src = path.join(root, 'demo', name);
    const dst = path.join(uploads, name);
    if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
  }
}
