// TODO: think about safe integers and overflow

describe("Unsigned integer conversion", function () {
  var twoto32 = MAX_VALUE;

  it("should preserve values < 2^32", function () {
    expect(_uint32(0)).toEqual(0);
    expect(_uint32(1001)).toEqual(1001);
    expect(_uint32(twoto32 - 1)).toEqual(twoto32 - 1);
  });

  it("should wrap around for values >= 2^32", function () {
    expect(_uint32(twoto32 + 0)).toEqual(0);
    expect(_uint32(twoto32 + 1001)).toEqual(1001);
    expect(_uint32(twoto32 + (twoto32 - 1))).toEqual(twoto32 - 1);
  });

  it("should wrap around for negative values > -2^32", function () {
    expect(_uint32(-1)).toEqual(twoto32 - 1);
    expect(_uint32(-1001)).toEqual(twoto32 - 1001);
    expect(_uint32(-(twoto32 - 1))).toEqual(twoto32 - (twoto32 - 1));
  });

  it("should wrap around for negative values <= -2^32", function () {
    expect(_uint32(-twoto32)).toEqual(0);
    expect(_uint32(-(twoto32 + 1001))).toEqual(4294966295);
    expect(_uint32(-(twoto32 + (twoto32 - 1)))).toEqual(1);
  });

});

describe("MPC for single values", function () {
  var twoto32 = MAX_VALUE;

  it("should secret share a value into n pieces", function () {
    expect(_secretShare(100, 2).length).toEqual(2);
    expect(_secretShare(100, 3).length).toEqual(3);
    expect(_secretShare(100, 10).length).toEqual(10);
  });

  it("should recombine n shares into sum of their values without overflow", function () {
    expect(_recombine([0, 0])).toEqual(0);
    expect(_recombine([1, 2])).toEqual(3);
    expect(_recombine([1, 2, 3])).toEqual(6);
    expect(_recombine([1, 1, 1, 1, 1, 1, 1, 1, 1, 1])).toEqual(10);
  });

  it("should recombine n shares into sum of their values with overflow", function () {
    expect(_recombine([718963556, 3576003840])).toEqual(100);
    expect(_recombine([
      718963556, 
      3576003840, 
      221889085])).toEqual(221889185);
    expect(_recombine([
      718963556, 
      3576003840, 
      221889085,
      3455176663,
      2728395877,
      2839682470,
      4179846975,
      1828259442,
      370293165,
      2464346730])).toEqual(908021323);
  });

  it("should hold that recombination is inverse of secret-sharing", function () {
    expect(_recombine(_secretShare(100, 2))).toEqual(100);
    expect(_recombine(_secretShare(100, 3))).toEqual(100);
    expect(_recombine(_secretShare(100, 10))).toEqual(100);
  });

  it("should add shares so that recombined result is sum of secrets", function () {
    var sharesA = _secretShare(100, 2);
    var sharesB = _secretShare(42, 2);
    var sharesSum = [
      _addShares(sharesA[0], sharesB[0]),
      _addShares(sharesA[1], sharesB[1])
    ];
    var given = _recombine(sharesSum),
        expected = 142;
    expect(given).toEqual(expected);
  });

  it("should throw exception when input >= 2^32", function () {
    var f = function () {
      _secretShare(twoto32, 2);
    };
    expect(f).toThrow(new Error('Input value too large'));
    f = function () {
      _secretShare(twoto32 + 100, 2);
    };
    expect(f).toThrow(new Error('Input value too large'));
  });

  it("should throw exception when input is negative", function () {
    var f = function () {
      _secretShare(-1, 2);
    };
    expect(f).toThrow(new Error('Input value negative'));
  });
});

describe("MPC for objects", function () {

  it("should secret share the fields of an object", function() {
    var objA = {
        'k1': 123,
        'k2': 456,
        'k3': 890
      },
    secretShared = secretShareValues(objA);

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
