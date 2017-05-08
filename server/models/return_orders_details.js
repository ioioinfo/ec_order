var _ = require('lodash');
var EventProxy = require('eventproxy');
const uuidV1 = require('uuid/v1');

var return_orders_details = function(server) {
	return {
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

        create_return_apply: function(id,order_id,person_id,product_id,return_reason,number,cb) {
			var query = `insert into return_orders_details(id, order_id, person_id, product_id, return_reason, number, return_status, created_at, updated_at, flag)
			values
			(?, ?, ?, ?, ?,
			?, 0, now(), now(), 0)
			`;
			var columns=[id,order_id,person_id,product_id,return_reason,number];
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
