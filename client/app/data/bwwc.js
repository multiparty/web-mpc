if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

var TABLE_HEIGHT = 750;
var ROW_HEADER_WIDTH = 200;
const colspan = 3

const rows = [
  {
    "key": "Ex/Sen",
    "label": "Executive/Senior Level <br> Officials and Managers"
  },
  {
    "key": "F/M",
    "label": "First/Mid-Level Officials <br> and Managers"
  },
  {
    "key": "Profs",
    "label": "Professionals"
  },
  {
    "key": "Techs",
    "label": "Technicians"
  },
  {
    "key": "Sales",
    "label": "Sales Workers"
  },
  {
    "key": "Adminis",
    "label": "Administrative Support Workers"
  },
  {
    "key": "Craft",
    "label": "Craft Workers"
  },
  {
    "key": "Operatives",
    "label": "Operatives"
  },
  {
    "key": "Laborers",
    "label": "Laborers and Helpers"
  },
  {
    "key": "Service",
    "label": "Service Workers"
  }
]
const cols = [
  [
    {
      "label": "Hispanic or Latinx",
      "colspan": colspan
    },
    {
      "label": "White",
      "colspan": colspan
    },
    {
      "label": "Black/African American",
      "colspan": colspan
    },
    {
      "label": "Native Hawaiian or <br> Pacific Islander",
      "colspan": colspan
    },
    {
      "label": "Asian",
      "colspan": colspan
    },
    {
      "label": "American Indian/Alaska <br> Native",
      "colspan": colspan
    },
    {
      "label": "Two or More Races <br> (Not Hispanic or Latinx)",
      "colspan": colspan
    },
    {
      "label": "Unreported",
      "colspan": colspan
    }
  ],
  [
    {
      "label": "F",
      "key": "hispF"
    },
    {
      "label": "M",
      "key": "hispM"
    },
    {
      "label": "NB",
      "key": "hispNB"
    },
    {
      "label": "F",
      "key": "whiteF"
    },
    {
      "label": "M",
      "key": "whiteM"
    },
    {
      "label": "NB",
      "key": "whiteNB"
    },
    {
      "label": "F",
      "key": "afrF"
    },
    {
      "label": "M",
      "key": "afrM"
    },
    {
      "label": "NB",
      "key": "afrNB"
    },
    {
      "label": "F",
      "key": "hawaiiF"
    },
    {
      "label": "M",
      "key": "hawaiiM"
    },
    {
      "label": "NB",
      "key": "hawaiiNB"
    },
    {
      "label": "F",
      "key": "asianF"
    },
    {
      "label": "M",
      "key": "asianM"
    },
    {
      "label": "NB",
      "key": "asianNB"
    },
    {
      "label": "F",
      "key": "indF"
    },
    {
      "label": "M",
      "key": "indM"
    },
    {
      "label": "NB",
      "key": "indNB"
    },
    {
      "label": "F",
      "key": "twoF"
    },
    {
      "label": "M",
      "key": "twoM"
    },
    {
      "label": "NB",
      "key": "twoNB"
    },
    {
      "label": "F",
      "key": "unrF"
    },
    {
      "label": "M",
      "key": "unrM"
    },
    {
      "label": "NB",
      "key": "unrNB"
    },
  ]
]



