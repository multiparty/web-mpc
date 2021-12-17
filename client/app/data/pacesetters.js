if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

var TABLE_HEIGHT = 250;
var ROW_HEADER_WIDTH = 450;

define(['constants'], function (constants) {
  let SELF = constants.SELF;
  return {
    "tables": [
      {
        "name": "Total Number of Contracts with Minority-Owned Business Enterprises ",
        "element": "number-of-contracts",
        "operations": {AVG: SELF, STD: true},
        "cohortOperations": {AVG: SELF, STD: true},
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT,
        },
        "rows": [
          {
            "key": "local",
            "label": "Number of Contracts with Local MBEs"
          },
          {
            "key": "state",
            "label": "Number of Contracts with State MBEs"
          },
          {
            "key": "national",
            "label": "Number of Contracts with National MBEs"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "# for CY20"
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
            "min": 0,
            "max_warning": 10000000,
            "empty": false
          }
        ],
        "excel": [
          {
            "sheet": "1. Contracts with MBEs",
            "start": "B2",
            "end": "B4",
            "firstrow": "Number of Contracts with Local MBEs"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "*"

            },
            "tooltip": {
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Spend with MBEs",
        "element": "spend",
        "operations": {AVG: SELF, STD: true},
        "cohortOperations": {AVG: SELF, STD: true},
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT,
        },
        "rows": [
          {
            "key": "local",
            "label": "Value of Contracts with Local MBEs"
          },
          {
            "key": "state",
            "label": "Value of Contracts with State MBEs"
          },
          {
            "key": "national",
            "label": "Value of Contracts with National MBEs"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for CY20"
            }
          ]
        ],
        "types": [
          {
            "range": {
              "row": "*",
              "col": "*"
            },
            "type": "currency",
            "min": 0,
            "max_warning": 10000000,
            "empty": false
          }
        ],
        "excel": [
          {
            "sheet": "2. Spend with MBEs",
            "start": "B2",
            "end": "B4",
            "firstrow": "Value of Contracts with Local MBEs"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "*"

            },
            "tooltip": {
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Number of Unique MBEs Contracted with",
        "element": "Unique-MBEs",
        "operations": {AVG: SELF, STD: true},
        "cohortOperations": {AVG: SELF, STD: true},
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT,
        },
        "rows": [
          {
            "key": "local",
            "label": "Number of Unique Local MBEs Contracted with"
          },
          {
            "key": "state",
            "label": "Number of Unique State MBEs Contracted with"
          },
          {
            "key": "national",
            "label": "Number of Unique National MBEs Contracted with"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "# for CY20"
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
            "min": 0,
            "max_warning": 10000000,
            "empty": false
          }
        ],
        "excel": [
          {
            "sheet": "3. Unique MBEs",
            "start": "B2",
            "end": "B4",
            "firstrow": "Number of Unique Local MBEs contracted with"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "*"

            },
            "tooltip": {
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Contracts Addressable Spent",
        "element": "contracts-addressable-spent",
        "operations": {AVG: SELF, STD: true},
        "cohortOperations": {AVG: SELF, STD: true},
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT,
        },
        "rows": [
          {
            "key": "local",
            "label": "Number of Local Contracts in All Addressable Spent"
          },
          {
            "key": "state",
            "label": "Number of State Contracts in All Addressable Spent"
          },
          {
            "key": "national",
            "label": "Number of National Contracts in All Addressable Spent"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "# for CY20"
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
            "min": 0,
            "max_warning": 10000000,
            "empty": false
          }
        ],
        "excel": [
          {
            "sheet": "4. Contracts Addressable Spend",
            "start": "B2",
            "end": "B4",
            "firstrow": "Number of Local Contracts in all addressable spent"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "*"

            },
            "tooltip": {
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Addressable Spend",
        "element": "addressable-spend",
        "operations": {AVG: SELF, STD: true},
        "cohortOperations": {AVG: SELF, STD: true},
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT,
        },
        "rows": [
          {
            "key": "local",
            "label": "Value of Local Contracts in addressable spent"
          },
          {
            "key": "state",
            "label": "Value of State Contracts in addressable spent"
          },
          {
            "key": "national",
            "label": "Value of National Contracts in addressable spent"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for CY20"
            }
          ]
        ],
        "types": [
          {
            "range": {
              "row": "*",
              "col": "*"
            },
            "type": "currency",
            "min": 0,
            "max_warning": 10000000,
            "empty": false
          }
        ],
        "excel": [
          {
            "sheet": "5. Addressable Spend",
            "start": "B2",
            "end": "B4",
            "firstrow": "Value of local Contracts in addressable spent"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "*"

            },
            "tooltip": {
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name": "Unique Contracts",
        "element": "unique-contracts",
        "operations": {AVG: SELF, STD: true},
        "cohortOperations": {AVG: SELF, STD: true},
        "hot_parameters": {
          "rowHeaderWidth": ROW_HEADER_WIDTH,
          "height": TABLE_HEIGHT,
        },
        "rows": [
          {
            "key": "local",
            "label": "Number of Unique Local Companies in all addressable spent"
          },
          {
            "key": "state",
            "label": "Number of Unique State Companies in all addressable spent"
          },
          {
            "key": "national",
            "label": "Number of Unique National Companies in all addressable spent"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "# for CY20"
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
            "min": 0,
            "max_warning": 10000000,
            "empty": false
          }
        ],
        "excel": [
          {
            "sheet": "6. Unique Companies",
            "start": "B2",
            "end": "B4",
            "firstrow": "Numbe of Unique Local Companies in all addressable spent"
          }
        ],
        "tooltips": [
          {
            "range": {
              "row": "*",
              "col": "*"

            },
            "tooltip": {
              "errorTitle": "Invalid Data Entry",
              "error": "Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle": "Warning: Data is too big",
              "warning": "Are you sure this value is correct?"
            }
          }
        ]
      }
    ],
    'usability': [
      'data_prefilled',
      {'time_spent': ['page', 'session-area', 'tables-area', 'amount-spent', 'number-MBEs', 'addressable-spend', 'review-and-submit']},
      {'browser': ['chrome', 'edge', 'msie', 'firefox', 'opera', 'other', 'safari']},
      {'validation_errors': [
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
    'ratios': [[0, 3], [1, 4], [2, 5]], // zero-indexed tables to take ratios between
    'cohort_selection': false,
    'send_submitter_ids': false,
  }
});
