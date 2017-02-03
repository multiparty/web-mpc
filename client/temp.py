cols = ["Hispanic or Latino Male",
"Hispanic or Latino Female",
"Not-Hispanic or Latino Male White",
"Not-Hispanic or Latino Male Black or African American",
"Not-Hispanic or Latino Male Native Hawaiian or Other Parcific Islander",
"Not-Hispanic or Latino Male Asian",
"Not-Hispanic or Latino Male American Indian or Alaska Native",
"Not-Hispanic or Latino Male Two or more races",
"Not-Hispanic or Latino Female White",
"Not-Hispanic or Latino Female Black or African American",
"Not-Hispanic or Latino Female Native Hawaiian or Other Parcific Islander",
"Not-Hispanic or Latino Female Asian",
"Not-Hispanic or Latino Female American Indian or Alaska Native",
"Not-Hispanic or Latino Female Two or more races",
"TOTAL Rows"]

rows = ["Executive/Senior Level Officials and Managers",
"First/Mid-Level Officials and Managers",
"Professionals",
"TOTAL Cols"]

print 'module.exports = {'
for row in rows:
	for col in cols:
		rowcol = '    "' + row + " " + col + '": 0,'
		print rowcol
print '}'
