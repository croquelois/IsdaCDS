"use strict";
var moment = require("moment");
var FeeLeg = require("./FeeLeg.js");
var ContingentLeg = require("./ContingentLeg.js");
var Curve = require("./Curve.js");
var DateUtil = require("./DateUtil.js");
var Brent = require("rootFinder").Brent;
var rootFinder = new Brent();
moment.fn.inspect = function() { return this.format("YYYY-MM-DD"); }

function bootstrap(today,  yc, startDate, stepinDate, settleDate, cds, recoveryRate, accrualPayConv, freq, dcc, stubType, badDayConv, calendar){
  accrualPayConv = accrualPayConv || "All"; // "All"|"None"
  freq = freq || "3M";
  dcc = dcc || "ACT/360";
  stubType = stubType || {stubAtEnd:false,longStub:false};
  badDayConv = badDayConv || "MF";
  var cdsCurve = new Curve(today);
  cds.forEach(function(cds){ cdsCurve.addPoint(cds.maturity,cds.spread); });    
  cds.forEach(function(cds,i){ 
    var guess = cds.spread/(1-recoveryRate);
    var cl = new ContingentLeg(today>startDate?today:startDate, cds.maturity, 1, "PayAtDefault", true);
    var fl = new FeeLeg(startDate, cds.maturity, freq, stubType, badDayConv, calendar, 1, cds.spread, dcc, accrualPayConv,true);
    function objFct(spread){
      cdsCurve.values[i] = spread;
      var pvC = cl.PV(today, settleDate, stepinDate, yc, cdsCurve, recoveryRate);
      var pvF = fl.PV(today, stepinDate, settleDate, yc, cdsCurve, true);
      return (pvC - pvF);
    }
    var spread = rootFinder.getRoot(objFct,0,1e10);
    cdsCurve.values[i] = spread;
  });
  return cdsCurve;
}  

function price(today, settleDate, stepinDate, startDate, endDate, couponRate, accrualPayConv, freq, stubType, dcc, badDayConv, calendar, yldCurve, cdsCurve, recoveryRate, isPriceClean){
  var maxStartDate = (stepinDate>startDate?stepinDate:startDate);
  if(maxStartDate > endDate) return 0;
  var fl = new FeeLeg(startDate, endDate, freq, stubType, badDayConv, calendar, 1, couponRate, dcc, accrualPayConv, true);
  var pvF = fl.PV(today, stepinDate, settleDate, yldCurve, cdsCurve, isPriceClean);
  var cl = new ContingentLeg(maxStartDate, endDate, 1, "PayAtDefault", true);
  var pvC = cl.PV(today, settleDate, maxStartDate, yldCurve, cdsCurve, recoveryRate);
  return pvC-pvF;
}

function parSpreads(today, stepinDate, startDate, endDates, accrualPayConv, freq, stubType, dcc, badDayConv, calendar, yldCurve, cdsCurve, recoveryRate){
  return endDates.map(function(endDate){
    if(startDate > endDate) return null;
    var fl = new FeeLeg(startDate, endDate, freq, stubType, badDayConv, calendar, 1, 1, dcc, accrualPayConv, true);
    var pvF = fl.PV(today, stepinDate, stepinDate, yldCurve, cdsCurve, true);
    var maxStartDate = (stepinDate>startDate?stepinDate:startDate);
    var cl = new ContingentLeg(maxStartDate, endDate, 1, "PayAtDefault", true);
    var pvC = cl.PV(today, stepinDate, maxStartDate, yldCurve, cdsCurve, recoveryRate);
    return pvC/pvF;
  });
}

function feeLegFlows(startDate, endDate, freq, stubType, notional, couponRate, dcc, badDayConv, calendar){
  var fl = new FeeLeg(startDate, endDate, freq, stubType, badDayConv, calendar, notional, couponRate, dcc, "All");
  return fl.flows();
}

function upfrontCharge(today, valueDate, benchmarkStartDate, stepinDate, startDate, endDate, couponRate, accrualPayConv, interval, stubType, dcc, badDayConv, calendar, yc, oneSpread, recoveryRate, payAccruedAtStart){
  var cdsCurve = bootstrap(today, yc, benchmarkStartDate, stepinDate, valueDate,[{maturity:endDate,spread:oneSpread}],recoveryRate, accrualPayConv, interval, dcc, stubType, badDayConv, calendar);
  return price(today, valueDate, stepinDate, startDate, endDate, couponRate, accrualPayConv, interval, stubType, dcc, badDayConv, calendar, yc, cdsCurve, recoveryRate, payAccruedAtStart);
}

function oneSpread(today, valueDate, benchmarkStartDate, stepinDate, startDate, endDate, couponRate, accrualPayConv, interval, stubType, dcc, badDayConv, calendar, yc, upfront, recoveryRate, payAccruedAtStart){
  function objFct(oneSpread){
    var pv = upfrontCharge(today, valueDate, benchmarkStartDate, stepinDate, startDate, endDate, couponRate, accrualPayConv, interval, stubType, dcc, badDayConv, calendar, yc, oneSpread, recoveryRate, payAccruedAtStart);
    return pv - upfront;
  }
  return rootFinder.getRoot(objFct,0,100);
}

exports.price = price;
exports.parSpreads = parSpreads;
exports.feeLegFlows = feeLegFlows;
exports.upfrontCharge = upfrontCharge;
exports.oneSpread = oneSpread;
exports.bootstrap = bootstrap;
exports.Curve = Curve;
exports.DateUtil = DateUtil;