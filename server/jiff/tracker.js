const modulesWrappers = require('../modules/modulesWrappers.js');

module.exports = function (JIFFWrapper) {
  // Keeps track of submitters IDs
  JIFFWrapper.prototype.trackParty = function (session_key, jiff_party_id, status) {
    if (jiff_party_id === 's1' || jiff_party_id === 1) {
      return;
    }

    var promise = modulesWrappers.History.insert(session_key, jiff_party_id, status);
    return promise.catch(function (err) {
      console.log('Failed to track party', err);
      throw new Error('Error writing submission to database');
    });
  };

  JIFFWrapper.prototype.getTrackerParties = async function (session_key) {
    var submitters_ids = {};

    // Load history and user keys/codes for this session
    var history = await modulesWrappers.History.query(session_key);
    var codes = await modulesWrappers.UserKey.query(session_key);

    // Map every id to its cohort
    var id_to_cohort = {};
    for (var code of codes) {
      id_to_cohort[code.jiff_party_id] = code.cohort;
    }

    // Construct submitters object
    for (var submission of history) {
      var party_id = submission.jiff_party_id;
      var success = submission.success;
      var cohort = id_to_cohort[party_id];

      if (submitters_ids[cohort] == null) {
        submitters_ids[cohort] = {}
      }

      if (success) {
        submitters_ids[cohort][party_id] = true;
      } else {
        delete submitters_ids[cohort][party_id];
      }
    }

    // Reformat object
    var tracker = {};
    var all = [];
    for (cohort in submitters_ids) {
      if (!submitters_ids.hasOwnProperty(cohort)) {
        continue;
      }

      var arr = [];
      for (var id in submitters_ids[cohort]) {
        if (submitters_ids[cohort].hasOwnProperty(id)) {
          arr.push(id);
        }
      }

      if (arr.length > 0) {
        arr.sort(); // important: hides order of submission
        tracker[cohort] = arr;
        all = all.concat(arr);
      }
    }

    all.sort(); // important: hides order of submission
    tracker['all'] = all;
    return tracker;
  };
};
