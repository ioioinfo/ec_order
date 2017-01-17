var _ = require('lodash');
var EventProxy = require('eventproxy');

var orders = function(server) {
	return {
		//保存订单
		save_orders : function(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,ready_pay, cb) {
			var query = `insert into orders (id, order_id, person_id, gain_point, card_reduce,
			marketing_price, actual_price, ready_pay,order_date, order_status, operation_system, origin, pos_id, pay_way,store_id,small_change,
			created_at, updated_at, flag)
			values
			(uuid(),?,?,?,?,
		 	?,?,now(),2,?,?,?,?,?,?,?,
			now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,vip_id, actual_price, marketing_price-actual_price, marketing_price,actual_price,ready_pay,operation_system,origin,pos_id,pay_way,store_id,small_change];
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
		update_order_status: function(order_id,order_status,change,cb){
			var query = "update orders set order_status =?, changes =? where order_id =?"
			var columns = [order_status,change,order_id];
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
			var query = `select order_id,person_id,gain_point,card_reduce,small_change,changes,marketing_price,ready_pay,
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
		//获取所有订单信息
		get_all_orders :  function(cb){
			var query = `select order_id,person_id,gain_point,card_reduce,small_change,changes,marketing_price,ready_pay,
			actual_price,order_date,order_status,store_id,pos_id from orders where flag =0`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, function(err, results) {
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
		//根据日期查询订单
		get_orders_byDate :  function(date1,date2,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,small_change,changes,marketing_price,ready_pay,
			actual_price,order_date,order_status,store_id,pos_id from orders where flag =0 and order_date >`+`'`+date1+`'`+` and order_date <`+`'`+date2+`'`;
			console.log("query:"+query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, function(err, results) {
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
