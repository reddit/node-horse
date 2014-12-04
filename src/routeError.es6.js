class RouteError extends Error {
  constructor (route) {
    this.name = 'RouteError';
    this.message = 'No route found for ' + route;
    this.status = 404;
  }
}

export default RouteError;
