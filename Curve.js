"use strict";
var moment = require("moment");

function foundLowerBound(set,key,start,end){
  if(set.length == 0) return -1;
  if(start === undefined) start = 0;
  if(end === undefined) end = set.length-1;
  if(!(start-end)) return (start==0&&set[0]>key?-1:start);
  var mid = Math.ceil((end+start)/2);
  if(set[mid] < key) return foundLowerBound(set,key,mid,end);
  if(set[mid] > key) return foundLowerBound(set,key,start,mid-1);
  return mid;
}
function linint(term,x,t){
  var idx = foundLowerBound(term,t);
  if(idx == -1) return x[0];
  if(idx == term.length-1) return x[idx];
  return x[idx] + (x[idx+1] - x[idx])*(t - term[idx])/(term[idx+1] - term[idx]);
}

function Curve(today,dates,values){
  this.today = (today instanceof Date?today:moment.utc(today).toDate());
  this.dates = dates || [];
  this.values = values || [];
}

module.exports = Curve;

Curve.prototype.addPoint = function(date,value){
  var date = (date instanceof Date?date:moment.utc(date).toDate());
  if(date < this.today) throw new Exception("cannot add a point before reference date of the curve");
  this.dates.push(date);
  this.values.push(value);
}

Curve.prototype.getDates = function(){ return this.dates.map(function(date){ return moment.utc(date); }); };

Curve.prototype.getZCFwd = function(start,end){
  return this.getZC(end)/this.getZC(start);
}

Curve.prototype.getZC = function(date){
  var date = (date instanceof Date?date:date.toDate());
  if(date < this.today) return 1;//throw new Error("Try to get the zeroCoupon for a past date");
  var r = linint(this.dates,this.values,date);
  var t = (date-this.today)/31536000000;
  return Math.exp(-r*t);
}