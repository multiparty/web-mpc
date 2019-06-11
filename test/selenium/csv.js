module.exports = {
  parseCSVCohorts: function (csvContent) {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const parsed = {};
    const cohorts = [];
    var skipNext = false;
    var currentCohort = null;
    for (const line of lines) {
      // Columns headers
      if (skipNext) {
        skipNext = false;
        continue;
      }

      const matchAll = line.match(/^All Cohorts -- Number of participants ([0-9]+)$/);
      const matchCohort = line.match(/^Cohort #([0-9]+) -- Number of participants ([0-9]+)$/);

      // File Header
      if (matchAll) {
        currentCohort = 'all';
        parsed[currentCohort] = { count: matchAll[1], values: []};
        continue;
      }

      // Cohort Header
      if (matchCohort) {
        currentCohort = matchCohort[1];
        parsed[currentCohort] = { count: matchCohort[2], values: []};
        cohorts.push(currentCohort);
        continue;
      }

      // Section|table title
      if (line.indexOf(',') === -1) {
        skipNext = true;
        continue;
      }

      // Data line, skip first column (row header)
      const parsedLine = line.split(',').slice(1);
      parsed[currentCohort].values = parsed[currentCohort].values.concat(parsedLine);
    }

    return { cohorts, parsed };
  }
};
