define([], function () {
  return {
    tables: [
      {
        "name": "Pacesetter Procurement Measure",
        "element": "pacesetter-measure-hot",
        "hot_parameters": {
          "rowHeaderWidth": 480,
          "height": 275,
          "colWidths": [190],
          "stretchH": "last"
        },
        "rows": [
          {
            "key": "DollarAmtLocal",
            "label": "Dollar Amount Spent with Local MBEs in Whole Dollars"
          },{
            "key": "DollarAmt",
            "label": "Dollar Amount Spent with MBEs in Whole Dollars"
          },{
            "key": "TotalAmt",
            "label": "Total Dollar Amount Spent Procuring All Goods and Services in the United States in Whole Dollars"
          },{
            "key": "NumContracted",
            "label": "Number of Local MBEs With Whom You Have Done Business"
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
            "type": "currency",
            "min": 0,
            "max_warning": 1000000000,
            "empty": false,
            "validators": [
              "discrepancies"
            ]
          },
          {
            "range": {
              "row": "3",
              "col": "*"
            },
            "type": "int",
            "min": 0,
            "max_warning": 1000,
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
    ]

  }
});
