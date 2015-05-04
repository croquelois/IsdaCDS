var moment = require("moment");
var assert = require("assert");
var should = require("should");
var main = require("../main.js");
var DateUtil = main.DateUtil;
moment.fn.inspect = function() { return this.format("YYYY-MM-DD"); }

var today = moment.utc("2008-09-18");
var futDate1M = moment.utc("2008-10-18");
var futDate = moment.utc("2009-09-18");
var futDate8Y = moment.utc("2016-09-18");
function isHoliday(date){ return date.date() == 15; } // Holiday the 15 of each month

describe("DateUtil",function(){
  describe("move",function(){
    it("should return a date 1Y after, when moving 1Y");
    it("should return a date 6M after, when moving Q");
    it("should return a date 6M after, when moving 6M");
    it("should return a date 3M after, when moving 3M");
    it("should return a date 1M after, when moving 1M");
    it("should return a date 1M after, when moving M");
    it("should return a date 1W after, when moving W");
    it("should return a date 1D after, when moving D");
  });
  describe("moveBusinessDay",function(){
    it("should return 3D after when moving before week end",function(){
      (DateUtil.moveBusinessDay(moment.utc("2015-04-25"),1)-moment.utc("2015-04-27")).should.be.equal(0);
    });
    it("should return 1D after when moving in the middle of the week",function(){
      (DateUtil.moveBusinessDay(moment.utc("2015-04-23"),1)-moment.utc("2015-04-24")).should.be.equal(0);
    });
    it("should return 1D before when moving backward in the middle of the week",function(){
      (DateUtil.moveBusinessDay(moment.utc("2015-04-24"),-1)-moment.utc("2015-04-23")).should.be.equal(0);
    });
  });
  describe("businessDay",function(){
    it("should not move if already business day",function(){
      (DateUtil.businessDay(moment.utc("2015-04-24"),"F")-moment.utc("2015-04-24")).should.be.equal(0);
    });
    it("should move after if mode is Following",function(){
      (DateUtil.businessDay(moment.utc("2015-02-28"),"F")-moment.utc("2015-03-02")).should.be.equal(0);
    });
    it("should move before if mode is Previous",function(){
      (DateUtil.businessDay(moment.utc("2015-02-28"),"P")-moment.utc("2015-02-27")).should.be.equal(0);
    });
    it("should move before if mode is Modified Following and at EOM",function(){
      (DateUtil.businessDay(moment.utc("2015-02-28"),"MF")-moment.utc("2015-02-27")).should.be.equal(0);
    });
    it("should move after if mode is Modified Following and not at EOM",function(){
      (DateUtil.businessDay(moment.utc("2015-04-18"),"MF")-moment.utc("2015-04-20")).should.be.equal(0);
    });
    it("should throw an error when the convention is not identified",function(){
      (function(){
        DateUtil.businessDay(moment.utc("2015-04-18"),"NotAConvention");
      }).should.throw();
    });
  });
  describe("isBusinessDay",function(){
    it("should be true during week", function(){
      DateUtil.isBusinessDay(moment.utc("2015-04-22")).should.be.true;
    });
    it("should be false during weekend", function(){
      DateUtil.isBusinessDay(moment.utc("2015-04-26")).should.not.be.true;
    });
    it("should be false during holiday", function(){
      DateUtil.isBusinessDay(moment.utc("2015-04-15"),isHoliday).should.not.be.true;
    });
  });
  describe("dayCountFraction",function(){
    describe("B30/360 and B30E/360",function(){
      it("should return 1.00278 when B30/360",function(){
        DateUtil.dayCountFraction(today,futDate,"B30/360").should.be.equal(1);
      });
      it("should return 1.00278 when B30E/360",function(){
        DateUtil.dayCountFraction(today,futDate,"B30E/360").should.be.equal(1);
      });
      it("should return 2/12 when B30E/360",function(){
        DateUtil.dayCountFraction(moment.utc("2008-01-31"),moment.utc("2008-03-31"),"B30E/360").should.be.equal(2/12);
      });
      it("should return 2/12 when B30/360",function(){
        DateUtil.dayCountFraction(moment.utc("2008-01-31"),moment.utc("2008-03-31"),"B30/360").should.be.equal(2/12);
      });
      it("should return 2/12 when B30/360",function(){
        DateUtil.dayCountFraction(moment.utc("2008-01-28"),moment.utc("2008-03-31"),"B30/360").should.be.approximately(0.175,0.0001);
      });
    });
    describe("ACT/365",function(){
      it("should return 0.99921 when ACT/365 today+1Y",function(){
        DateUtil.dayCountFraction(today,futDate,"ACT/365").should.be.approximately(0.99921,0.0001);
      });
      it("should return 1 when ACT/365F today+1Y",function(){
        DateUtil.dayCountFraction(today,futDate,"ACT/365F").should.be.approximately(1.0000,0.0001);
      });
      it("should return 8 when ACT/365 today+8Y",function(){
        DateUtil.dayCountFraction(today,futDate8Y,"ACT/365").should.be.approximately(8.0000,0.0001);
      });
      it("should return 7 when ACT/365 today+1Y to today+8Y, start on a non leap year",function(){
        DateUtil.dayCountFraction(futDate,futDate8Y,"ACT/365").should.be.approximately(7.0000,0.001);
      });
      it("should return 1/12 when ACT/365 today+1M",function(){
        DateUtil.dayCountFraction(today,futDate1M,"ACT/365").should.be.approximately(1/12,0.01);
      });
    });
    it("should return 1 when EFFECTIVE RATE",function(){
      DateUtil.dayCountFraction(today,futDate,"EFFECTIVE RATE").should.be.equal(1);
    });
    it("should return ? when ACT/360",function(){
      DateUtil.dayCountFraction(today,futDate,"ACT/360").should.be.approximately(1.01389,0.0001);
    });
    it("should return 0 when start date == end date",function(){
      DateUtil.dayCountFraction(today,today,"ACT/365").should.equal(0);
    });
    it("should return opposite sign is date are inverted",function(){
      DateUtil.dayCountFraction(today,futDate,"ACT/365").should.equal(-DateUtil.dayCountFraction(futDate,today,"ACT/365"));
    });
    it("should throw an error when the mode is not identified",function(){
      (function(){
        DateUtil.dayCountFraction(today,moment.utc("2009-09-18"),"42");
      }).should.throw();
    });
    it("should throw an error if start date is not a valid moment object",function(){
      (function(){
        DateUtil.dayCountFraction(null,moment.utc("2009-09-18"),"ACT/360");
      }).should.throw();
    });
    it("should throw an error if end date is not a valid moment object",function(){
      (function(){
        DateUtil.dayCountFraction(today,null,"ACT/360");
      }).should.throw();
    });
  });
});
