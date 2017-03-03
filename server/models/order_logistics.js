var _ = require('lodash');
var EventProxy = require('eventproxy');

var order_logistics = function(server) {
	return {
		//查询运单号
		get_logistics_id : function(order_id,cb){
			var query = `select logistics_id,order_id,transport_way from
			order_logistics where order_id=? and flag =0`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[order_id], function(err, results) {
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
		//更新收货时间
		update_receive_time : function(order_id,cb){
			var query = `update order_logistics set received_at = now()
			where order_id = ? and flag =0`;
			server.plugins['mysql'].query(query,[order_id], function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},
		//保存物流信息
		save_logistcs_info : function(order_id,amount,cb) {
			var query = `insert into order_logistics (logistics_id,order_id,actual_payment,
			created_at, updated_at, flag)
			values
			(uuid(),?,?,
			now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,amount];
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

module.exports = order_logistics;
