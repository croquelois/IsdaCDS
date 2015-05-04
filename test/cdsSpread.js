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
var effDate = moment.utc("2007-03-20");
var matDate = moment.utc("2013-06-20");
    
describe("upfrontCharge",function(){
});

describe("price",function(){
});

describe("bootstrap",function(){
});

describe("oneSpread",function(){
});

describe("feeLegFlows",function(){
});

describe("parSpreads",function(){
});