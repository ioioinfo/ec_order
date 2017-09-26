var _ = require('lodash');
var EventProxy = require('eventproxy');

var online_orders = function(server) {
	return {
		//查询订单状态
		search_online_by_status : function(person_id,order_status,cb){
			var query = `select order_id, person_id,
				total_number, actual_price, products_price,
                order_date, order_status, pay_way,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
                from online_orders
				where flag = 0 and order_status in (?) and person_id = ?` ;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[order_status,person_id], function(err, results) {
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
		search_online_orders:  function(order_ids, cb){
			var query = `select order_id, person_id,
				total_number, actual_price, products_price,
                order_date, order_status, pay_way,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
                from online_orders where flag = 0 and order_id in (?)
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
        //获得所有订单
        get_online_orders : function(info, cb){
            var query = `select order_id, person_id,
				total_number, actual_price, products_price,
                order_date, order_status, pay_way,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
                from online_orders where flag = 0
            `;
			var colums=[];
			if (info.order_status) {
				query = query + " and order_status in (?) ";
				colums.push(info.order_status);
			}

            if (info.thisPage) {
                var offset = info.thisPage-1;
                if (info.everyNum) {
                    query = query + " limit " + offset*info.everyNum + "," + info.everyNum;
                }else {
                    query = query + " limit " + offset*20 + ",20";
                }
            }
            server.plugins['mysql'].query(query,colums, function(err, results) {
                if (err) {
                    console.log(err);
                    cb(true,results);
                    return;
                }
                cb(false,results);
            });
        },
        account_online_orders : function(info, cb){
            var query = `select count(1) num
            from online_orders where flag = 0
            `;

            server.plugins['mysql'].query(query, function(err, results) {
                if (err) {
                    console.log(err);
                    cb(true,results);
                    return;
                }
                cb(false,results);
            });
        },
        // 保存
		save_online_orders : function(order, cb){
			var query = `insert into online_orders(id, order_id, person_id,
				products_price, total_number, weight, order_status,
                actual_price, created_at, updated_at,flag)
				values
				(?, ?, ?,
				?, ?, ?, -1,
				?, now(), now(),0)
			`;
			var coloums = [order.id, order.order_id, order.person_id,
				order.products_price, order.total_number, order.weight,
                order.actual_price];
			server.plugins['mysql'].query(query, coloums, function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},
        //id查询
		search_online_by_id : function(id, cb){
			var query = `select order_id, person_id,
				total_number, actual_price, products_price,
                order_date, order_status, pay_way,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
                from online_orders where flag = 0 and id = ?
			`;
			server.plugins['mysql'].query(query,[id],function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},
        //person_id查询
        search_online_by_personid : function(person_id, cb){
			var query = `select order_id, person_id,
				total_number, actual_price, products_price,
                order_date, order_status, pay_way,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
                from online_orders where flag = 0 and person_id = ?
			`;
			server.plugins['mysql'].query(query,[person_id],function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},
        //删除
        delete_online:function(id, cb){
            var query = `update online_orders set flag = 1, updated_at = now()
                where id = ? and flag =0
                `;
            server.plugins['mysql'].query(query, [id], function(err, results) {
                if (err) {
                    console.log(err);
                    cb(true,results);
                    return;
                }
                cb(false,results);
            });
        },
		//更新订单状态
		update_online_status : function(id, order_status, cb){
			var query = `update online_orders set order_status = ?,updated_at = now()
			where id = ? and flag =0`;
			server.plugins['mysql'].query(query,[order_status,id], function(err, results) {
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

module.exports = online_orders;
