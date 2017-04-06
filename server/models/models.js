// Base routes for default index/root path, about page, 404 error pages, and others..
exports.register = function(server, options, next){

	server.expose('orders', require('./orders.js')(server));
	server.expose('order_details', require('./order_details.js')(server));
	server.expose('ec_orders', require('./ec_orders.js')(server));
	server.expose('ec_orders_details', require('./ec_orders_details.js')(server));
	server.expose('order_addresses', require('./order_addresses.js')(server));
	server.expose('order_logistics', require('./order_logistics.js')(server));
	server.expose('normal_invoices', require('./normal_invoices.js')(server));
	server.expose('recharge_order', require('./recharge_order.js')(server));
	server.expose('event_solution', require('./event_solution.js')(server));
	next();
}

exports.register.attributes = {
    name: 'models'
};
