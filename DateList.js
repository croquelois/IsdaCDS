"use strict";
var moment = require("moment");
var DateUtil = require("./DateUtil.js");

function cmpDate(date1, date2){ return date1-date2; }
function removeDoublon(arr){
  if(arr.length == 0) return [];
  var last = arr[0];
  var ret = [last];
  for(var i=1;i<arr.length;i++)
    if(arr[i]-last){
      last = arr[i];
      ret.push(last);
    }
  return ret;
}

function addDates(){
  var dl = [].concat.apply([], arguments);
  return removeDoublon(dl.sort(cmpDate));
}

function truncate(dateList, truncationDate, inclusive, excludeBefore){
  if(excludeBefore){
    var truncatePt = 0;
    for(var i = 0; i < dateList.length; i++){
      if(dateList[i] > truncationDate){
        truncatePt = i;
        break;
      }
      if (inclusive && !(dateList[i]-truncationDate)){
        truncatePt = i;
        break;
      }
    }
    return dateList.slice(truncatePt);
  }else{
    truncatePt = dateList.length - 1;
    for(var i = dateList.length - 1; i > 0; i--){
      if(dateList[i] < truncationDate){
        truncatePt = i;
        break;
      }
      if (inclusive && !(dateList[i]-truncationDate)){
        truncatePt = i;
        break;
      }
    }
    return dateList.slice(0,truncatePt+1);
  }
}

function stringToStub(str){
  if(!/^(F|B)(\/(L|S))?$/.test(str)) throw new Error("Stub format is incorrect: '"+str+"' syntax is (F|B)[/(L|S)]");
  var tmp = str.split("/");
  return {stubAtEnd:(tmp[0]=="B"),longStub:tmp[1]&&tmp[1]=="L"};
}

function makeRegular(startDate, endDate, interval, stubType){
  var dates = []
  var numIntervals = 0;
  if(typeof stubType == "string") stubType = stringToStub(stubType);
  if(!stubType.stubAtEnd){
    var date = moment(endDate);
    while(date > startDate){
      dates.push(date);
      numIntervals--;
      date = DateUtil.move(endDate, numIntervals, interval);
    }
    if(!(date-startDate) || dates.length == 1 || !stubType.longStub)
      dates.push(date);
  }else{
    var date = moment(startDate);
    while(date < endDate){
      dates.push(date);
      numIntervals++;
      date = DateUtil.move(startDate, numIntervals, interval);
    }
    if(!(date-endDate) || dates.length == 1 || (stubType.stubAtEnd && !stubType.longStub))
      dates.push(date);
  }
  return removeDoublon(dates.sort(cmpDate));
}

exports.addDates = addDates;
exports.truncate = truncate;
exports.makeRegular = makeRegular;
