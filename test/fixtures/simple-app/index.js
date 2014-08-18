
module.exports = function * main(beyo) {

  beyo.postInit(function * () {
    beyo.__postInitTestGenerator = true;
  });

  beyo.postInit(function (done) {
    beyo.__postInitTestThunk = true;

    done();
  });

  return require;
}
