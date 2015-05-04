"use strict";
var moment = require("moment");
var freqMap = 
  {
    "Y": {nb:1,unit:"years"},
    "Q": {nb:3,unit:"months"},
    "6M": {nb:6,unit:"months"},
    "3M": {nb:3,unit:"months"},
    "1M": {nb:1,unit:"months"},
    "M": {nb:1,unit:"months"},
    "W": {nb:1,unit:"weeks"},
    "D": {nb:1,unit:"days"},
  };
  
function move(date,nb,freq){
  var tmp = freqMap[freq];
  return moment(date).add(nb*tmp.nb,tmp.unit);
}

function isBusinessDay(date,calendar){
  var d = date.isoWeekday();
  if(d == 6 || d == 7) return false;
  return calendar?!calendar(date):true;
}

function moveBusinessDay(date,nb,calendar){
  date = moment(date);
  while(nb){
    date.add(nb>0?1:-1,"days");
    if(!isBusinessDay(date,calendar)) continue;
    nb += (nb>0?-1:1);
  }
  return date;
}

function businessDay(date, badDayConv, calendar){
  if(badDayConv == "NONE" || isBusinessDay(date,calendar)) return date;
  date = moment(date);
  if(badDayConv == "F"){
    while(!isBusinessDay(date,calendar)) date.add(1,"days");
    return date;
  }
  if(badDayConv == "MF"){
    var start = moment(date);
    while(!isBusinessDay(date,calendar)) date.add(1,"days");
    if(start.month() == date.month()) return date;
    date = start;
    while(!isBusinessDay(date,calendar)) date.add(-1,"days");
    return date;    
  }
  if(badDayConv == "P"){
    while(!isBusinessDay(date,calendar)) date.add(-1,"days");
    return date;
  }
  throw new Error("Convention for non business day, not recognized: '"+badDayConv+"'");
}

function daysDiff(startDate, endDate, method){
  var sign = 1;
  if(endDate < startDate){
    sign = -1;
    var tmp = endDate;
    endDate = startDate;
    startDate = tmp;
  }
  switch(method){
    case "B30/360":
    case "B30E/360":
      var Y1 = startDate.year();
      var M1 = startDate.month();
      var D1 = startDate.date();
      var Y2 = endDate.year();
      var M2 = endDate.month();
      var D2 = endDate.date();
      if(D1 == 31) D1 = 30;
      if(D2 == 31){
        if(method == "B30E/360") D2 = 30;
        else if(D1 == 30) D2 = 30;
      }
      result = (Y2-Y1)*360 + (M2-M1)*30 + (D2-D1);
      break;
    case "ACT/365":
    case "ACT/365F":
    case "ACT/360":
      var result = endDate.diff(startDate,"days");
      break;
    default: throw new Error("Invalid method: " + method);
  }
  return sign*result;
}

function daysLeftThisYear(date, method){
  return daysDiff(date, moment(date).startOf("year").add(1,"years"), method);
}

function dayCountFraction(startDate, endDate, method){
  var sign = 1;
  if(!moment.isMoment(startDate) || !startDate.isValid()) throw new Error("startDate is not a moment variable");
  if(!moment.isMoment(endDate) || !endDate.isValid()) throw new Error("endDate is not a moment variable");
  var nDays = endDate.diff(startDate,"days");
  if(method == "ACT/365F") return nDays/365;
  if(method == "ACT/360") return nDays/360;
  if(!nDays) return 0;
  if(nDays < 0){
    sign = -1;
    var tmp = endDate;
    endDate = startDate;
    startDate = tmp;
  }
  if(method == "EFFECTIVE RATE") return sign;

  var leapDays = 0;
  var nonLeapDays = 0;
  var result = 0;
  var nDays = daysDiff(startDate,endDate,method);
  switch (method){
    case "B30/360":
    case "B30E/360":
    case "ACT/360":
      result = nDays/360;
      break;
    /* handled above
    case "ACT/365F":
      result = nDays/365;
      break;*/
    case "ACT/365":
      var curDate = moment(startDate);
      var daysLeft = daysLeftThisYear(curDate,method);
      var isLeap = curDate.isLeapYear();
      if(isLeap) leapDays += Math.min(nDays,daysLeft);
      else nonLeapDays += Math.min(nDays,daysLeft);
      var startYear = startDate.year();
      var endYear = endDate.year();
      for(var y=startYear+1;y<endYear;y++){
        curDate.add(isLeap?366:365,"days");
        isLeap = curDate.isLeapYear();
        if(isLeap) leapDays += 366;
        else nonLeapDays += 365;
      }
      if (startYear != endYear){
        curDate = moment(endDate).startOf('year');
        isLeap = curDate.isLeapYear();
        daysLeft = daysDiff(curDate,endDate,method);
        if(isLeap) leapDays += daysLeft;
        else nonLeapDays += daysLeft;
      }
      result = leapDays/366 + nonLeapDays/365;
      break;
    default: throw new Error("Invalid method: " + method);
  }
  return result*sign;
}


exports.move = move;
exports.moveBusinessDay = moveBusinessDay;
exports.businessDay = businessDay;
exports.isBusinessDay = isBusinessDay;
exports.dayCountFraction = dayCountFraction;
