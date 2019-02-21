if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  return {
    "tables":[
      {
        "name":"Female Workforce",
        "element":"female-employees-hot",
        "hot_parameters":{
          "rowHeaderWidth":200
        },
        "rows":[
          {
            "key":"Ex/Sen",
            "label":"Executive"
          },
          {
            "key":"Mid",
            "label":"Mid Level"
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
          },
          {
            "key": "sum",
            "label":"Sum Annual Compensation"
          },
          {
            "key": "sum",
            "label":"Sum Annual Cash Performance"
          },
          {
            "key": "sum",
            "label":"Sum Length of Service"
          }
        ],
        "cols":[
          [
            {
              "label":"Hispanic/Latino"
            },
            {
              "label":"White"
            },
            {
              "label":"Black/African American"
            },
            {
              "label":"Native Hawaiian or <br> Pacific Islander"
            },
            {
              "label":"Asian"
            },
            {
              "label":"American Indian/Alaska <br> Native"
            },
            {
              "label":"Two or More Races (Not<br> Hispanic or Latino)"
            },
            {
              "label":"Other"
            },
            {
              "key": "sum",
              "label":"Sum Annual <br> Compensation"
            },
            {
              "key": "sum",
              "label":"Sum Annual Cash <br> Performance Pay"
            },
            {
              "key": "sum",
              "label":"Sum Length of <br> Service"
            },
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
        ]
      },
      {
        "name":"Male Workforce",
        "element":"male-employees-hot",
        "hot_parameters":{
          "rowHeaderWidth":200
          // "height":425
        },
        "rows":[
          {
            "key":"Ex/Sen",
            "label":"Executive"
          },
          {
            "key": "Mid",
            "label":"Mid Level"
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
          },
          {
            "key": "sum",
            "label":"Sum Annual Compensation"
          },
          {
            "key": "sum",
            "label":"Sum Annual Cash Performance"
          },
          {
            "key": "sum",
            "label":"Sum Length of Service"
          }
        ],
        "cols":[
          [
            {
              "label":"Hispanic/Latino"
            },
            {
              "label":"White"
            },
            {
              "label":"Black/African American"
            },
            {
              "label":"Native Hawaiian or <br> Pacific Islander"
            },
            {
              "label":"Asian"
            },
            {
              "label":"American Indian/Alaska <br> Native"
            },
            {
              "label":"Two or More Races (Not<br> Hispanic or Latino)"
            },
            {
              "label":"Other"
            },
            {
              "key": "sum",
              "label":"Sum Annual <br> Compensation"
            },
            {
              "key": "sum",
              "label":"Sum Annual Cash <br> Performance Pay"
            },
            {
              "key": "sum",
              "label":"Sum Length of <br> Service"
            },
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
        ]
      }
    ]
  }
});
