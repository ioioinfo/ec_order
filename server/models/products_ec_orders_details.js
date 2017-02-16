var _ = require('lodash');
var EventProxy = require('eventproxy');

var products_ec_orders_details = function(server) {
	return {
		//获取所有订单详细
		search_ec_order_details: function(order_ids,cb){
			var query = `select order_id,product_id,number,price,order_index,marketing_price,total_price
				from products_ec_orders_details where order_id in (?) and flag =0`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [order_ids], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},


	};
};

module.exports = products_ec_orders_details;
