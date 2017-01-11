var _ = require('lodash');
var EventProxy = require('eventproxy');

var pay_ways = function(server) {
	return {
		//保存付款方式
		save_pay_way : function(order_id,serial_number,person_id,pay_way,pay_amount,cb) {
			var query = `insert into pay_ways (id, order_id, serial_number,
			person_id, pay_way, pay_amount,
			created_at, updated_at, flag)
			values
			(uuid(),?,?,
		 	?,?,?,
			now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,serial_number,person_id,pay_way,pay_amount];
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

module.exports = pay_ways;
