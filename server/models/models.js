// Base routes for default index/root path, about page, 404 error pages, and others..
exports.register = function(server, options, next){

	server.expose('orders', require('./orders.js')(server));
	server.expose('order_details', require('./order_details.js')(server));
	next();
}

exports.register.attributes = {
    name: 'models'
};
