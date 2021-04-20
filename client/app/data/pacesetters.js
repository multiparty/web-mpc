if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  return {
    "tables": [
      {
        "name": "Total Dollars Spent with Minority-Owned Business Enterprises ",
        "element": "amount-spent", //TODO: what does this element do?
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 230,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "local",
            "label": "Dollar Amount Spent with Local MBEs"
          },
          {
            "key": "state",
            "label": "Dollar Amount Spent with State MBEs"
          },
          {
            "key": "national",
            "label": "Dollar Amount Spent with National MBEs"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for FY20 in Thousands of Dollars"
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
            "sheet": "1. Amount Spent",
            "start": "B2",
            "end": "B4",
            "firstrow": "Dollar Amount Spent with Local MBEs"
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
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 230,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "local",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services Locally"
          },
          {
            "key": "state",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services at the State Level"
          },
          {
            "key": "national",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services in the United States"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for FY20 in Thousands of Dollars"
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
            "sheet": "2. Addressable Spend",
            "start": "B2",
            "end": "B4",
            "firstrow": "Total Dollar Amount Spent Procuring All Goods and Services Locally"
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
        "name": "Total of Contracts with MBEs",
        "element": "Total-of-contract-MBEs",
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 230,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "local",
            "label": "Total of Contracts with Local MBEs"
          },
          {
            "key": "state",
            "label": "Total of Contracts with State MBEs"
          },
          {
            "key": "national",
            "label": "Total of Contracts with National MBEs"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for FY20"
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
            "sheet": "3. Total of Contracts",
            "start": "B2",
            "end": "B4",
            "firstrow": "Total of Contracts with Local MBEs"
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
        "name": "Value of Contracts",
        "element": "value-of-contracts",
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 230,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "local",
            "label": "Dollars Spent with Local MBEs"
          },
          {
            "key": "state",
            "label": "Dollars Spent with State MBEs"
          },
          {
            "key": "national",
            "label": "Dollars Spent with National MBEs"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for FY20"
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
            "sheet": "4. Value of Contracts",
            "start": "B2",
            "end": "B4",
            "firstrow": "Dollars Spent with Local MBEs"
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
    ]
  };
});
