var _ = require('lodash');
var EventProxy = require('eventproxy');

var ec_orders_details = function(server) {
	return {
		//获取所有订单详细
		search_ec_order_details: function(order_ids,cb){
			var query = `select order_id,product_id,number,price,order_index,marketing_price,total_price
				from ec_orders_details where order_id in (?) and flag =0`;
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
		//保存订单详细
		save_ec_order_details: function(order_id,product_id,order_index,number,price,marketing_price,total_price,sku_id,cb) {
			var query = `insert into ec_orders_details(id, order_id, product_id, order_index,
				number, price, marketing_price, total_price,sku_id, created_at, updated_at,
				flag) values (uuid(), ?, ?, ?, ?, ?, ?, ?, ?,now(), now(), 0)` ;
			console.log(query);
			var columns=[order_id,product_id,order_index,number,price,marketing_price,total_price,sku_id];
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

module.exports = ec_orders_details;
