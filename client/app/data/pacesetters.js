if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  return {
    "tables": [
      {
        "name": "Amount Spent with MBEs",
        "element": "amount-spent",
        "hot_parameters": {
          "rowHeaderWidth": 500,
          "height": 225,
          "colWidths": 380
        },
        "rows": [
          {
            "key": "local",
            "label": "Dollar Amount Spent with Local MBEs ($)"
          },
          {
            "key": "state",
            "label": "Dollar Amount Spent with State MBEs ($)"
          },
          {
            "key": "national",
            "label": "Dollar Amount Spent with National MBEs ($)"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for FY in Thousands of Dollars ($)"
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
            "empty": false,
          }
        ],
        "excel": [
          {
            "sheet": "1. Amount Spent",
            "start": "B2",
            "end": "B4",
            "firstrow": "Dollar Amount Spent with Local MBEs ($)"
          }
        ]
      },
      {
        "name": "Addressable Spend",
        "element": "addressable-spend",
        "hot_parameters": {
          "rowHeaderWidth": 500,
          "height": 225,
          "colWidths": 380
        },
        "rows": [
          {
            "key": "local",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services Locally ($)"
          },
          {
            "key": "state",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services at the State Level ($)"
          },
          {
            "key": "national",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services in the United States ($)"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for FY18 in Thousands of Dollars"
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
            "empty": false,
          }
        ],
        "excel": [
          {
            "sheet": "2. Addressable Spend",
            "start": "B2",
            "end": "B4",
            "firstrow": "Total Dollar Amount Spent Procuring All Goods and Services Locally ($)"
          }
        ]
      },
      {
        "name": "Number of MBEs",
        "element": "number-MBEs",
        "hot_parameters": {
          "rowHeaderWidth": 500,
          "height": 225,
          "colWidths": 380
        },
        "rows": [
          {
            "key": "local",
            "label": "Number of Local MBEs With Whom You Have Done Business (#)"
          },
          {
            "key": "state",
            "label": "Number of State MBEs With Whom You Have Done Business (#)"
          },
          {
            "key": "national",
            "label": "Number of National MBEs With Whom You Have Done Business (#)"
          }
        ],
        "cols": [
          [
            {
              "key": "value",
              "label": "Value for FY18"
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
            "max_warning": 10000,
            "empty": false,
          }
        ]
      }
    ],
    'usability': [
      'data_prefilled',
      {'time_spent': ['page', 'session-area', 'tables-area', 'amount-spent', 'number-MBEs', 'addressable-spend', 'review-and-submit']},
      {'browser': ['chrome', 'edge', 'msie', 'firefox', 'opera', 'other', 'safari']
      },
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
