if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  return {
    tables: [
      {
        "name": "Amount spent with MBEs",
        "element": "pacesetter-measure-hot",
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 230,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "DollarAmtLocal",
            "label": "Dollar Amount Spent with <i>Local</i> MBEs"
          }, {
            "key": "DollarAmtState",
            "label": "Dollar Amount Spent with <i>State</i> MBEs"
          }, {
            "key": "DollarAmtNational",
            "label": "Dollar Amount Spent with <i>National</i> MBEs"
          }
        ],
        "cols": [
          [
            {
              "label": "Value for FY17 in Thousands of Dollars",
              "key": "value"
            }
          ]
        ],
        "types": [
          {
            "range": {
              "row": "0:2",
              "col": "*"
            },
            "type": "currency",
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
            "sheet": "Pacesetters",
            "start": "B7",
            "end": "Q16",
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
      }, {
        "name": "Addressable spend",
        "element": "pacesetter-measure-hot-2",
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 230,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "TotalAmtLocal",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services <i>Locally</i>"
          }, {
            "key": "TotalAmtState",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services at the <i>State Level</i>"
          }, {
            "key": "TotalAmtNational",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services in the <i>United States</i>"
          }
        ],
        "cols": [
          [
            {
              "label": "Value for FY17 in Thousands of Dollars",
              "key": "value"
            }
          ]
        ],
        "types": [
          {
            "range": {
              "row": "0:2",
              "col": "*"
            },
            "type": "currency",
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
            "sheet": "Pacesetters",
            "start": "B7",
            "end": "Q16",
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
      }, {
        "name": "Number of MBEs",
        "element": "pacesetter-measure-hot-3",
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 230,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "NumContractedLocal",
            "label": "Number of <i>Local</i> MBEs With Whom You Have Done Business"
          }, {
            "key": "NumContractedState",
            "label": "Number of <i>State</i> MBEs With Whom You Have Done Business"
          }, {
            "key": "NumContractedNational",
            "label": "Number of <i>National</i> MBEs With Whom You Have Done Business"
          }
        ],
        "cols": [
          [
            {
              "label": "Value for FY17",
              "key": "value"
            }
          ]
        ],
        "types": [
          {
            "range": {
              "row": "0:2",
              "col": "*"
            },
            "type": "int",
            "min": 0,
            "max_warning": 50000,
            "empty": false,
            "validators": [
              "discrepancies"
            ]
          }
        ],
        "excel": [
          {
            "sheet": "Pacesetters",
            "start": "B7",
            "end": "Q16",
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
      }
    ],
    questions: []

  }
});
