var _ = require('lodash');
var EventProxy = require('eventproxy');

var online_orders_details = function(server) {
	return {
		//保存订单详细
		save_online_orders_detail: function(order_detail,cb) {
			var query = `insert into online_orders_details(id, order_id, product_id, order_index, number, price, marketing_price, total_price, sku_id,
			created_at, updated_at, flag)
			values (
				uuid(), ?, ?,
				?, ?, ?, ?, ?, ?,
				now(), now(), 0
			)` ;
			var columns=[order_detail.order_id, order_detail.product_id, order_detail.order_index, order_detail.number, order_detail.price, order_detail.marketing_price, order_detail.total_price, order_detail.sku_id];

			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
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

module.exports = online_orders_details;
