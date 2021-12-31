if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
  
define([], function () {
    return {
        "tables": [
        {
            "name": "Test",
            "element": "amount-spent", //TODO: what does this element do?
            "operations": {SUM: true, STD: true},
            "cohortOperations": {SUM: true},
            "hot_parameters": {
            "rowHeaderWidth": 150,
            "height": 230,
            "colWidths": [150],
            "stretchH": "none"
            },
            "rows": [
            {
                "key": "local",
                "label": "Test"
            }
            ],
            "cols": [
            [
                {
                "key": "value",
                "label": "Test"
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
                "sheet": "Test",
                "start": "B2",
                "end": "B2",
                "firstrow": "Test"
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
        'cohort_selection': true,
        'cohorts': [
            {name: 'Cohort 1'},
            {name: 'Cohort 2'},
        ],
        'cohort_threshold': 0,
        'send_submitter_ids': true
    };
});