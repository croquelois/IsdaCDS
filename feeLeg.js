"use strict";
var moment = require("moment");
var DateUtil = require("./DateUtil.js");
var DateList = require("./DateList.js");
var TimeLine = require("./TimeLine.js");

var ln = Math.log;
var exp = Math.exp;

function FeeLeg(startDate,endDate,interval,stubType,badDayConv,calendar,notional,couponRate,dcc,accrualPayConv,protectStart){
  this.accStartDates = [];
  this.accEndDates = [];
  this.payDates = [];
  this.notional = notional;
  this.couponRate = couponRate;
  this.dcc = dcc;
  this.accrualPayConv = accrualPayConv;
  
  if(startDate > endDate) throw new Error("startDate is greater than endDate");
  if(!protectStart && !(startDate-endDate)) throw new Error("startDate is equal to endDate, and start date not protected");
  var dl;
  if(protectStart && !(startDate-endDate)) dl = [startDate,endDate];
  else dl = DateList.makeRegular(startDate, endDate, interval, stubType);
  var prevDate = dl[0];
  var prevDateAdj = prevDate;

  for(var i = 0; i < dl.length-1; ++i){
    var nextDate = dl[i+1];
    var nextDateAdj;
    nextDateAdj = DateUtil.businessDay(nextDate, badDayConv, calendar);

    this.accStartDates[i] = prevDateAdj;
    this.accEndDates[i]   = nextDateAdj;
    this.payDates[i]      = nextDateAdj;

    prevDate    = nextDate;
    prevDateAdj = nextDateAdj;
  }
  this.obsStartOfDay = protectStart;
  this.accEndDates[this.accEndDates.length-1] = protectStart?moment(prevDate).add(1,"days"):prevDate;
}

module.exports = FeeLeg;
FeeLeg.clock = [0,0,0,0,0,0,0,0];

FeeLeg.prototype.PV = function(today, stepinDate, valueDate, discCurve, spreadCurve, cleanPrice){
  var  tl = [];
  var matDate = this.accEndDates[this.accEndDates.length - 1];
  if(this.obsStartOfDay) matDate = moment(matDate).add(-1,"days");               
  if(this.payDates.length > 1){
    var startDate = this.accStartDates[0];
    var endDate   = matDate;
    tl = TimeLine.risky(startDate, endDate, discCurve, spreadCurve);
  }
  if(today > matDate || stepinDate > matDate) return 0;
  var myPv = 0;
  for(var i = 0; i < this.payDates.length; ++i){
    myPv += feePaymentPVWithTimeLine(this.accrualPayConv, today, stepinDate, this.accStartDates[i], this.accEndDates[i], this.payDates[i],
                                     this.dcc, this.notional, this.couponRate, discCurve, spreadCurve, tl, this.obsStartOfDay);
  }
  if(cleanPrice) myPv -= this.accruedInterest(stepinDate);
  var df = discCurve.getZC(valueDate);
  return myPv/df;
}

function feePaymentPVWithTimeLine(accrualPayConv,today,stepinDate,accStartDate,accEndDate,payDate,accrueDCC,notional,couponRate,discCurve,spreadCurve,tl,obsStartOfDay){
  if(accEndDate <= stepinDate) return 0;
  function offset(date){
    if(!obsStartOfDay) return date;
    return moment(date).add(-1,"days");
  }
  var ycf = DateUtil.dayCountFraction(accStartDate, accEndDate, accrueDCC);
  var amount = notional * couponRate * ycf;
  var survival = spreadCurve.getZC(offset(accEndDate));
  var discount = discCurve.getZC(payDate);
  var myPv = amount * survival * discount;
  switch (accrualPayConv){
  case "None": break;
  case "All": 
    myPv += accrualOnDefaultPVWithTimeLine(today, offset(stepinDate),offset(accStartDate),offset(accEndDate), amount, discCurve, spreadCurve, tl);
    break;
  default: throw new Error("Invalid accrual payment type: " + accrualPayConv);
  }
    
  if(!isFinite(myPv)) throw new Error("Computation problem");
  return myPv;
}


