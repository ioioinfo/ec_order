var _ = require('lodash');
var EventProxy = require('eventproxy');

var products_ec_orders = function(server) {
	return {
		//获取一个人所有订单信息
		get_ec_orders :  function(person_id,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,total_number,logistics_price,actual_price,
				products_price,order_date,order_status,store_id,pay_way,created_at
				from products_ec_orders
				where flag =0 and person_id=?
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[person_id], function(err, results) {
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
		//获取一个人单条订单信息
		get_ec_order :  function(order_id,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,total_number,logistics_price,actual_price,
			products_price,order_date,order_status,store_id,pay_way,created_at from products_ec_orders where order_id=? and flag =0`;
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
		//更新订单状态
		update_order_status : function(order_id,order_status,cb){
			var query = `update products_ec_orders set order_status = ?
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
		//保存订单信息
		save_order_infos :function(order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,logistics_price,actual_price, cb) {
			var query = `insert into products_ec_orders(id, order_id, person_id, gain_point,
				products_price, total_number, weight, order_status, origin, logistics_price,actual_price, created_at,
				updated_at, flag) values (uuid(), ?, ?, ?, ?, ?,
				?, ?, ?, ?, ?, now(), now(), 0)` ;
			console.log(query);
			var columns=[order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,logistics_price,actual_price];
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

module.exports = products_ec_orders;
