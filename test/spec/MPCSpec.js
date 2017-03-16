// TODO: test n > 2

describe("MPC", function() {
  var a = 100,
      b = 70,
      field = 4294967296,
      n = 2,
      sharesA,
      sharesB,
      objA = {
        'k1': 123,
        'k2': 456,
        'k3': 890
      };

  it("should secret share a value into n pieces", function() {
    sharesA = _secretShare(a, n, field);
    expect(sharesA.length).toEqual(n);
  });

  it("should recombine the n shares to the original value", function() {
    var given = _recombine(sharesA, field),
        expected = a;
    expect(given).toEqual(expected);
  });

  it("should add shares so that recombined result is sum of secrets", function() {
    sharesB = _secretShare(b, n, field);
    var sharesSum = [
      _addShares(sharesA[0], sharesB[0], field),
      _addShares(sharesA[1], sharesB[1], field)
    ];
    var given = _recombine(sharesSum, field),
        expected = _mod(a + b, field);
    expect(given).toEqual(expected);
  });

  it("should secret share the fields of an object", function() {
    var secretShared = secretShareValues(objA, field);
    expect(secretShared.hasOwnProperty('service')).toEqual(true);
    expect(secretShared.hasOwnProperty('analyst')).toEqual(true);
    
    var analystShares = secretShared['analyst'];
    for (var key in analystShares) {
      expect(objA.hasOwnProperty(key)).toEqual(true);
    }
    for (var key in objA) {
      expect(analystShares.hasOwnProperty(key)).toEqual(true);
    }

    var serviceShare = secretShared['service'];
    for (var key in serviceShare) {
      expect(objA.hasOwnProperty(key)).toEqual(true);
    }
    for (var key in objA) {
      expect(serviceShare.hasOwnProperty(key)).toEqual(true);
    }
  });

});
