var _ = require('lodash');
var EventProxy = require('eventproxy');

var order_details = function(server) {
	return {
		//保存订单详情
		save_order_details : function(order_id, products, cb) {
			var query = `insert into order_details (id, order_id, product_id, order_index, number,
			price, discount, total_price, discount_price, created_at, updated_at, flag)
			values ` ;
			var columns = []
			for (var i = 0; i < products.length; i++) {
				if (i == products.length -1) {
					query = query + `(uuid(),?,?,?,?,?,?,?,?,now(),now(),0)`;
				}else {
					query = query + `(uuid(),?,?,?,?,?,?,?,?,now(),now(),0),`;
				}
				columns.push(order_id);
				columns.push(products[i].product_id);
				columns.push(products[i].order_index);
				columns.push(products[i].product_number);
				columns.push(products[i].product_price);
				columns.push(products[i].product_discount);
				columns.push(products[i].discount_product_price);
			}
			console.log(query);
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
		//查询订单详细 批量
		search_order_details: function(order_id,cb){
			var query = `select order_id,product_id,number,price,discount,total_price,discount_price from order_details where order_id =? and flag =0`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [order_id], function(err, results) {
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

module.exports = order_details;
