var _ = require('lodash');
var EventProxy = require('eventproxy');

var ec_orders = function(server) {
	return {
		//获取所有线上订单信息
		get_online_orders_data:  function(date, cb){
			var query = `select e.order_id 'order_id', d.product_id 'id', p.product_name 'product_name', s.sort_name 'sort_name', p.origin 'origin', d.number 'number', d.price 'price', d.total_price 'total_price', e.order_status 'order_status', e.person_id 'person_id', e.logistics_price 'logistics_price', e.actual_price 'actual_price', e.total_number 'total_number',  DATE_FORMAT(e.created_at,'%Y-%m-%d') 'created_at'

				from ec_orders  e

				left join ec_orders_details d

				on e.order_id = d.order_id

				left join ec_product.products p

				on d.product_id = p.id

				left join ec_product.products_sorts s

				on p.sort_id = s.id

				where  e.order_status not in ('-1','0','7','9')
			`;
			if (date.date1 && date.date2) {

				query = query + ` and e.created_at >= '` + date.date1 + `' ` + ` and e.created_at <='`+ date.date2+`' `;

			}
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
		//获取所有带批次的订单
		search_batch_orders:  function(cb){
			var query = `select order_id,person_id,gain_point,card_reduce,logistic_id,batch_no,
				total_number,logistics_price,actual_price,send_seller,type,linkname,
				mobile,detail_address,updated_at,
				products_price,order_date,order_status,store_id,pay_way,created_at,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
				from ec_orders
				where flag =0 and batch_no is not null
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,function(err, results) {
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
		//更新订单批次
		update_order_batch : function(order_id,batch_no,cb){
			var query = `update ec_orders set batch_no = ?,updated_at = now()
			where order_id = ? and flag =0`;
			server.plugins['mysql'].query(query,[batch_no,order_id], function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},
		//获取所有订单信息
		search_orders:  function(order_ids, cb){
			var query = `select order_id,person_id,gain_point,card_reduce,logistic_id,
				total_number,logistics_price,actual_price,send_seller,type,linkname,
				mobile,detail_address,updated_at,
				products_price,order_date,order_status,store_id,pay_way,created_at,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
				from ec_orders
				where flag =0 and order_id in (?)
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[order_ids],function(err, results) {
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
		//获取所有订单信息
		get_orders_list :  function(cb){
			var query = `select order_id,person_id,gain_point,card_reduce,logistic_id,
				total_number,logistics_price,actual_price,send_seller,type,linkname,
				mobile,detail_address,updated_at,
				products_price,order_date,order_status,store_id,pay_way,created_at,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
				from ec_orders
				where flag =0
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,function(err, results) {
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
		//单个订单查询
		get_order : function(order_id, cb){
			var query = `select id,order_id,person_id,gain_point,card_reduce,type,
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
		mp_orders_list : function(params,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,type,
				total_number,logistics_price,actual_price,send_seller,weight,
				linkname,detail_address,mobile,province,city,district,cancel_reason,
				products_price,order_date,order_status,store_id,pay_way,created_at,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') order_date_text,store_name
				from ec_orders
				where flag =0
			`;
			var colums=[];
			if (params.order_id) {
				query = query + " and order_id = ? ";
				colums.push(params.order_id);
			}
			if (params.linkname) {
				query = query + " and linkname = ? ";
				colums.push(params.linkname);
			}
			if (params.mobile) {
				query = query + " and mobile = ? ";
				colums.push(params.mobile);
			}
			if (params.status) {
				query = query + " and order_status in (?) ";
				colums.push(params.status);
			}

			if (params.sort && params.sort.dir) {
				query = query +" order by created_at "+ params.sort.dir;
			}else {
				query = query +" order by created_at desc";
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
						cb(true,null);
						return;
					}
					cb(false,results);
				});
			});
		},

		//订单数量
		mp_orders_count : function(params,cb){
			var query = `select count(1) num
				from ec_orders
				where flag =0
			`;
			var colums=[];
			if (params.order_id) {
				query = query + " and order_id = ? ";
				colums.push(params.order_id);
			}
			if (params.linkname) {
				query = query + " and linkname = ? ";
				colums.push(params.linkname);
			}
			if (params.mobile) {
				query = query + " and mobile = ? ";
				colums.push(params.mobile);
			}
			if (params.status) {
				query = query + " and order_status in (?) ";
				colums.push(params.status);
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

		//获取一个人所有订单信息
		get_ec_orders :  function(person_id,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,
				total_number,logistics_price,actual_price,send_seller,type,
				products_price,order_date,order_status,store_id,pay_way,created_at
				from ec_orders
				where flag =0 and user_flag = 0 and person_id=? order by created_at desc
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
		//获取一个人批次订单信息
		get_batch_orders :  function(person_id,batch_no,cb){
			var query = `select order_id,person_id,gain_point, card_reduce, batch_no,
				total_number,logistics_price,actual_price,send_seller,type,
				products_price,order_date,order_status,store_id,pay_way,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S')created_at
				from ec_orders
				where flag =0 and user_flag = 0 and person_id=? and batch_no = ? order by created_at desc
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[person_id,batch_no], function(err, results) {
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
			var query = `select order_id,person_id,gain_point,card_reduce,mobile,type,
			total_number,logistics_price,actual_price,linkname,detail_address,send_seller,district,
			products_price,order_date,order_status,store_id,pay_way,DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S')created_at,province,city
			from ec_orders where order_id=? and flag =0 `;
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
		//查询订单状态
		search_order_byStatus : function(person_id,order_status,cb){
			var query = `select order_id,person_id,gain_point,card_reduce,mobile,type,
			total_number,logistics_price,actual_price,linkname,detail_address,send_seller,
			products_price,order_date,order_status,store_id,pay_way,created_at
			from ec_orders where person_id = ? and flag = 0 and user_flag = 0 and order_status in (?)` ;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[person_id,order_status], function(err, results) {
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
		//客户删除d订单
		user_delete : function(order_id,cb){
			var query = `update ec_orders set user_flag = 1, updated_at = now()
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
		//更新订单状态
		update_order_status : function(order_id,order_status,cb){
			var query = `update ec_orders set order_status = ?,updated_at = now()
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
		//更新订单状态
		order_cancel : function(order_id,cancel_reason,order_status,cb){
			var query = `update ec_orders set order_status = ?, cancel_reason = ?
			where order_id = ? and flag =0`;
			server.plugins['mysql'].query(query,[order_status,cancel_reason,order_id], function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},
		//保存订单信息
		save_order_infos :function(id,order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,logistics_price,actual_price,send_seller,address, cb) {
			var address = JSON.parse(address);
			var linkname = address.linkname;
			var detail_address = address.detail_address;
			var mobile = address.mobile;
			var province = address.province;
			var city = address.city;
			var district = address.district;
			var type = address.type;
			var store_name = address.mendians_list[0];
			var query = `insert into ec_orders(id, order_id, person_id, gain_point,
				linkname,detail_address,mobile,province,city,district,type,
				products_price, total_number, weight, order_status, origin, logistics_price,
				actual_price, send_seller,created_at,updated_at,flag,store_name)
				values
				(?,?,?,?,
				?,?,?,?,?,?,?,
				?,?,?,?,?,?,
				?,?,now(),now(),0,?)` ;

			var columns=[id,order_id,person_id,gain_point,linkname,detail_address,mobile,province,city,district,type,products_price,total_number,weight,order_status,origin,logistics_price,actual_price,send_seller,store_name];
			console.log("columns:"+columns);
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
		save_order_infos2 :function(id,order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,logistics_price,actual_price,send_seller,address,store_name,type, cb) {
			var address = JSON.parse(address);
			var linkname = address.linkname;
			var detail_address = address.detail_address;
			var mobile = address.mobile;
			var province = address.province;
			var city = address.city;
			var district = address.district;

			var query = `insert into ec_orders(id, order_id, person_id, gain_point,
				linkname,detail_address,mobile,province,city,district,type,
				products_price, total_number, weight, order_status, origin, logistics_price,
				actual_price, send_seller,created_at,updated_at, flag, store_name)
				values
				(?,?,?,?,
				?,?,?,?,?,?,?,
				?,?,?,?,?,?,
				?,?,now(),now(),0,?)` ;
			console.log(query);
			var columns=[id,order_id,person_id,gain_point,linkname,detail_address,mobile,province,city,district,type,products_price,total_number,weight,order_status,origin,logistics_price,actual_price,send_seller,store_name];
			console.log("columns:"+columns);
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
		//删除订单
		order_delete : function(order_id,cb){
			var query = `update ec_orders set flag = 1
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


	};
};

module.exports = ec_orders;
