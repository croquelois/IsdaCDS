var should = require('should');
var moment = require("moment");
var assert = require("assert");
var main = require("../main.js");
var DateUtil = main.DateUtil;
var Curve = main.Curve;

var today = moment.utc("2008-09-18");

describe("Curve",function(){
  describe("addPoint",function(){
    it("should add a point when I use addPoint",function(){
      var curve = new Curve(today);
      curve.addPoint(moment.utc("2009-09-18"),0.05);
      curve.dates.length.should.eql(1);      
    });
    it("should add throw an exception when adding a point before reference date",function(){
      var curve = new Curve(today);
      (function(){
        curve.addPoint(moment.utc("2007-09-18"),0.05);
      }).should.throw(); 
    });
  });
  describe("getDates",function(){
    it("should return 0 dates after construction",function(){
      var curve = new Curve(today);
      curve.getDates().length.should.eql(0);
    });
    it("should return 5 dates when I insert 5 dates",function(){
      var curve = new Curve(today);
      curve.addPoint(moment.utc("2009-09-18"),0.05);
      curve.addPoint(moment.utc("2010-09-18"),0.05);
      curve.addPoint(moment.utc("2011-09-18"),0.05);
      curve.addPoint(moment.utc("2012-09-18"),0.05);
      curve.addPoint(moment.utc("2013-09-18"),0.05);
      curve.getDates().length.should.eql(5);
    });
  });
  describe("getZCFwd",function(){
    it("should return exp(-1*0.05) when ask a forward ZC with 1Y of gap between effective date and maturity",function(){
      var curve = new Curve(today);
      curve.addPoint(moment.utc("2009-09-18"),0.05);
      curve.getZCFwd(moment.utc("2010-09-18"),moment.utc("2011-09-18")).should.eql(Math.exp(-1*0.05));
    });
    it("should return 1 when ask a forward ZC in the past",function(){
      var curve = new Curve(today);
      curve.addPoint(moment.utc("2009-09-18"),0.05);
      curve.getZCFwd(moment.utc("2006-09-18"),moment.utc("2007-09-18")).should.eql(1);
    });
    it("should return the same than getZC when effective date in the past",function(){
      var curve = new Curve(today);
      curve.addPoint(moment.utc("2009-09-18"),0.05);
      curve.getZCFwd(moment.utc("2006-09-18"),moment.utc("2011-09-18")).should.eql(curve.getZC(moment.utc("2011-09-18")));
    });
  });
  describe("getZC",function(){
    it("should return exp(-1*0.05) when put a maturity date of 1Y",function(){
      var curve = new Curve(today);
      curve.addPoint(moment.utc("2009-09-18"),0.05);
      curve.getZC(moment.utc("2009-09-18")).should.eql(Math.exp(-1*0.05));
    });
    it("should return 1 when put a maturity in the past",function(){
      var curve = new Curve(today);
      curve.addPoint(moment.utc("2009-09-18"),0.05);
      curve.getZC(moment.utc("2007-09-18")).should.eql(1);
    });
  });
});
