var _ = require('lodash');
var EventProxy = require('eventproxy');

var orders = function(server) {
	return {
		//保存订单
		save_orders : function(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin, cb) {
			var query = `insert into orders (id, order_id, person_id, gain_point, card_reduce,
			total_price, actual_price, order_date, order_status, operation_system, origin, pos_id,
			created_at, updated_at, flag)
			values
			(uuid(),?,?,?,?,
		 	?,?,now(),4,?,?,?,
			now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,vip_id, marketing_price, marketing_price-actual_price, marketing_price,actual_price,operation_system,origin,pos_id];
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

module.exports = orders;
