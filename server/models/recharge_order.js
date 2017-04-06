var _ = require('lodash');
var EventProxy = require('eventproxy');

var recharge_order = function(server) {
	return {
		//保存充值订单
		save_order : function(order_id,activity_id,person_id,marketing_price,actual_price,pay_way, cb) {
			var query = `insert into recharge_order (id, order_id, activity_id, person_id, marketing_price,
			actual_price, pay_way,order_status,created_at, updated_at, flag)
			values
			(uuid(),?,?,?,?,
		 	?,?,-1,now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,activity_id,person_id,marketing_price,actual_price,pay_way];
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

module.exports = recharge_order;
