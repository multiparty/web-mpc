if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

var tableHeight = 750;

define([], function () {
  return {
    "tables":[
      {
        "name":"Number Of Employees",
        "element":"number-employees-hot",
        "hot_parameters":{
          "rowHeaderWidth":200,
          "height": tableHeight
        },
        "rows":[
          {
            "key":"Ex/Sen",
            "label":"Executive/Senior Level <br> Officials and Managers"
          },
          {
            "key":"F/M",
            "label":"First/Mid-Level Officials <br> and Managers"
          },
          {
            "key":"Profs",
            "label":"Professionals"
          },
          {
            "key":"Techs",
            "label":"Technicians"
          },
          {
            "key":"Sales",
            "label":"Sales Workers"
          },
          {
            "key":"Adminis",
            "label":"Administrative Support Workers"
          },
          {
            "key":"Craft",
            "label":"Craft Workers"
          },
          {
            "key":"Operatives",
            "label":"Operatives"
          },
          {
            "key":"Laborers",
            "label":"Laborers and Helpers"
          },
          {
            "key":"Service",
            "label":"Service Workers"
          }
        ],
        "cols":[
          [
            {
              "label":"Hispanic or Latinx",
              "colspan":2
            },
            {
              "label":"White",
              "colspan":2
            },
            {
              "label":"Black/African American",
              "colspan":2
            },
            {
              "label":"Native Hawaiian or <br> Pacific Islander",
              "colspan":2
            },
            {
              "label":"Asian",
              "colspan":2
            },
            {
              "label":"American Indian/Alaska <br> Native",
              "colspan":2
            },
            {
              "label":"Two or More Races <br> (Not Hispanic or Latinx)",
              "colspan":2
            },
            {
              "label":"Unreported",
              "colspan":2
            }
          ],
          [
            {
              "label":"Female",
              "key":"hispF"
            },
            {
              "label":"Male",
              "key":"hispM"
            },
            {
              "label":"Female",
              "key":"whiteF"
            },
            {
              "label":"Male",
              "key":"whiteM"
            },
            {
              "label":"Female",
              "key":"afrF"
            },
            {
              "label":"Male",
              "key":"afrM"
            },
            {
              "label":"Female",
              "key":"hawaiiF"
            },
            {
              "label":"Male",
              "key":"hawaiiM"
            },
            {
              "label":"Female",
              "key":"asianF"
            },
            {
              "label":"Male",
              "key":"asianM"
            },
            {
              "label":"Female",
              "key":"indF"
            },
            {
              "label":"Male",
              "key":"indM"
            },
            {
              "label":"Female",
              "key":"twoF"
            },
            {
              "label":"Male",
              "key":"twoM"
            },
            {
              "label":"Female",
              "key":"unrF"
            },
            {
              "label":"Male",
              "key":"unrM"
            }
          ]
        ],
        "types":[
          {
            "range":{
              "row":"*",
              "col":"*"
            },
            "type":"int",
            "min":0,
            "max_warning":10000,
            "empty":false,
            "validators":[
              "discrepancies"
            ]
          }
        ],
        "excel":[
          {
            "sheet":"1.Number of Employees",
            "start":"B7",
            "end":"Q16",
            "firstrow":"Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips":[
          {
            "range":{
              "row":"*",
              "col":"0-2-4-6-8-10-12-14"
            },
            "tooltip":{
              "//promptTitle":"Number of Female Employees",
              "//prompt":"Please input the total number of female employees in this race/ethnicity and job category.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          },
          {
            "range":{
              "row":"*",
              "col":"1-3-5-7-9-11-13-15"
            },
            "tooltip":{
              "//promptTitle":"Number of Male Employees",
              "//prompt":"Please input the total number of male employees in this race/ethnicity and job category.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name":"Total Annual Compensation (Dollars)",
        "element":"compensation-hot",
        "hot_parameters":{
          "rowHeaderWidth":200,
          "height":850
        },
        "rows":[
          {
            "key":"Ex/Sen",
            "label":"Executive/Senior Level <br> Officials and Managers"
          },
          {
            "key":"F/M",
            "label":"First/Mid-Level Officials <br> and Managers"
          },
          {
            "key":"Profs",
            "label":"Professionals"
          },
          {
            "key":"Techs",
            "label":"Technicians"
          },
          {
            "key":"Sales",
            "label":"Sales Workers"
          },
          {
            "key":"Adminis",
            "label":"Administrative Support Workers"
          },
          {
            "key":"Craft",
            "label":"Craft Workers"
          },
          {
            "key":"Operatives",
            "label":"Operatives"
          },
          {
            "key":"Laborers",
            "label":"Laborers and Helpers"
          },
          {
            "key":"Service",
            "label":"Service Workers"
          }
        ],
        "cols":[
          [
            {
              "label":"Hispanic or Latinx",
              "colspan":2
            },
            {
              "label":"White",
              "colspan":2
            },
            {
              "label":"Black/African American",
              "colspan":2
            },
            {
              "label":"Native Hawaiian or <br> Pacific Islander",
              "colspan":2
            },
            {
              "label":"Asian",
              "colspan":2
            },
            {
              "label":"American Indian/Alaska <br> Native",
              "colspan":2
            },
            {
              "label":"Two or More Races <br> (Not Hispanic or Latinx)",
              "colspan":2
            },
            {
              "label":"Unreported",
              "colspan":2
            }
          ],
          [
            {
              "label":"Female",
              "key":"hispF"
            },
            {
              "label":"Male",
              "key":"hispM"
            },
            {
              "label":"Female",
              "key":"whiteF"
            },
            {
              "label":"Male",
              "key":"whiteM"
            },
            {
              "label":"Female",
              "key":"afrF"
            },
            {
              "label":"Male",
              "key":"afrM"
            },
            {
              "label":"Female",
              "key":"hawaiiF"
            },
            {
              "label":"Male",
              "key":"hawaiiM"
            },
            {
              "label":"Female",
              "key":"asianF"
            },
            {
              "label":"Male",
              "key":"asianM"
            },
            {
              "label":"Female",
              "key":"indF"
            },
            {
              "label":"Male",
              "key":"indM"
            },
            {
              "label":"Female",
              "key":"twoF"
            },
            {
              "label":"Male",
              "key":"twoM"
            },
            {
              "label":"Female",
              "key":"unrF"
            },
            {
              "label":"Male",
              "key":"unrM"
            }
          ]
        ],
        "types":[
          {
            "range":{
              "row":"*",
              "col":"*"
            },
            "type":"currency",
            "min":0,
            "empty":false,
            "validators":[
              "discrepancies"
            ]
          }
        ],
        "excel":[
          {
            "sheet":"2.Compensation",
            "start":"B6",
            "end":"Q15",
            "firstrow":"Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips":[
          {
            "range":{
              "row":"*",
              "col":"0-2-4-6-8-10-12-14"
            },
            "tooltip":{
              "//promptTitle":"Total Annual Compensation",
              "//prompt":"Please input the total annual compensation of female employees in this race/ethnicity and job category in dollars.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          },
          {
            "range":{
              "row":"*",
              "col":"1-3-5-7-9-11-13-15"
            },
            "tooltip":{
              "//promptTitle":"Total Annual Compensation",
              "//prompt":"Please input the total annual compensation of male employees in this race/ethnicity and job category in dollars.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name":"Total Annual Cash Performance Pay (Dollars)",
        "element":"performance-pay-hot",
        "hot_parameters":{
          "rowHeaderWidth":200,
          "height": tableHeight
        },
        "rows":[
          {
            "key":"Ex/Sen",
            "label":"Executive/Senior Level <br> Officials and Managers"
          },
          {
            "key":"F/M",
            "label":"First/Mid-Level Officials <br> and Managers"
          },
          {
            "key":"Profs",
            "label":"Professionals"
          },
          {
            "key":"Techs",
            "label":"Technicians"
          },
          {
            "key":"Sales",
            "label":"Sales Workers"
          },
          {
            "key":"Adminis",
            "label":"Administrative Support Workers"
          },
          {
            "key":"Craft",
            "label":"Craft Workers"
          },
          {
            "key":"Operatives",
            "label":"Operatives"
          },
          {
            "key":"Laborers",
            "label":"Laborers and Helpers"
          },
          {
            "key":"Service",
            "label":"Service Workers"
          }
        ],
        "cols":[
          [
            {
              "label":"Hispanic or Latinx",
              "colspan":2
            },
            {
              "label":"White",
              "colspan":2
            },
            {
              "label":"Black/African American",
              "colspan":2
            },
            {
              "label":"Native Hawaiian or <br> Pacific Islander",
              "colspan":2
            },
            {
              "label":"Asian",
              "colspan":2
            },
            {
              "label":"American Indian/Alaska <br> Native",
              "colspan":2
            },
            {
              "label":"Two or More Races <br> (Not Hispanic or Latinx)",
              "colspan":2
            },
            {
              "label":"Unreported",
              "colspan":2
            }
          ],
          [
            {
              "label":"Female",
              "key":"hispF"
            },
            {
              "label":"Male",
              "key":"hispM"
            },
            {
              "label":"Female",
              "key":"whiteF"
            },
            {
              "label":"Male",
              "key":"whiteM"
            },
            {
              "label":"Female",
              "key":"afrF"
            },
            {
              "label":"Male",
              "key":"afrM"
            },
            {
              "label":"Female",
              "key":"hawaiiF"
            },
            {
              "label":"Male",
              "key":"hawaiiM"
            },
            {
              "label":"Female",
              "key":"asianF"
            },
            {
              "label":"Male",
              "key":"asianM"
            },
            {
              "label":"Female",
              "key":"indF"
            },
            {
              "label":"Male",
              "key":"indM"
            },
            {
              "label":"Female",
              "key":"twoF"
            },
            {
              "label":"Male",
              "key":"twoM"
            },
            {
              "label":"Female",
              "key":"unrF"
            },
            {
              "label":"Male",
              "key":"unrM"
            }
          ]
        ],
        "types":[
          {
            "range":{
              "row":"*",
              "col":"*"
            },
            "type":"currency",
            "min":0,
            "empty":false,
            "validators":[
              "discrepancies"
            ]
          }
        ],
        "excel":[
          {
            "sheet":"3.Performance Pay",
            "start":"B6",
            "end":"Q15",
            "firstrow":"Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips":[
          {
            "range":{
              "row":"*",
              "col":"0-2-4-6-8-10-12-14"
            },
            "tooltip":{
              "//promptTitle":"Total Annual Performance Pay",
              "//prompt":"Please input the total annual cash performance pay of female employees in this race/ethnicity and job category in dollars.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          },
          {
            "range":{
              "row":"*",
              "col":"1-3-5-7-9-11-13-15"
            },
            "tooltip":{
              "//promptTitle":"Total Annual Performance Pay",
              "//prompt":"Please input the total annual cash performance pay of male employees in this race/ethnicity and job category in dollars.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          }
        ]
      },
      {
        "name":"Total Length of Service (Months)",
        "element":"service-length-hot",
        "hot_parameters":{
          "rowHeaderWidth":200,
          "height": tableHeight
        },
        "rows":[
          {
            "key":"Ex/Sen",
            "label":"Executive/Senior Level <br> Officials and Managers"
          },
          {
            "key":"F/M",
            "label":"First/Mid-Level Officials <br> and Managers"
          },
          {
            "key":"Profs",
            "label":"Professionals"
          },
          {
            "key":"Techs",
            "label":"Technicians"
          },
          {
            "key":"Sales",
            "label":"Sales Workers"
          },
          {
            "key":"Adminis",
            "label":"Administrative Support Workers"
          },
          {
            "key":"Craft",
            "label":"Craft Workers"
          },
          {
            "key":"Operatives",
            "label":"Operatives"
          },
          {
            "key":"Laborers",
            "label":"Laborers and Helpers"
          },
          {
            "key":"Service",
            "label":"Service Workers"
          }
        ],
        "cols":[
          [
            {
              "label":"Hispanic or Latinx",
              "colspan":2
            },
            {
              "label":"White",
              "colspan":2
            },
            {
              "label":"Black/African American",
              "colspan":2
            },
            {
              "label":"Native Hawaiian or <br> Pacific Islander",
              "colspan":2
            },
            {
              "label":"Asian",
              "colspan":2
            },
            {
              "label":"American Indian/Alaska <br> Native",
              "colspan":2
            },
            {
              "label":"Two or More Races <br> (Not Hispanic or Latinx)",
              "colspan":2
            },
            {
              "label":"Unreported",
              "colspan":2
            }
          ],
          [
            {
              "label":"Female",
              "key":"hispF"
            },
            {
              "label":"Male",
              "key":"hispM"
            },
            {
              "label":"Female",
              "key":"whiteF"
            },
            {
              "label":"Male",
              "key":"whiteM"
            },
            {
              "label":"Female",
              "key":"afrF"
            },
            {
              "label":"Male",
              "key":"afrM"
            },
            {
              "label":"Female",
              "key":"hawaiiF"
            },
            {
              "label":"Male",
              "key":"hawaiiM"
            },
            {
              "label":"Female",
              "key":"asianF"
            },
            {
              "label":"Male",
              "key":"asianM"
            },
            {
              "label":"Female",
              "key":"indF"
            },
            {
              "label":"Male",
              "key":"indM"
            },
            {
              "label":"Female",
              "key":"twoF"
            },
            {
              "label":"Male",
              "key":"twoM"
            },
            {
              "label":"Female",
              "key":"unrF"
            },
            {
              "label":"Male",
              "key":"unrM"
            }
          ]
        ],
        "types":[
          {
            "range":{
              "row":"*",
              "col":"*"
            },
            "type":"int",
            "min":0,
            "empty":false,
            "validators":[
              "discrepancies"
            ]
          }
        ],
        "excel":[
          {
            "sheet":"4.Tenure",
            "start":"B6",
            "end":"Q15",
            "firstrow":"Executive/Senior Level Officials and Managers"
          }
        ],
        "tooltips":[
          {
            "range":{
              "row":"*",
              "col":"0-2-4-6-8-10-12-14"
            },
            "tooltip":{
              "//promptTitle":"Total Length of Service",
              "//prompt":"Please input the total length of service of female employees in this race/ethnicity and job category in months.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          },
          {
            "range":{
              "row":"*",
              "col":"1-3-5-7-9-11-13-15"
            },
            "tooltip":{
              "//promptTitle":"Total Length of Service",
              "//prompt":"Please input the total length of service of male employees in this race/ethnicity and job category in months.",
              "errorTitle":"Invalid Data Entry",
              "error":"Please do not input any text or leave any cells blank. If the value is zero, please input zero.",
              "warningTitle":"Warning: Data is too big",
              "warning":"Are you sure this value is correct?"
            }
          }
        ]
      }
    ],
    "totals":{
      "name":"Totals Check",
      "element":"totals-hot",
      "submit":false,
      "hot_parameters":{
        "rowHeaderWidth":100
      },
      "rows":[
        {
          "label":"Total"
        }
      ],
      "cols":[
        [
          {
            "label":"Total Number of Employees",
            "colspan":3
          }
        ],
        [
          {
            "label":"Female",
            "key":""
          },
          {
            "label":"Male",
            "key":""
          },
          {
            "label":"All",
            "key":""
          }
        ]
      ],
      "types":[
        {
          "range":{
            "row":"*",
            "col":"*"
          },
          "type":"int",
          "read_only":true
        }
      ]
    },
    'usability': [
      'data_prefilled', 
      {'time_spent': ['page', 'session-area', 'number-employees-hot', 'compensation-hot', 'performance-pay-hot', 'service-length-hot', 'review-and-submit']},
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
    'cohort_selection': true,
    'cohorts': [
      {name: 'Hard Hat (Utilities, Construction, Manufacturing, Wholesale Trade, Retail Trade)'}, 
      {name: 'Information'},
      {name: 'Finance and Insurance'},
      {name: 'Professional, Scientific, Technological Services'},
      {name: 'Administrative Services'},
      {name: 'Educational Services'},
      {name: 'Healthcare and Social Assistance'},
      {name: 'Arts, Entertainment, and Recreation'},
      {name: 'Other Services (Except Public Administration)'}
    ],
    'definitions': {
      'headers': ['Industry', 'NAICS Code'],
      'title': 'Which Industry Group Do I Choose?: Industries Mapped to NAICS Codes', 
      'table':[
        ['"Hard Hat"\n(22) Utilities', '22, 2211, 221111, 221112, 221113, 221114, 221115, 221116, 221117, 221118, 221121, 221122, 2212, 221210, 2213, 221310, 221320, 221330'],
        ['"Hard Hat"\n(23) Construction', '23, 2361, 236115, 236116, 236117, 236118, 2362, 236210, 236220, 2371, 237110, 237120, 237130, 2372, 237210, 2373, 237310, 2379, 237990, 2381, 238110, 238120, 238130, 238140, 238150, 238160, 238170, 238190, 2382, 238210, 238220, 238290, 2383, 238210, 238320, 238330, 238340, 238350, 238390, 2389, 238910, 238990'],
        ['"Hard Hat"\n(31-33) Manufacturing', '31-33, 3111, 311111, 311119, 3112, 311211, 311212, 311213, 311221, 311224, 311225, 311230, 3113, 311313, 311314, 311340, 311351, 311352, 3114, 311411, 311412, 311421, 311422, 311423, 3115, 311511, 311512, 311513, 311514, 311520, 3116, 311611, 311612, 311613, 311615, 3117, 311710, 3118, 311811, 311812, 311813, 311821, 311824, 311830, 3119, 311911, 311919, 311920, 311930, 311941, 311942, 311991, 311999, 3121, 312111, 312112, 312113, 312120, 312130, 312140, 3122, 312230, 3131, 313110, 3132, 313210, 313220, 313230, 313240, 3133, 313310, 313320, 3141, 314110, 314120, 3149, 314910, 314994, 314999, 3151, 315110, 315190, 3152, 315210, 315220, 315240, 315280, 3159, 315990, 3161, 316110, 3162, 316210, 3169, 316992, 316998, 3211, 321113, 321114, 3212, 321211, 321212, 321213, 321214, 321219, 3219, 321911, 321912, 321918, 321920, 321991, 231992, 321999, 3221, 322110, 322121, 322122, 322130, 3222, 322211, 322212, 322219, 322220, 322230, 322291, 322299, 3231, 323111, 323113, 323117, 323120, 3241, 324110, 324121, 324122, 324191, 324199, 3251, 325110, 325120, 325130, 325180, 325193, 325194, 325199, 3252, 325211, 325212, 325220, 3253, 325311, 325312, 325314, 325320, 3254, 325411, 325412, 325413, 325414, 3255, 325510, 325520, 3256, 325611, 325612, 325613, 325620, 3259, 325910, 325920, 325991, 325992, 325998, 3261, 326111, 326112, 326113, 326121, 326122, 326130, 326140, 326150, 326160, 326191, 326199, 3262, 326211, 326212, 326220, 326291, 326299, 3271, 327110, 327120, 3272, 327211, 327212, 327213, 327215, 3273, 327310, 327320, 327331, 327332, 327390, 3274, 327410, 327420, 3279, 327910, 327991, 327992, 327993, 327999, 3311, 331110, 3312, 331210, 331221, 331222, 3313, 331313, 331314, 331315, 331318, 3314, 331410, 331420, 331491, 331492, 3315, 331511, 331512, 331513, 331523, 331524, 331529, 3321, 332111, 332112, 332114, 332117, 332119, 3322, 332215, 332216, 3323, 332311, 332312, 332313, 332321, 332322, 332323, 3324, 332410, 332420, 332431, 332439, 3325, 332510, 3326, 332613, 332618, 3327, 332710, 332721, 332722, 3328, 332811, 332812, 332813, 3329, 332911, 332912, 332913, 332919, 332991, 332992, 332993, 332994, 332996, 332999, 3331, 333111, 333112, 333120, 333131, 333132, 3332, 333241, 333242, 333243, 333244, 333249, 3333, 333314, 333316, 333318, 3334, 333413, 333414, 333415, 3335, 333511, 333514, 333515, 333517, 333519, 3336, 333611, 333612, 333613, 333618, 3339, 333912, 333314, 333921, 333922, 333923, 333924, 333991, 333992, 333993, 333994, 333995, 333996, 333997, 333999, 3341, 334111, 334112, 334118, 3342, 334210, 334220, 334290, 3343, 334310, 3344, 334412, 334413, 334416, 334417, 334418, 334419, 3345, 334510, 334511, 334512, 334513, 334514, 334515, 334516, 334517, 334519, 3346, 334613, 334614, 3351, 335110, 335121, 335122, 335129, 3352, 335210, 335220, 3353, 335311, 335312, 335313, 335314, 3359, 335911, 335912, 335921, 335929, 335931, 335932, 335991, 335999, 3361, 336111, 336112, 336120, 3362, 336211, 336212, 336213, 336214, 3363, 336310, 336320, 336330, 336340, 336350, 336360, 336370, 336390, 3364, 336411, 336412, 336413, 336414, 336415, 336419, 3365, 336510, 3366, 336611, 336612, 3369, 336991, 336992, 336999, 3371,337110, 337121, 337122, 337124, 337125, 337127, 3372,  337211, 337212, 337214, 337215, 3379, 337910, 337920, 3391, 339112, 339113, 339114, 339115, 339116, 3399, 339910, 3399210, 339930, 339940, 339950, 339950, 339991, 339992, 339993, 339994, 339995, 339999'],
        ['"Hard Hat"\n(42) Wholesale Trade', '42, 4231, 423110, 423120, 423130, 423140, 4232, 423210, 423220, 4233,  423310, 423320, 423330, 423390, 4234, 423410, 423420, 423440, 423450, 423460, 423490, 4235, 423510, 423520, 4236, 423610, 423620, 423690, 4237, 423710, 423720, 423730, 423740, 4238, 423810, 423820, 423830, 423840, 423850, 423860, 4239, 423910, 423920, 423930, 423940, 423990, 4241, 424110, 424120, 424130, 4242, 424210, 4243, 424310, 424320, 424330, 424340, 4244, 424410, 424420, 424430, 424440, 424450, 424460, 424470, 424480, 424490, 4245, 424510, 424520, 424590, 4246, 424610, 424690, 4247, 424710, 424720, 4248, 424810, 424820, 4249, 424910, 424920, 424930, 424940, 424950, 424990, 4251, 425110, 425120'],
        ['"Hard Hat"\n(44-45) Retail Trade', '44-45, 4411, 441110, 441120, 4412, 441210, 441222, 441228, 4413, 441310, 441320, 4421, 442110, 4422, 442210, 442291, 442299, 4431, 443141, 443142, 4441, 444110, 444120, 444130, 444190, 4442, 444210, 444220, 4451, 445110, 445120, 4452, 445210, 445220, 445230, 445291, 445292, 445299, 4453, 445310, 4461, 446110, 446120, 446130, 446191, 446199, 4471, 447110, 447190, 4481,  448110, 448120, 448130, 448140, 448150, 448190, 4482, 448210, 4483, 448310, 448320, 4511, 451110, 451120, 451130, 451140, 4512, 451211, 451212, 4522, 452210, 4523, 452311, 452319, 4531, 453110, 4532, 453210, 453220, 4533, 453310, 4539, 453910, 453920, 453930, 453991, 453998, 4541, 454110, 4542, 454210, 4543, 454310, 454390'],
        ['(51) Information', '51, 5111, 511110, 511120, 511130, 511140, 511191, 511199, 5112, 511210, 5121, 511210, 5121, 512110, 512120, 512131, 512132, 512191, 512199, 5122, 512230, 512240, 512250, 512290, 5151, 515111, 515112, 515120, 5152, 515210, 5173, 517311, 517312, 5174, 517410, 5179, 517911, 517919, 5182, 518210, 5191, 519110, 519120, 519130, 519190'],
        ['(52) Finance and Infrastructure', '52, 5211, 521110, 5221, 522110, 522120, 522130, 522190, 5222, 522210, 522220, 522291, 522292, 522293, 522298, 5223, 522310, 522320, 522390, 5231, 523110, 523120, 523130, 523140, 5232, 523210, 5239, 523910, 523920, 523930, 523991, 523999, 5241, 524113, 524114, 524126, 524127, 524128, 524130, 5242, 524210, 524291, 524292, 524298, 5251, 525110, 525120, 525190, 5259, 525910, 525920, 525990'],
        ['(54) Professional, Scientific, Technological Services', '54, 5411, 541110, 541120, 541191, 541199, 5412, 541211, 541213, 541214, 541219, 5413,  541310, 541320, 541330, 541340, 541350, 541360, 541370, 541380, 5414, 541410, 541420, 541430, 541490, 5415, 541511, 541512, 541513, 541519, 5416, 541611, 541612, 541613, 541614, 541618, 541620, 541690, 5417, 541713, 541714, 541715, 541720, 5418, 541810, 541820, 541830, 541840, 541850, 541860, 541870, 541890, 5419, 541910, 541921, 541922, 541930, 541940, 541990'],
        ['"Admin. Services"\n(56) Administrative and Support and Waste Management and Remediation Services', '56, 5611, 561110, 5612, 561210, 5613, 561311, 561312, 561320, 561330, 5614, 561410, 561421, 561422, 561431, 561439, 561440, 561450, 561491, 561492, 561499, 5615, 561510, 561520, 561591, 561599, 5616, 561611, 561612, 561613, 561621, 561622, 5617, 561710, 561720, 561730, 561740, 561790, 5619, 561910, 561920, 561990, 5621, 562111, 562112, 562119, 5622, 562211, 562212, 562213, 562219, 5629, 562910, 562920, 562991, 562998'],
        ['(61) Educational Services', '61, 6111, 611110, 6112, 611210, 6113, 611310, 6114, 611410, 611420, 611430, 6115, 611511, 611512, 611513, 611519, 6116, 611610, 611620, 611630, 611691, 611692, 611699, 6117, 611710'],
        ['(62) Health Care and Social Assistance ', '62, 6211, 621111, 621112, 6212, 621210, 6213, 621310, 621320, 621330, 621340, 621391, 621399, 6214, 621410, 621420, 621491, 621492, 621493, 621498, 6215, 621511, 621512, 6216, 621610, 6219, 621910, 621991, 621999, 6221, 622110, 6222, 622210, 6223, 622310, 6231, 623110, 6232, 623210, 623220, 6233, 623311, 623312, 6239, 623990, 6241, 624110, 624120, 624190, 6242, 624210, 624221, 624229, 624230, 6243, 624310, 6244, 624410'],
        ['(81) Other Services (Except Public Administration)', '81, 811, 8111, 81111, 811111, 811112, 811113, 811118, 81112, 811121, 811122, 81119, 811191, 811192, 811198, 8112, 81121, 811211, 811212, 811213, 811219, 8113, 81131, 811310, 8114, 81141, 811411, 811412, 81142, 811420, 81143, 811430, 81149, 811490, 812, 8121, 81211, 812111, 812112, 812113, 81219, 812191, 81299, 8122, 81221, 812210, 81222, 812220, 8123, 81231, 812310, 81232, 812320, 81233, 812331, 812332, 8129, 81291, 812910, 81292, 812921, 812922, 81293, 812930, 81299, 812990, 813, 8131, 81311, 813110, 8132, 81321, 813211, 813212, 813219, 8133, 81331, 813311, 813312, 813319, 8134, 81341, 813410, 8139, 81391, 813910, 81392, 813920, 81393, 813930, 81394, 813940, 81399, 813990, 814, 8141, 81411, 814110']
      ]
    }
  }
});
