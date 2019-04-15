if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  return {
    "tables":[
      {
        "name":"Number Of Employees",
        "element":"number-employees-hot",
        "hot_parameters":{
          "rowHeaderWidth":200,
          "height":425
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
          "height":425
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
          "height":425
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
          "height":425
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
    // "survey":{
    //   "header":"Answer Additional Questions",
    //   "directions":"We have included these questions to get instant feedback as to how this process went in order to improve the process in future years. Please know that the answers to these questions will be anonymous, and they will be considered separately from the encrypted and aggregated data above.",
    //   "questions":[
    //     {
    //       "question_text":"Which department are you in?",
    //       "input_type":"radio",
    //       "inputs":[
    //         {
    //           "label":"Human Resources (e.g. HR Manager, HRIS Manager, Compensation Manager, Talent & Development)",
    //           "value":"1"
    //         },
    //         {
    //           "label":"Operations (e.g. Director of Operations)",
    //           "value":"2"
    //         },
    //         {
    //           "label":"Diversity (e.g. Chief Diversity Officer)",
    //           "value":"3"
    //         },
    //         {
    //           "label":"Upper Management (e.g. COO, CEO, Executive Director)",
    //           "value":"4"
    //         },
    //         {
    //           "label":"Human Resources (e.g. HR Manager, HRIS Manager, Compensation Manager, Talent & Development)",
    //           "value":"5"
    //         }
    //       ]
    //     },
    //     {
    //       "question_text":"What kind of HRIS or organizational system does your company/organization use?",
    //       "input_type":"radio",
    //       "inputs":[
    //         {
    //           "label":"Large-scale traditional HRIS/HRMS software (e.g. ADP, Workday, PeopleSoft, etc.)",
    //           "value":"1"
    //         },
    //         {
    //           "label":"Microsoft Office or similar (e.g. Excel, Microsoft Word, Google Docs)",
    //           "value":"2"
    //         },
    //         {
    //           "label":"Other",
    //           "value":"3"
    //         }
    //       ]
    //     },
    //     {
    //       "question_text":"How easy was it to understand what data was required given the template and instructions?",
    //       "input_type":"radio",
    //       "inputs":[
    //         {
    //           "label":"Extremely easy",
    //           "value":"1"
    //         },
    //         {
    //           "label":"Moderately easy",
    //           "value":"2"
    //         },
    //         {
    //           "label":"Slightly easy",
    //           "value":"3"
    //         },
    //         {
    //           "label":"Neither easy nor difficult",
    //           "value":"4"
    //         },
    //         {
    //           "label":"Slightly difficult",
    //           "value":"5"
    //         },
    //         {
    //           "label":"Moderately difficult",
    //           "value":"6"
    //         },
    //         {
    //           "label":"Extremely difficult",
    //           "value":"7"
    //         }
    //       ]
    //     },
    //     {
    //       "question_text":"How easy was it to prepare the data for submission given your organizational system?",
    //       "input_type":"radio",
    //       "inputs":[
    //         {
    //           "label":"Extremely easy",
    //           "value":"1"
    //         },
    //         {
    //           "label":"Moderately easy",
    //           "value":"2"
    //         },
    //         {
    //           "label":"Slightly easy",
    //           "value":"3"
    //         },
    //         {
    //           "label":"Neither easy nor difficult",
    //           "value":"4"
    //         },
    //         {
    //           "label":"Slightly difficult",
    //           "value":"5"
    //         },
    //         {
    //           "label":"Moderately difficult",
    //           "value":"6"
    //         },
    //         {
    //           "label":"Extremely difficult",
    //           "value":"7"
    //         }
    //       ]
    //     },
    //     {
    //       "question_text":"How long did it take to prepare the data for submission given your organizational system?",
    //       "input_type":"radio",
    //       "inputs":[
    //         {
    //           "label":"Less than 1 business day",
    //           "value":"1"
    //         },
    //         {
    //           "label":"1-3 business days",
    //           "value":"2"
    //         },
    //         {
    //           "label":"4-7 business days",
    //           "value":"3"
    //         },
    //         {
    //           "label":"7-10 business days",
    //           "value":"4"
    //         },
    //         {
    //           "label":"Greater than 10 business days",
    //           "value":"5"
    //         }
    //       ]
    //     }
    //   ]
    // },
    'usability': [
      'data_prefilled', 
      {'time_spent': ['page', 'review-and-submit']},
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
  }
});
