#CDS Model ISDA

JS version of the ISDA Model for CDS
Check http://www.cdsmodel.com/cdsmodel/ for the C version

##warning:

it's slow, I should not have used moment.js inside the computations intensive part...
I have make an attempt to remove it from the worst part (Curve.js) but I have still work to do on the other parts of the code
On my I7-2600 using a single core:
it take 850ms to use 'oneSpread' because there is a rootfinder of a rootfinder :(
it take 50ms to use 'upfrontCharge'

##additional dependency:

you need to do ```npm install``` also you need to add rootFinder module in node_modules directory (you'll found rootFinder module in my repositories)

##use:

```js
var curve = new Curve(refDate)
```

create a curve with a reference date 'refDate'
refDate: can be a 'moment.js', 'string' or 'Date' object
it will be converted to a 'Date' object internally

```js
curve.addPoint(date,rate);
```

add a point to the curve (ZC curve, or survival curve)

date: maturity of the rate
can be a 'moment.js', 'string' or 'Date' object
it will be converted to a 'Date' object internally

rate: can be a ZC rate, or a continuous hazard rate

```js
curve.getZC(date);
```

get the ZC for the specified date, interpolation is linear, extrapolation is flat
date: maturity of the ZC
can be a 'moment.js', 'string' or 'Date' object
it will be converted to a 'Date' object internally


```js
price(today, settleDate, stepinDate, startDate, endDate, couponRate, accrualPayConv, freq, stubType, dcc, badDayConv, calendar, yldCurve, cdsCurve, recoveryRate, isPriceClean)
```

return the upfront of the product

today: today date (moment.js)

settleDate: settlement date (moment.js)

stepinDate: step-in date (moment.js)

startDate: start date (moment.js)

endDate: end date (moment.js)

couponRate: coupon

accrualPayConv: "All" if accrual is paid in case of default else "None"

freq: "1M", "3M", "6M" or "1Y"

stubType: stub type is in two part first part can be "F" for Front, or "B" for Back. The second part is "S" for Short, or "L" for Long (ex: "F/L")

dcc: "ACT/360", "ACT/365", "ACT/365F", "30/360", "30E/360"

badDayConv: "F", "P" or "MF"

calendar: a function which take a date in parameter and return true if the date is an holiday, can be null

yldCurve: Yield Curve (Curve object)

cdsCurve: Survival Curve (Curve object)

recoveryRate: recovery rate

isPriceClean: boolean to specified if the price is in Clean or Dirty


```js
bootstrap(today,  yc, startDate, stepinDate, settleDate, cds, recoveryRate, accrualPayConv, freq, dcc, stubType, badDayConv, calendar)
```

return the bootstraped survival curve

today: today date (moment.js)

yc: Yield Curve (Curve object)

startDate: start date (moment.js)

stepinDate: step-in date (moment.js)

settleDate: settlement date (moment.js)

cds: an array of map {maturity:,spread:} maturity need to be a moment.js object

recoveryRate: recovery rate

accrualPayConv: "All" if accrual is paid in case of default else "None"

freq: "1M", "3M", "6M" or "1Y"

dcc: "ACT/360", "ACT/365", "ACT/365F", "30/360", "30E/360"

stubType: stub type is in two part first part can be "F" for Front, or "B" for Back. The second part is "S" for Short, or "L" for Long (ex: "F/L")

badDayConv: "F", "P" or "MF"

calendar: a function which take a date in parameter and return true if the date is an holiday, can be null

##example


```js
var today = moment.utc("2008-09-18");
var yc = new Curve(today);
yc.addPoint("2010-09-20",1.000);
yc.addPoint("2011-09-20",2.000);
yc.addPoint("2012-09-20",2.500);
var effDate = moment.utc("2007-06-20");
var matDateMinus5Y = moment.utc("2002-06-20");
var matDate5Y = moment.utc("2013-06-20");
var matDate10Y = moment.utc("2018-06-20");
var matDate15Y = moment.utc("2023-06-20");
var stepinDate = moment(today).add(1,"days");
var cdsCurve = main.bootstrap(today, yc, effDate, stepinDate, today, [{maturity:matDate5Y,spread:150/10000},{maturity:matDate10Y,spread:200/10000}], 0.4, "All", "3M", "ACT/360", "F/L", "F", null);
```
