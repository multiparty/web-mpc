/**
 * Route definitions.
 * Each object in the module.exports array is a single route.
 * Each object must define a url suffix for the route, a route function, a joi validation schema, and an optional authentication function.
 *
 * The route function is of type function(request_body{object}, response{express response}, [ authentication_output])
 *    where authentication_output is the result of the authentication function.
 *
 * Validation schema must be defined using the joi library, check ./app/validation.js for examples.
 *
 * The authentication function must be of type function(request_body{object}, response{express response}, callback{function{boolean, object}})
 *    where callback must be called with parameters (false, <error_string_message>) if authentication fails
 *           or with parameters (true, <optional_output_object>) if authentication is successfull.
 *
 * Validation is performed automatically, followed by authentication if provided. Any failures here will result
 * in a 500 response code, with the appropriate error message. If both are sucessfull, the route function is executed.
 */

// JOI validation schemas
const validation = require('./app/validation.js');
const auth = require('./modules/auth.js');

// Route functionality
const managementRoutes = require('./app/management.js');
const submissionRoutes = require('./app/submission.js');
const aggregateRoutes = require('./app/aggregate.js');

// Route map
module.exports = [
  // Management routes
  { url: '/create_session', route: managementRoutes.createSession, validation: validation.createSession },
  { url: '/fetch_status', route: managementRoutes.getStatus, validation: validation.getStatus },
  { url: '/change_status', route: managementRoutes.setStatus, validation: validation.setStatus, authentication: auth.password },
  { url: '/generate_client_urls', route: managementRoutes.createClientUrls, validation: validation.createClientUrls, authentication: auth.password },
  { url: '/get_client_urls', route: managementRoutes.getClientUrls, validation: validation.getClientUrls, authentication: auth.password },
  { url: '/get_data', route: managementRoutes.getSubmissionHistory, validation: validation.getSubmissionHistory, authentication: auth.password },

  // Data submission routes
  { url: '/publickey', route: submissionRoutes.getPublicKey, validation: validation.getPublicKey },
  { url: '/sessioninfo', route: submissionRoutes.getSessionInfo, validation: validation.getSessionInfo, authentication: auth.userKey },
  { url: '/', route: submissionRoutes.submitData, validation: validation.submitData, authentication: auth.userKey },

  // Final aggregation routes
  { url: '/get_masks', route: aggregateRoutes.getMasks, validation: validation.getMasks, authentication: auth.password },
  { url: '/get_cubes', route: aggregateRoutes.getCubes, validation: validation.getCubes, authentication: auth.password },
  { url: '/get_aggregate', route: aggregateRoutes.getAggregate, validation: validation.getAggregate, authentication: auth.password },
];
