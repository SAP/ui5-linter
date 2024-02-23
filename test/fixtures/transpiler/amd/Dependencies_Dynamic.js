var dependency = new Date().getTime() % 2 === 0 ? "alpha" : "beta";
sap.ui.define([dependency, "delta"], function (alphaOrBeta, delta) {
  return {
    verb: function(){
      return alphaOrBeta.verb() + 2 + delta();
    }
  };
});
