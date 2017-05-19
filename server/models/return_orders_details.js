var _ = require('lodash');
var EventProxy = require('eventproxy');
const uuidV1 = require('uuid/v1');

var return_orders_details = function(server) {
	return {
		//查询单条退单
		search_return_order: function(id,cb){
			var query = `select id,order_id,person_id,return_status,logistics_id,product_id,
			logistics_company,return_reason,number,created_at from return_orders_details
			where flag = 0 and id = ?`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, id, function(err, results) {
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

		//查询退货单列表
		search_return_list: function(person_id,cb){
			var query = `select id,order_id,person_id,return_status,logistics_id,product_id,
			logistics_company,return_reason,number,created_at,DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text from return_orders_details
			where flag = ?`;
			var columns = [0];
			if (person_id && person_id!="") {
				query = query +" and person_id = ?";
				columns.push(person_id);
			}
			query = query +" order by created_at desc";
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

		//更新状态
		update_return_status: function(id,status,cb){
			var query = "update return_orders_details set return_status =? where id =?"
			var columns = [status,id];
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

        create_return_apply: function(id,order_id,person_id,product_id,return_reason,number,other_reason,cb) {
			var query = `insert into return_orders_details(id, order_id, person_id, product_id, return_reason, number, other_reason, return_status, created_at, updated_at, flag)
			values
			(?, ?, ?, ?, ?,
			?, ?, 0, now(), now(), 0)
			`;
			var columns=[id,order_id,person_id,product_id,return_reason,number,other_reason];
            server.plugins.mysql.query(query, columns, function(err, rows) {
                if (err) {
                    console.log(err);
                    cb(err,null);
                }
                cb(err,rows);
            });
        },


	};
};

module.exports = return_orders_details;
