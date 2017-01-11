var _ = require('lodash');
var EventProxy = require('eventproxy');

var orders = function(server) {
	return {
		//保存订单
		save_orders : function(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id, cb) {
			var query = `insert into orders (id, order_id, person_id, gain_point, card_reduce,
			total_price, actual_price, order_date, order_status, operation_system, origin, pos_id, pay_way,store_id,
			created_at, updated_at, flag)
			values
			(uuid(),?,?,?,?,
		 	?,?,now(),2,?,?,?,?,?,
			now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,vip_id, marketing_price, marketing_price-actual_price, marketing_price,actual_price,operation_system,origin,pos_id,pay_way,store_id];
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
		//更新订单状态
		update_order_status: function(order_id,order_status,cb){
			var query = "update orders set order_status =? where order_id =?"
			var columns = [order_status,order_id];
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
		//查询订单
		search_order: function(order_id,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,total_price,
			actual_price,order_date,order_status,store_id,pos_id from orders where order_id =? and flag =0`;
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

module.exports = orders;
