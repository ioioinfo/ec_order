var _ = require('lodash');
var EventProxy = require('eventproxy');

var orders = function(server) {
	return {
		//pos端
		//退单查询
		search_return_order: function(order_id,cb){
			var query = `select id, order_id, marketing_price, actual_price, order_date, DATE_FORMAT(order_date,'%Y-%m-%d %H:%i:%S') order_date_text, order_status, store_id, pos_id
				from orders
				where order_id like "`+ order_id +`_%" and flag = 0 order by order_date desc
			`;
			console.log(query);
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
		//保存退单
		save_pos_return:function(order_id,actual_price,index, cb) {
			var query = `insert into orders (id, order_id,marketing_price, actual_price,
				order_date, order_status, operation_system, origin, pos_id, pay_way,store_id,small_change,operation_person,
				created_at, updated_at, flag)

				select uuid(),?,?,?,
				now(), 6 , operation_system, origin, pos_id,
				pay_way,store_id,small_change,operation_person,
				now(),now(),0 from orders where order_id = ?
				` ;
			var id = order_id+"_"+index;
			var columns=[id, -actual_price, -actual_price, order_id];
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					results.id = id;
					cb(false,results);
				});
			});
		},
		//保存采购订单
		save_orders : function(order_id,person_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,operation_person, cb) {
			var query = `insert into orders (id, order_id, person_id, vip_id, gain_point, card_reduce,
			marketing_price, actual_price,order_date, order_status, operation_system, origin, pos_id, pay_way,store_id,small_change,operation_person,
			created_at, updated_at, flag)
			values
			(uuid(),?,?,?,?,?,
		 	?,?,now(),2,?,?,?,?,?,?,?,
			now(),now(),0)` ;
			console.log(query);
			var columns=[order_id,person_id, vip_id, actual_price, marketing_price-actual_price, marketing_price,actual_price,operation_system,origin,pos_id,pay_way,store_id,small_change,operation_person];
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
		update_order_status: function(order_id,order_status,changes,ready_pay,cb){
			var query = "update orders set order_status =?, changes =?,ready_pay=? where order_id =?"
			var columns = [order_status,changes,ready_pay,order_id];
			console.log(columns);
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
				actual_price,order_date,DATE_FORMAT(order_date,'%Y-%m-%d %H:%i:%S') order_date_text,order_status,store_id,pos_id
				from orders
				where order_id =? and flag =0 order by order_date desc
			`;
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
		get_all_orders :  function(params,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,small_change,changes,marketing_price,ready_pay,
			actual_price,order_date,DATE_FORMAT(order_date,'%Y-%m-%d %H:%i:%S') order_date_text,order_status,store_id,pos_id from orders where flag =0 `;

			var colums=[];
			if (params.order_id) {
				query = query + " and order_id = ? ";
				colums.push(params.order_id);
			}
			if (params.sort.dir) {
				query = query +" order by order_date "+ params.sort.dir;
			}else {
				query = query +" order by order_date desc";
			}
			if (params.thisPage) {
				var offset = params.thisPage-1;
				if (params.everyNum) {
					query = query + " limit " + offset*params.everyNum + "," + params.everyNum;
				}else {
					query = query + " limit " + offset*20 + ",20";
				}
			}
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,colums, function(err, results) {
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
		//根据条件查询总数量
		get_all_num :  function(params,cb){
			var query = `select count(*) num from orders where flag =0`;
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
			actual_price,order_date,order_status,store_id,pos_id,DATE_FORMAT(created_at,'%Y-%m-%d')created_at_text from orders where flag =0 and order_status = 4 and order_date >`+`'`+date1+`'`+` and order_date <`+`'`+date2+`'`+`order by created_at asc `;
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
		//根据personid和日期查询订单
		get_member_orders: function(person_id,date1,date2,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,small_change,changes,marketing_price,ready_pay,
			actual_price,order_date,order_status,store_id,pos_id from orders where flag =0 and person_id = ? and order_date > ? and order_date < ?`;
			var columns = [person_id,date1,date2];
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,columns, function(err, results) {
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
		get_front_orders :  function(person_id,cb){
			var query = `select order_id,person_id,
			actual_price,DATE_FORMAT(order_date,'%Y-%m-%d %H:%i:%S') order_date_text,store_id
			from orders where flag =0
			and
			person_id = ?
			and order_status = "4"
			`;

			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [person_id],function(err, results) {
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