define([], function () {
  return {
    "tables": [
      {
        "name": "Number Of Employees",
        "element": "number-employees-hot",
        "operations": { SUM: true, STD: true },
        "cohortOperations": { SUM: true },
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT
        },
        "rows": rows,
        "cols": cols,
        "types": [
          {
            "range": {
              "row": "*",
              "col": "*"
            },
            "type": "int",
            "min": 0,
            "max_warning": 10000,
            "empty": false,
            "validators": [
              "discrepancies"
            ]
          }
        ],
        "excel": [
          {
            "sheet": "1.Number of Employees",
            "start": "B7",
            "end": "Y16",
            "firstrow": "Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "0-3-6-9-12-15-18-21"
            },
            "tooltip": {
              "//promptTitle": "Number of Female Employees",
              "//prompt": "Please input the total number of female employees in this race/ethnicity and job category.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "1-4-7-10-13-16-19-22"
            },
            "tooltip": {
              "//promptTitle": "Number of Male Employees",
              "//prompt": "Please input the total number of male employees in this race/ethnicity and job category.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "2-5-8-11-14-17-20-23"
            },
            "tooltip": {
              "//promptTitle": "Number of Non-Binary Employees",
              "//prompt": "Please input the total number of Non-Binary employees in this race/ethnicity and job category.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Total Annual Compensation (Dollars)",
        "element": "compensation-hot",
        "operations": { AVG: 'Number Of Employees', STD: true },
        "cohortOperations": { AVG: 'Number Of Employees' },
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT
        },
        "rows": rows,
        "cols": cols,
        "types": [
          {
            "range": {
              "row": "*",
              "col": "*"
            },
            "type": "currency",
            "min": 0,
            "max_warning": 100000000,
            "empty": false,
            "validators": [
              "discrepancies"
            ]
          }
        ],
        "excel": [
          {
            "sheet": "2.Compensation",
            "start": "B6",
            "end": "Y15",
            "firstrow": "Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "0-3-6-9-12-15-18-21"
            },
            "tooltip": {
              "//promptTitle": "Total Annual Compensation",
              "//prompt": "Please input the total annual compensation of female employees in this race/ethnicity and job category in dollars.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "1-4-7-10-13-16-19-22"
            },
            "tooltip": {
              "//promptTitle": "Total Annual Compensation",
              "//prompt": "Please input the total annual compensation of male employees in this race/ethnicity and job category in dollars.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "2-5-8-11-14-17-20-23"
            },
            "tooltip": {
              "//promptTitle": "Total Annual Compensation",
              "//prompt": "Please input the total annual compensation of Non-Binary employees in this race/ethnicity and job category in dollars.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Total Annual Cash Performance Pay (Dollars)",
        "element": "performance-pay-hot",
        "operations": { AVG: 'Number Of Employees', STD: true },
        "cohortOperations": { AVG: 'Number Of Employees' },
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT
        },
        "rows": rows,
        "cols": cols,
        "types": [
          {
            "range": {
              "row": "*",
              "col": "*"
            },
            "type": "currency",
            "min": 0,
            "max_warning": 100000000,
            "empty": false,
            "validators": [
              "discrepancies"
            ]
          }
        ],
        "excel": [
          {
            "sheet": "3.Performance Pay",
            "start": "B6",
            "end": "Y15",
            "firstrow": "Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "0-3-6-9-12-15-18-21"
            },
            "tooltip": {
              "//promptTitle": "Total Annual Performance Pay",
              "//prompt": "Please input the total annual cash performance pay of female employees in this race/ethnicity and job category in dollars.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "1-4-7-10-13-16-19-22"
            },
            "tooltip": {
              "//promptTitle": "Total Annual Performance Pay",
              "//prompt": "Please input the total annual cash performance pay of male employees in this race/ethnicity and job category in dollars.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "2-5-8-11-14-17-20-23"
            },
            "tooltip": {
              "//promptTitle": "Total Annual Performance Pay",
              "//prompt": "Please input the total annual cash performance pay of Non-Binary employees in this race/ethnicity and job category in dollars.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Total Length of Service (Months)",
        "element": "service-length-hot",
        "operations": { AVG: 'Number Of Employees', STD: true },
        "cohortOperations": { AVG: 'Number Of Employees' },
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT
        },
        "rows": rows,
        "cols": cols,
        "types": [
          {
            "range": {
              "row": "*",
              "col": "*"
            },
            "type": "int",
            "min": 0,
            "max_warning": 1000000,
            "empty": false,
            "validators": [
              "discrepancies"
            ]
          }
        ],
        "excel": [
          {
            "sheet": "4.Tenure",
            "start": "B6",
            "end": "Y15",
            "firstrow": "Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "0-3-6-9-12-15-18-21"
            },
            "tooltip": {
              "//promptTitle": "Total Length of Service",
              "//prompt": "Please input the total length of service of female employees in this race/ethnicity and job category in months.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "1-4-7-10-13-16-19-22"
            },
            "tooltip": {
              "//promptTitle": "Total Length of Service",
              "//prompt": "Please input the total length of service of male employees in this race/ethnicity and job category in months.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          },
          {
            "range": {
              "row": "*",
              "col": "2-5-8-11-14-17-20-23"
            },
            "tooltip": {
              "//promptTitle": "Total Length of Service",
              "//prompt": "Please input the total length of service of Non-Binary employees in this race/ethnicity and job category in months.",
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      }
    ],
    "totals": {
      "name": "Totals Check",
      "element": "totals-hot",
      "submit": false,
      "hot_parameters": {
        "rowHeaderWidth": 100
      },
      "rows": [
        {
          "label": "Total"
        }
      ],
      "cols": [
        [
          {
            "label": "Total Number of Employees",
            "colspan": colspan + 1
          }
        ],
        [
          {
            "label": "Female",
            "key": ""
          },
          {
            "label": "Male",
            "key": ""
          },
          {
            "label": "NBinary",
            "key": ""
          },
          {
            "label": "All",
            "key": ""
          }
        ]
      ],
      "types": [
        {
          "range": {
            "row": "*",
            "col": "*"
          },
          "type": "int",
          "read_only": true
        }
      ]
    },
    'usability': [
      'data_prefilled',
      { 'time_spent': ['page', 'session-area', 'number-employees-hot', 'compensation-hot', 'performance-pay-hot', 'service-length-hot', 'review-and-submit'] },
      { 'browser': ['chrome', 'edge', 'msie', 'firefox', 'opera', 'other', 'safari'] },
      {
        'validation_errors': [
          'SESSION_KEY_ERROR',
          'SESSION_INFO_ERROR',
          'PARTICIPATION_CODE_ERROR',
          'SESSION_PARTICIPATION_CODE_SERVER_ERROR',
          'UNCHECKED_ERR',
          'GENERIC_TABLE_ERR',
          'SERVER_ERR',
          'GENERIC_SUBMISSION_ERR',
          'NAN_EMPTY_CELLS',
          'SEMANTIC_CELLS',
          'CELL_ERROR'
        ]
      }
    ],
    'cohort_group_by': ['Female', 'Male', 'NBinary'], // list all the groups to include in the cohort results
    'cohort_selection': true,
    'cohorts': [
      { name: 'Administrative Services' },
      { name: 'Architecture, Engineering, Real Estate' },
      { name: 'Biotech/Pharmaceuticals' },
      { name: 'Construction, Manufacturing, Utilities/Energy, Transportation' },
      { name: 'Education' },
      { name: 'Financial Services (Including Insurance)' },
      { name: 'Health Care' },
      { name: 'Information/Technology' },
      { name: 'Legal Services' },
      { name: 'Marketing/Media' },
      { name: 'Nonprofit' },
      { name: 'Professional Services' },
      { name: 'Public Sector' }
    ],
    'cohort_threshold': 8,
    'send_submitter_ids': true,
  }
});
