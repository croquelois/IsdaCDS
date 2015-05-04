"use strict";
var moment = require("moment");
var TimeLine = require("./TimeLine.js");

var ln = Math.log;
var exp = Math.exp;

function ContingentLeg(startDate,endDate,notional,payType,protectStart){
  this.startDate = protectStart?moment(startDate).add(-1,"days"):startDate;
  this.endDate = endDate;
  this.notional = notional;
  this.payType = payType;
  this.protectStart = protectStart;
}

module.exports = ContingentLeg;

ContingentLeg.prototype.PV = function(today, valueDate, stepInDate, discountCurve, spreadCurve, recoveryRate){
  //console.log(this,today, valueDate, stepInDate, discountCurve, spreadCurve, recoveryRate)
  var startDate = this.startDate;
  if(this.protectStart){
    var offToday = moment(today).add(-1,"days");
    if(startDate<offToday) startDate = offToday;
    var offStepInDate = moment(stepInDate).add(-1,"days");
    if(startDate<offStepInDate) startDate = offStepInDate;
  }else{
    if(startDate<today) startDate = today;
    if(startDate<stepInDate) startDate = stepInDate;
  }
  var df = discountCurve.getZC(valueDate);
  switch (this.payType){
    case "PayAtMaturity":
      return this.notional * onePeriodIntegralAtPayDate(today, startDate, this.endDate, this.endDate, discountCurve, spreadCurve, recoveryRate)/df;
    case "PayAtDefault":
      return this.notional * onePeriodIntegral(today, startDate, this.endDate, discountCurve, spreadCurve, recoveryRate)/df;
    default: 
      throw new Error("Invalid payment type: " + this.payType);
  }
}

function onePeriodIntegral(today, startDate, endDate, discCurve, spreadCurve, recoveryRate){
  if(today > endDate) return 0;
  //console.log(today, startDate, endDate);
  var myPv = 0;
  var tl = TimeLine.risky(startDate, endDate, discCurve, spreadCurve);
  var s1  = spreadCurve.getZC(startDate);
  var df1 = discCurve.getZC(today>startDate?today:startDate);
  var loss = 1 - recoveryRate;

  for(var i = 1;i < tl.length;i++){
    if(s1 < 1e-10) break;
    var thisPv = 0;
    var s0  = s1;
    var df0 = df1;
    s1  = spreadCurve.getZC(tl[i]);
    if(s1 < 1e-10) return myPv + loss*s0*df0;
    df1 = discCurve.getZC(tl[i]);
    var t = tl[i].diff(tl[i-1],"days")/365;
    var lambda  = ln(s0) - ln(s1);
    var fwdRate = ln(df0) - ln(df1); 
    var lambdafwdRate = lambda + fwdRate + 1.0e-50;
    if (Math.abs(lambdafwdRate) > 1.e-4){
      thisPv = loss * lambda / lambdafwdRate * (1 - exp(-lambdafwdRate)) * s0 * df0;
    }else{
      var thisPv0 = loss * lambda * s0 * df0;
      var thisPv1 = -thisPv0 * lambdafwdRate * .5;
      var thisPv2 = -thisPv1 * lambdafwdRate / 3;
      var thisPv3 = -thisPv2 * lambdafwdRate * .25;
      var thisPv4 = -thisPv3 * lambdafwdRate * .2;
      thisPv += thisPv0;
      thisPv += thisPv1;
      thisPv += thisPv2;
      thisPv += thisPv3;
      thisPv += thisPv4;
    }
    //console.log(i,thisPv,lambdafwdRate,lambda,s0,df0);
    myPv += thisPv;
  }
  if(!isFinite(myPv)) throw new Error("Computation problem");
  return myPv;
}


function onePeriodIntegralAtPayDate(today, startDate, endDate, payDate, yc, cdsCurve, recoveryRate){
  if(today > endDate) return 0;
  var s0  = cdsCurve.getZC(startDate);
  var s1  = cdsCurve.getZC(endDate);
  var df  = yc.getZC(payDate);
  var loss = 1.0 - recoveryRate;
  return (s0 - s1) * df * loss;
}
