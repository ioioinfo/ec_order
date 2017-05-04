var _ = require('lodash');
var EventProxy = require('eventproxy');

var event_solution = function(server) {
	return {
		search_deal_event : function(id,cb){
			var query = `select event_id from event_solution where event_id =? and is_deal = 1 and flag = 0` ;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [id], function(err, result) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,null);
						return;
					}
					cb(false,result);
				});
			});
		},
		save_event : function(id, is_deal, cb) {
			console.log("is_deal:"+is_deal);
			var query = `insert into event_solution (event_id , is_deal,
			created_at, updated_at, flag)
			values
			(?, ?, now(), now(), 0)` ;
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [id,is_deal], function(err, results) {
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
		update_event_status : function(id,is_deal,cb){
			var query = `update ec_orders set is_deal = ?
			where event_id = ? and flag =0`;
			server.plugins['mysql'].query(query,[is_deal,id], function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},


	};
};

module.exports = event_solution;