function accrualOnDefaultPVWithTimeLine(today, stepinDate, startDate, endDate, amount, discCurve, spreadCurve, criticalDates){
  var myPv = 0;
  var tl = [];
  if (criticalDates) tl = TimeLine.truncate(criticalDates, startDate, endDate);
  else tl = TimeLine.risky(startDate, endDate, discCurve, spreadCurve);
  
  today = today.toDate(); 
  stepinDate = stepinDate.toDate(); 
  startDate = startDate.toDate(); 
  endDate = endDate.toDate();
  var subStartDate = (stepinDate>startDate?stepinDate:startDate);
  var t   = (endDate-startDate)/31536000000;
  var accRate = amount/t;
  var s1  = spreadCurve.getZC(subStartDate);
  var df1 = discCurve.getZC(today>subStartDate?today:subStartDate);
    
  for(var i = 1;i < tl.length;i++){
    if(tl[i] <= stepinDate) continue;
    if(s1 < 1e-10) break;
    var thisPv = 0;
    var s0  = s1;
    var df0 = df1;
    s1  = spreadCurve.getZC(tl[i]);
    df1 = discCurve.getZC(tl[i]);
    
    var t0 = (subStartDate-startDate)/31536000000 + 0.5/365;
    var t1 = (tl[i]-startDate)/31536000000 + 0.5/365;
    t  = t1-t0;
    if(s1 < 1e-10){
      myPv += accRate*t*s0*df0; //// ? /////
      break;
    }
    
    var lambda  = ln(s0) - ln(s1);
    var fwdRate = ln(df0) - ln(df1); 
    var lambdafwdRate = lambda + fwdRate + 1.0e-50;
  
    if (Math.abs(lambdafwdRate) > 1.e-4){
			thisPv  = lambda * accRate * s0 * df0 * ((t0 + t/(lambdafwdRate))/(lambdafwdRate) - (t1 + t/(lambdafwdRate))/(lambdafwdRate) * s1/s0 * df1/df0);
    }else{
      var lambdaAccRate = lambda * s0 * df0 * accRate * 0.5;
      var thisPv1 = lambdaAccRate * (t0 + t1);
			var lambdaAccRateLamdaFwdRate = lambdaAccRate * lambdafwdRate / 3;
			var thisPv2 = -lambdaAccRateLamdaFwdRate * (t0 + 2 * t1);
			var lambdaAccRateLamdaFwdRate2 = lambdaAccRateLamdaFwdRate * lambdafwdRate * .25;
			var thisPv3 = lambdaAccRateLamdaFwdRate2 * (t0 + 3 * t1);
			var lambdaAccRateLamdaFwdRate3 = lambdaAccRateLamdaFwdRate2 * lambdafwdRate * .2;
			var thisPv4 = -lambdaAccRateLamdaFwdRate3 * (t0 + 4 * t1);
			var lambdaAccRateLamdaFwdRate4 = lambdaAccRateLamdaFwdRate3 * lambdafwdRate / 6;
			var thisPv5 = lambdaAccRateLamdaFwdRate4 * (t0 + 5 * t1);
      thisPv += thisPv1;
      thisPv += thisPv2;
      thisPv += thisPv3;
      thisPv += thisPv4;
      thisPv += thisPv5;
    }
    myPv += thisPv;
    subStartDate = tl[i];
    //console.log(lambdafwdRate,lambda,fwdRate,s0,df0);
    //if(!isFinite(myPv)) throw new Error("Computation problem");
  }
  if(!isFinite(myPv)) throw new Error("Computation problem");
  return myPv;
}

FeeLeg.prototype.flows = function(){
  var cf = [];
  for(var i = 0; i < this.payDates.length; ++i){
    var ycf = DateUtil.dayCountFraction(this.accStartDates[i], this.accEndDates[i], this.dcc);
    cf.push({date:this.payDates[i],amount:ycf*this.couponRate*this.notional});
  }
  return cf;
}

function foundLowerBound(set,key,start,end){
  if(set.length == 0) return -1;
  if(start === undefined) start = 0;
  if(end === undefined) end = set.length-1;
  if(start == end) return (start==0&&set[0]>key?-1:start);
  var mid = Math.ceil((end+start)/2);
  if(set[mid] < key) return foundLowerBound(set,key,mid,end);
  if(set[mid] > key) return foundLowerBound(set,key,start,mid-1);
  return mid;
}

FeeLeg.prototype.accruedInterest = function(today){
  if(today <= this.accStartDates[0] || today >= this.accEndDates[this.accEndDates.length-1]) return 0;
  var lo = foundLowerBound(this.accStartDates,today);
  var ycf = DateUtil.dayCountFraction(this.accStartDates[lo], today, this.dcc);
  return ycf * this.couponRate * this.notional;
}


