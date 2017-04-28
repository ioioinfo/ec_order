var _ = require('lodash');
var EventProxy = require('eventproxy');

var ec_orders = function(server) {
	return {
		//单个订单查询
		get_order : function(order_id, cb){
			var query = `select order_id,person_id,gain_point,card_reduce,
				total_number,logistics_price,actual_price,send_seller,weight,
				linkname,detail_address,mobile,province,city,district,cancel_reason,
				products_price,order_date,order_status,store_id,pay_way,created_at
				from ec_orders
				where flag =0 and order_id = ?
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

		//订单列表
		mp_orders_list : function(cb){
			var query = `select order_id,person_id,gain_point,card_reduce,
				total_number,logistics_price,actual_price,send_seller,weight,
				linkname,detail_address,mobile,province,city,district,cancel_reason,
				products_price,order_date,order_status,store_id,pay_way,created_at,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') order_date_text
				from ec_orders
				where flag =0
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, function(err, results) {
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
		mp_orders_count : function(cb){
			var query = `select count(1) num
				from ec_orders
				where flag =0
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, function(err, results) {
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


		//获取一个人所有订单信息
		get_ec_orders :  function(person_id,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,
				total_number,logistics_price,actual_price,send_seller,
				products_price,order_date,order_status,store_id,pay_way,created_at
				from ec_orders
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
			var query = `select order_id,person_id,gain_point,card_reduce,mobile,
			total_number,logistics_price,actual_price,linkname,detail_address,send_seller,
			products_price,order_date,order_status,store_id,pay_way,created_at
			from ec_orders where order_id=? and flag =0`;
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
			var query = `update ec_orders set order_status = ?
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
		save_order_infos :function(order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,logistics_price,actual_price,send_seller,address, cb) {
			var address = JSON.parse(address);
			var linkname = address.linkname;
			var detail_address = address.detail_address;
			var mobile = address.mobile;
			var province = address.province;
			var city = address.city;
			var district = address.district;

			var query = `insert into ec_orders(id, order_id, person_id, gain_point,
				linkname,detail_address,mobile,province,city,district,
				products_price, total_number, weight, order_status, origin, logistics_price,
				actual_price, send_seller,created_at,updated_at, flag)
				values
				(uuid(),?,?,?,
				?,?,?,?,?,?,
				?,?,?,?,?,?,
				?,?,now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,person_id,gain_point,linkname,detail_address,mobile,province,city,district,products_price,total_number,weight,order_status,origin,logistics_price,actual_price,send_seller];
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

module.exports = ec_orders;
