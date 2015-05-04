var should = require('should');
var moment = require("moment");
var assert = require("assert");
var main = require("../main.js");
var DateUtil = main.DateUtil;
var Curve = main.Curve;
moment.fn.inspect = function() { return this.format("YYYY-MM-DD"); }

var today = moment.utc("2008-09-18");
var yc = new Curve(today);
yc.addPoint("2010-09-20",0.000);
yc.addPoint("2011-09-20",0.000);
yc.addPoint("2012-09-20",0.000);
var effDate = moment.utc("2007-06-20");
var matDateMinus5Y = moment.utc("2002-06-20");
var matDate5Y = moment.utc("2013-06-20");
var matDate10Y = moment.utc("2018-06-20");
var matDate15Y = moment.utc("2023-06-20");
var stepinDate = moment(today).add(1,"days");
var cdsCurve = main.bootstrap(today, yc, effDate, stepinDate, today, [{maturity:matDate5Y,spread:150/10000},{maturity:matDate10Y,spread:200/10000}], 0.4, "All", "3M", "ACT/360", "F/L", "F", null);

describe("Main",function(){
  describe("price",function(){
  
  });
  describe("parSpreads",function(){
    it("should return an array of spread nearly equal to what we have calibrated",function(){
      var s = main.parSpreads(today, stepinDate, effDate, [matDateMinus5Y,matDate5Y,matDate10Y,matDate15Y], "All", "3M", "F/L", "ACT/360", "F", null, yc, cdsCurve, 0.4);
      s.length.should.be.equal(4);
      should(s[0]).be.equal(null);
      s[1].should.be.approximately(0.015,0.001);
      s[2].should.be.approximately(0.020,0.001);
      s[3].should.be.approximately(0.020,0.001);
    });
  });
  describe("feeLegFlows",function(){
    var flows = main.feeLegFlows(effDate, matDate5Y, "3M", "F/L", 1, 0.05, "ACT/360", "F", null);
    console.log(flows);
  });
  describe("upfrontCharge",function(){
    it("should return ~0 when the quoted spread is equal to the coupon",function(){
      var coupon = 500;
      var quotedSpread = 500;
      var uf = main.upfrontCharge(today, today, effDate, moment(today).add(1,"days"), effDate, matDate5Y, coupon/10000, "All", "3M", "F/L", "ACT/360", "F", null, yc, quotedSpread/10000,0.4,true);
      uf.should.approximately(0.0,1e-15);
    });
    
    it("should return ~0.019489 when the quoted spread 550, and the coupon is 500 (From XL file of JPM)",function(){
      var coupon = 500;
      var quotedSpread = 550;
      var uf = main.upfrontCharge(today, DateUtil.moveBusinessDay(today,3), effDate, moment(today).add(1,"days"), effDate, matDate5Y, coupon/10000, "All", "3M", "F/L", "ACT/360", "F", null, yc, quotedSpread/10000,0.4,true);
      uf.should.approximately(0.019489,1.00001);
    });
    
    it("should return 0 when coupon is 0 and quoted spread is 0",function(){
      var coupon = 0;
      var quotedSpread = 0;
      var uf = main.upfrontCharge(today, DateUtil.moveBusinessDay(today,3), effDate, moment(today).add(1,"days"), effDate, matDate5Y, coupon/10000, "All", "3M", "F/L", "ACT/360", "F", null, yc, quotedSpread/10000,0.4,true);
      uf.should.approximately(0.0,1e-15);
    });
    
    it("should return 0 if endDate < today");
    it("should throw an exception if curve null");
    it("should throw an exception if startDate > endDate");
    it("should throw an exception if today > stepinDate");
  });
  describe("oneSpread",function(){
    it("should be able to invert upfrontCharge",function(){
      var coupon = 500;
      var quotedSpread = 550;
      var uf = main.upfrontCharge(today, DateUtil.moveBusinessDay(today,3), effDate, moment(today).add(1,"days"), effDate, matDate5Y, coupon/10000, "All", "3M", "F/L", "ACT/360", "F", null, yc, quotedSpread/10000,0.4,true);
      var spd = main.oneSpread(today, DateUtil.moveBusinessDay(today,3), effDate, moment(today).add(1,"days"), effDate, matDate5Y, coupon/10000, "All", "3M", "F/L", "ACT/360", "F", null, yc, uf, 0.4,true);
      spd.should.be.approximately(quotedSpread/10000,0.0000001);
    });
  });
});