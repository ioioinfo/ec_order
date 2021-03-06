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
		//查询订单状态
		get_order : function(order_id, cb){
			var query = `select id, order_id, activity_id, person_id,
				marketing_price, actual_price, serial_number, pay_way,
				pay_date, order_status, created_at
				from recharge_order
				where flag =0 and order_id = ? order by created_at desc
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[order_id], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,null);
						return;
					}
					cb(false,results);
				});
			});
		},
		//更新订单状态
		update_order_status : function(order_id,order_status,cb){
			var query = `update recharge_order set order_status = ?
			where order_id = ? and flag =0`;
			server.plugins['mysql'].query(query,[order_status,order_id], function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},
		//获得所有充值订单
		get_recharge_orders : function(params,cb){
			var query = `select id, order_id, activity_id, person_id,
				marketing_price, actual_price, serial_number, pay_way,
				pay_date, order_status, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S')created_at
				from recharge_order
				where flag =0
			`;
			var colums=[];
			if (params.order_id) {
				query = query + " and order_id = ? ";
				colums.push(params.order_id);
			}
			query = query + `order by created_at desc`;
			if (params.thisPage) {
				var offset = params.thisPage-1;
				if (params.everyNum) {
					query = query + " limit " + offset*params.everyNum + "," + params.everyNum;
				}else {
					query = query + " limit " + offset*20 + ",20";
				}
			}
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, colums, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,null);
						return;
					}
					cb(false,results);
				});
			});
		},

		//订单数量
		recharge_orders_count : function(params,cb){
			var query = `select count(1) num
				from recharge_order
				where flag =0
			`;
			var colums=[];
			if (params.order_id) {
				query = query + " and order_id = ? ";
				colums.push(params.order_id);
			}
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,colums, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,null);
						return;
					}
					cb(false,results);
				});
			});
		},

	};
};

module.exports = recharge_order;
