"use strict";
var DateList = require("./DateList.js");

function risky(startDate, endDate, discCurve, spreadCurve){
    var tl = DateList.addDates(discCurve.getDates(),spreadCurve.getDates(),[startDate,endDate]);
    tl = DateList.truncate(tl, startDate, true, true);
    tl = DateList.truncate(tl, endDate, true, false);
    return tl;
}

function truncate(criticalDates, startDate, endDate){
    var tl = criticalDates;
    tl = DateList.addDates(tl, [startDate,endDate]);
    tl = DateList.truncate(tl, startDate, true, true);
    tl = DateList.truncate(tl, endDate, true, false);
    return tl;
}

exports.risky = risky;
exports.truncate = truncate;
